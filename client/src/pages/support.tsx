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
  Plus,
  Send,
  Inbox,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Header from "@/components/Header";
import type {
  SupportTicket,
  SupportTicketWithMessages,
  SupportMessage,
} from "@shared/schema";

type MessageWithPending = SupportMessage & { isPending?: boolean };
type SupportTicketWithUnseenCount = SupportTicket & { unseenCount?: number };

export default function Support() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { data: tickets = [], isLoading } = useQuery<
    SupportTicketWithUnseenCount[]
  >({
    queryKey: ["/api/support/tickets"],
  });

  const {
    data: selectedTicket,
    refetch: refetchSelectedTicket,
    isLoading: isLoadingSelectedTicket,
  } = useQuery<SupportTicketWithMessages>({
    queryKey: ["/api/support/tickets", selectedTicketId],
    enabled: !!selectedTicketId,
    refetchOnMount: true,
    staleTime: 0,
  });

  const markAsSeenMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/support/tickets/${ticketId}/mark-seen`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/support/unseen-count"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/support/tickets", selectedTicketId],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      // Refetch to update unseen counts
      refetchSelectedTicket();
    },
  });

  useEffect(() => {
    if (selectedTicketId && selectedTicket) {
      const hasUnseenMessages = selectedTicket.messages?.some(
        (msg) => msg.senderType === "admin" && !msg.seenByUser
      );
      if (hasUnseenMessages) {
        markAsSeenMutation.mutate(selectedTicketId);
      }
    }
  }, [selectedTicketId, selectedTicket?.messages]);

  // Create new ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string }) => {
      const response = await apiRequest("POST", "/api/support/tickets", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      setShowNewTicketForm(false);
      setNewTicketSubject("");
      setNewTicketMessage("");
      setSelectedTicketId(data.id);
      toast({
        title: "Ticket created",
        description: "Your support ticket has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create ticket",
        description: error.message || "Failed to create support ticket",
        variant: "destructive",
      });
    },
  });

  // Add message mutation with optimistic updates
  const addMessageMutation = useMutation({
    mutationFn: async (data: { ticketId: string; message: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/support/tickets/${data.ticketId}/messages`,
        { message: data.message }
      );
      return response.json();
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ["/api/support/tickets", variables.ticketId],
      });
      const previousTicket =
        queryClient.getQueryData<SupportTicketWithMessages>([
          "/api/support/tickets",
          variables.ticketId,
        ]);

      if (previousTicket) {
        const optimisticMessage: MessageWithPending = {
          id: `pending-${Date.now()}`,
          ticketId: variables.ticketId,
          senderId: "",
          senderType: "user",
          message: variables.message,
          seenByUser: true,
          seenByAdmin: false,
          createdAt: new Date(),
          isPending: true,
        };

        queryClient.setQueryData<SupportTicketWithMessages>(
          ["/api/support/tickets", variables.ticketId],
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
        queryKey: ["/api/support/tickets", variables.ticketId],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      if (selectedTicketId === variables.ticketId) {
        await refetchSelectedTicket();
      }
      toast({
        title: "Message sent",
        description: "Your message has been sent to support.",
      });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(
          ["/api/support/tickets", variables.ticketId],
          context.previousTicket
        );
      }
      setReplyMessage(variables.message);
      toast({
        title: "Failed to send message",
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

  useEffect(() => {
    if (addMessageMutation.isPending && messagesContainerRef.current) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, [addMessageMutation.isPending]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }
    createTicketMutation.mutate({
      subject: newTicketSubject,
      message: newTicketMessage,
    });
  };

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="default" className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
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
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Inbox className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Support Inbox</h1>
            </div>
            <Button
              onClick={() => {
                setShowNewTicketForm(true);
                setSelectedTicketId(null);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Your Tickets</CardTitle>
                <CardDescription>
                  {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 text-center text-muted-foreground">
                    Loading...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No support tickets yet</p>
                    <p className="text-sm mt-2">
                      Create a new ticket to get help
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {tickets.map((ticket) => {
                      const unseenCount = ticket.unseenCount || 0;
                      const hasUnseen = unseenCount > 0;
                      return (
                        <button
                          key={ticket.id}
                          onClick={() => {
                            setSelectedTicketId(ticket.id);
                            setShowNewTicketForm(false);
                          }}
                          className={`w-full text-left p-4 hover:bg-muted transition-colors relative ${
                            selectedTicketId === ticket.id ? "bg-muted" : ""
                          } ${hasUnseen ? "font-semibold" : ""}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm truncate flex-1">
                              {ticket.subject}
                            </h3>
                            <div className="flex items-center gap-2">
                              {hasUnseen && (
                                <Badge
                                  variant="destructive"
                                  className="h-5 px-1.5 text-xs"
                                >
                                  {unseenCount > 99 ? "99+" : unseenCount}
                                </Badge>
                              )}
                              {getStatusBadge(ticket.status)}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(ticket.createdAt)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {showNewTicketForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Ticket</CardTitle>
                  <CardDescription>
                    Submit a new support request and we'll get back to you soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={newTicketSubject}
                        onChange={(e) => setNewTicketSubject(e.target.value)}
                        placeholder="What can we help you with?"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={newTicketMessage}
                        onChange={(e) => setNewTicketMessage(e.target.value)}
                        placeholder="Describe your issue or question in detail..."
                        className="mt-1.5 min-h-[200px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={createTicketMutation.isPending}
                      >
                        {createTicketMutation.isPending
                          ? "Creating..."
                          : "Create Ticket"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowNewTicketForm(false);
                          setNewTicketSubject("");
                          setNewTicketMessage("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : selectedTicket ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle>{selectedTicket.subject}</CardTitle>
                        {getStatusBadge(selectedTicket.status)}
                      </div>
                      <CardDescription>
                        Created {formatDate(selectedTicket.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 flex flex-col">
                  <div
                    ref={messagesContainerRef}
                    className={`h-[400px] ${
                      selectedTicket.messages.length > 0
                        ? "overflow-y-auto space-y-4 pr-2 scrollbar-custom"
                        : ""
                    }`}
                  >
                    {selectedTicket.messages &&
                    selectedTicket.messages.length > 0 ? (
                      selectedTicket.messages.map(
                        (message: MessageWithPending) => {
                          const isPending =
                            message.isPending ||
                            message.id?.startsWith("pending-");
                          const isUnseen =
                            message.senderType === "admin" &&
                            !message.seenByUser;
                          return (
                            <div
                              key={message.id}
                              className={`p-4 rounded-lg transition-opacity relative border border-border ${
                                message.senderType === "user"
                                  ? "bg-muted ml-auto max-w-[80%]"
                                  : "bg-primary/5 mr-auto max-w-[80%]"
                              } ${isPending ? "opacity-60" : ""}`}
                            >
                              {isUnseen && (
                                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
                              )}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold flex items-center gap-2">
                                  {message.senderType === "user"
                                    ? "You"
                                    : "Support Team"}
                                  {isUnseen && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs h-4 px-1.5"
                                    >
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
                      <div className="text-center text-muted-foreground py-8 h-full flex items-center justify-center">
                        No messages yet
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {selectedTicket.status !== "closed" && (
                    <form
                      onSubmit={handleSendReply}
                      className="space-y-4 border-t pt-4"
                    >
                      <div>
                        <Label htmlFor="reply">Add a message</Label>
                        <Textarea
                          id="reply"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your message here..."
                          className="mt-1.5 min-h-[100px]"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={
                          addMessageMutation.isPending || !replyMessage.trim()
                        }
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {addMessageMutation.isPending
                          ? "Sending..."
                          : "Send Message"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
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
                    Select a ticket from the list or create a new one
                  </p>
                  <Button
                    onClick={() => {
                      setShowNewTicketForm(true);
                      setSelectedTicketId(null);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Ticket
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
