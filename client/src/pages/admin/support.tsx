import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  MessageSquare,
  Send,
  Inbox,
  Clock,
  CheckCircle,
  Search,
  User,
  XCircle,
} from "lucide-react";
import type {
  SupportTicket,
  SupportTicketWithMessages,
  SupportMessage,
} from "@shared/schema";
import AdminLayout from "@/components/AdminLayout";
import DeleteModal from "@/components/DeleteModal";

type MessageWithPending = SupportMessage & { isPending?: boolean };
type SupportTicketWithDetails = SupportTicket & {
  unseenCount: number;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
};

export default function AdminSupport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCloseTicketModal, setShowCloseTicketModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { data: tickets = [], isLoading } = useQuery<
    SupportTicketWithDetails[]
  >({
    queryKey: ["/api/admin/support/tickets"],
    refetchInterval: 10000,
    refetchOnMount: true,
    staleTime: 0,
  });

  const {
    data: selectedTicket,
    refetch: refetchSelectedTicket,
    isLoading: isLoadingSelectedTicket,
  } = useQuery<
    SupportTicketWithMessages & {
      user: { id: string; email: string; name: string } | null;
    }
  >({
    queryKey: ["/api/admin/support/tickets", selectedTicketId],
    enabled: !!selectedTicketId,
    refetchOnMount: true,
    staleTime: 0,
  });

  const markAsSeenMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/support/tickets/${ticketId}/mark-seen`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/support/unseen-count"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/support/tickets"],
      });
    },
  });

  const closeTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/support/tickets/${ticketId}/close`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/support/tickets"],
      });
      if (selectedTicketId) {
        refetchSelectedTicket();
      }
      toast({
        title: "Ticket Closed",
        description: "The support ticket has been closed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to close ticket",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (selectedTicketId && selectedTicket) {
      // Logic to mark as seen if there are unseen messages from USER
      const hasUnseenMessages = selectedTicket.messages?.some(
        (msg) => msg.senderType === "user" && !msg.seenByAdmin
      );
      if (hasUnseenMessages) {
        markAsSeenMutation.mutate(selectedTicketId);
      }
    }
  }, [selectedTicketId, selectedTicket?.messages]);

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async (data: { ticketId: string; message: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/support/tickets/${data.ticketId}/messages`,
        { message: data.message }
      );
      return response.json();
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ["/api/admin/support/tickets", variables.ticketId],
      });

      const previousTicket = queryClient.getQueryData<
        SupportTicketWithMessages & { user: any }
      >(["/api/admin/support/tickets", variables.ticketId]);

      if (previousTicket) {
        const optimisticMessage: MessageWithPending = {
          id: `temp-${Date.now()}`,
          ticketId: variables.ticketId,
          senderId: previousTicket.user?.id || "",
          senderType: "admin",
          message: variables.message,
          seenByUser: false,
          seenByAdmin: true,
          createdAt: new Date(),
          isPending: true,
        };

        queryClient.setQueryData(
          ["/api/admin/support/tickets", variables.ticketId],
          {
            ...previousTicket,
            messages: [...(previousTicket.messages || []), optimisticMessage],
          }
        );
      }
      setReplyMessage("");
      return { previousTicket };
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/support/tickets", variables.ticketId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/support/tickets"],
      });
      if (selectedTicketId === variables.ticketId) {
        await refetchSelectedTicket();
      }
    },
    onError: (error: any, variables, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(
          ["/api/admin/support/tickets", variables.ticketId],
          context.previousTicket
        );
      }
      setReplyMessage(variables.message);
      toast({
        title: "Failed to send reply",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [selectedTicket?.messages]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicketId) {
      return;
    }
    addMessageMutation.mutate({
      ticketId: selectedTicketId,
      message: replyMessage,
    });
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="default" className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline">
            <CheckCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "";
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-theme(spacing.20))]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Support Center</h1>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
          {/* Ticket List */}
          <Card className="lg:col-span-4 flex flex-col h-full border-r rounded-none lg:rounded-lg">
            <CardHeader className="py-4 px-4 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Inbox className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No tickets found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredTickets.map((ticket) => {
                    const hasUnseen = ticket.unseenCount > 0;
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`w-full text-left p-4 hover:bg-muted/50 transition-colors relative ${
                          selectedTicketId === ticket.id ? "bg-muted" : ""
                        } ${
                          hasUnseen ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                        }`}>
                        <div className="flex items-start justify-between mb-1">
                          <h3
                            className={`font-semibold text-sm truncate flex-1 ${
                              hasUnseen
                                ? "text-blue-600 dark:text-blue-400"
                                : ""
                            }`}>
                            {ticket.user?.name || "Unknown User"}
                          </h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatDate(ticket.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-medium truncate flex-1">
                            {ticket.subject}
                          </p>
                          {hasUnseen && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 text-xs bg-blue-100 text-blue-700 hover:bg-blue-100">
                              {ticket.unseenCount} new
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center mt-2 text-xs text-muted-foreground justify-between">
                          <span className="truncate">{ticket.user?.email}</span>
                          <div className="scale-90 origin-right">
                            {getStatusBadge(ticket.status)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-8 flex flex-col h-full overflow-hidden">
            {selectedTicket ? (
              <>
                <CardHeader className="py-4 px-6 border-b flex-shrink-0 bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold">
                          {selectedTicket.subject}
                        </h2>
                        {getStatusBadge(selectedTicket.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{selectedTicket.user?.name}</span>
                        <span>•</span>
                        <span>
                          Created {formatDate(selectedTicket.createdAt)}
                        </span>
                      </div>
                    </div>
                    {selectedTicket.status !== "closed" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowCloseTicketModal(true)}
                        disabled={closeTicketMutation.isPending}>
                        <XCircle className="h-4 w-4" />
                        Close Ticket
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-6 space-y-4">
                    {selectedTicket.messages &&
                    selectedTicket.messages.length > 0 ? (
                      selectedTicket.messages.map(
                        (message: MessageWithPending) => {
                          const isPending =
                            message.isPending ||
                            message.id?.startsWith("pending-");
                          const isAdmin = message.senderType === "admin";
                          const isUnseen = !isAdmin && !message.seenByAdmin;
                          return (
                            <div
                              key={message.id}
                              className={`p-4 rounded-lg transition-opacity relative border border-border ${
                                message.senderType === "admin"
                                  ? "bg-muted ml-auto max-w-[80%]"
                                  : "bg-primary/5 mr-auto max-w-[80%]"
                              } ${isPending ? "opacity-60" : ""}`}>
                              {isUnseen && (
                                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
                              )}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold flex items-center gap-2">
                                  {message.senderType === "admin"
                                    ? "You"
                                    : `${selectedTicket.user?.name}`}
                                  {isUnseen && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs h-4 px-1.5">
                                      New
                                    </Badge>
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  {isPending ? (
                                    <>
                                      <Clock className="h-3 w-3 animate-pulse" />
                                      <span>Pending</span>
                                    </>
                                  ) : (
                                    formatDate(message.createdAt)
                                  )}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">
                                {message.message}
                              </p>
                            </div>
                          );
                        }
                      )
                    ) : (
                      <div className="text-center text-muted-foreground py-10">
                        No messages yet
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t bg-background">
                    {selectedTicket.status === "closed" ? (
                      <div className="text-center py-4 bg-muted/50 rounded-lg text-muted-foreground">
                        This ticket is closed
                      </div>
                    ) : (
                      <form onSubmit={handleSendReply} className="flex gap-4">
                        <Textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type a reply..."
                          className="min-h-[80px]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendReply(e);
                            }
                          }}
                        />
                        <Button
                          type="submit"
                          disabled={
                            addMessageMutation.isPending || !replyMessage.trim()
                          }
                          className="h-full px-6">
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </>
            ) : isLoadingSelectedTicket && selectedTicketId ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <h3 className="text-lg font-semibold mb-2">
                      Loading messages...
                    </h3>
                    <p className="text-muted-foreground">
                      Please wait while we fetch the conversation
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    No ticket selected
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Select a ticket from the list
                  </p>
                </CardContent>
              </Card>
            )}
          </Card>
        </div>
      </div>

      <DeleteModal
        open={showCloseTicketModal}
        onOpenChange={setShowCloseTicketModal}
        title="Close Ticket"
        message="Are you sure you want to close this ticket? You can reopen it later if the user replies."
        confirmText="Close Ticket"
        onConfirm={() => {
          if (selectedTicket) {
            closeTicketMutation.mutate(selectedTicket.id);
          }
        }}
      />
    </AdminLayout>
  );
}
