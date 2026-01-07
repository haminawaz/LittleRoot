import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Sparkles, Crown } from "lucide-react";
import { motion } from "framer-motion";

interface UpgradeUserProps {
  show: boolean;
  message?: string;
}

export default function UpgradeUser({ show, message }: UpgradeUserProps) {
  const [, setLocation] = useLocation();

  if (!show) return null;

  const defaultMessage =
    "This feature requires a full account. Sign up to continue!";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-background/90 to-pink-900/20 backdrop-blur-lg" />

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative z-10 w-full max-w-md">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl" />

        <div className="relative bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 rounded-2xl shadow-2xl border-2 border-purple-200 dark:border-purple-800 p-8 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
          </div>

          <div className="relative space-y-6">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-xl opacity-50" />
                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-full">
                  <Crown className="h-12 w-12 text-white" />
                </div>
              </div>
            </motion.div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Upgrade to Continue
              </h3>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>Unlock Premium Features</span>
                <Sparkles className="h-4 w-4 text-pink-500" />
              </div>
            </div>

            <p className="text-center text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              {message || defaultMessage}
            </p>

            <div className="space-y-2 bg-white/50 dark:bg-black/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span>Save unlimited stories</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span>Access premium templates</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span>Priority support</span>
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
    </motion.div>
  );
}
