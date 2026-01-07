import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Sparkles, Crown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GuestActionLimitModalProps {
  open: boolean;
  onClose: () => void;
  action?: string;
  message?: string;
}

export default function GuestActionLimitModal({ open, onClose, action, message: customMessage }: GuestActionLimitModalProps) {
  const [, setLocation] = useLocation();

  if (!open) return null;

  const message = customMessage || (action 
    ? `This feature (${action}) requires a full account. Sign up to continue!` 
    : "This feature requires a full account. Sign up to continue!");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl" />

        <div className="relative bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 rounded-2xl shadow-2xl border-2 border-purple-200 dark:border-purple-800 p-8 overflow-hidden">
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-20"
          >
            <X className="w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
          </button>

          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
          </div>

          <div className="relative space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-xl opacity-50" />
                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-full">
                  <Crown className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Guest Limit Reached
              </h3>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>Unlock Full Access</span>
                <Sparkles className="h-4 w-4 text-pink-500" />
              </div>
            </div>

            <p className="text-center text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              {message}
            </p>

            <div className="space-y-2 bg-white/50 dark:bg-black/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span>Save unlimited stories</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span>Export to PDF & EPUB</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span>Advanced editing features</span>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setLocation("/signup")}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg">
                <Crown className="mr-2 h-5 w-5" />
                Create Free Account
              </Button>
            </motion.div>

            <p className="text-center text-xs text-muted-foreground">
              No credit card required • Start creating in seconds
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
