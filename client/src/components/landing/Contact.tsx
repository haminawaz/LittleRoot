import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContactProps {
  handleEmailSubmit: (e: React.FormEvent) => void;
  signupMutation: ReturnType<typeof useMutation<unknown, Error, string>>;
  email: string;
  setEmail: (email: string) => void;
  isReturning: boolean;
  showSuccessModal: boolean;
  setShowSuccessModal: (show: boolean) => void;
  userCode: string;
}

const Contact = ({
  handleEmailSubmit,
  signupMutation,
  email,
  setEmail,
  isReturning,
  showSuccessModal,
  setShowSuccessModal,
  userCode,
}: ContactProps) => {
  return (
    <section className="py-8 md:py-16 lg:py-24" id="contact">
      <div
        className="py-8 md:py-16 lg:py-24 rounded-xl shadow-xl mx-4 md:mx-0"
        style={{
          background: `linear-gradient(to bottom right, #D946EF, #8B5CF6, #0EA5E9)`,
        }}
        data-aos="zoom-in"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div
              className="flex justify-center mb-4 md:mb-6"
              data-aos="fade-down"
              data-aos-delay="100"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#4BFFEC]/10 flex items-center justify-center">
                <Mail
                  className="h-6 w-6 md:h-8 md:w-8 text-white"
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <h2
              className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 md:mb-6"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              Don't Miss the Magic
            </h2>
            <p
              className="text-base md:text-lg lg:text-xl text-[#CAD5E2] mb-6 md:mb-8 leading-relaxed px-4"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              Sign up now to secure your{" "}
              <strong className="font-bold text-white">
                40% Early Access discount code
              </strong>
              . We'll also keep you updated on our launch date!
            </p>
            <form
              onSubmit={handleEmailSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-3 md:mb-4 px-4"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div className="relative flex-1">
                <Mail className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 md:pl-12 pr-4 bg-white border-gray-200 rounded-lg h-11 md:h-12 placeholder:text-[#90A1B9] text-sm md:text-base"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={signupMutation.isPending}
                className="bg-white hover:bg-white/90 text-black border border-gray-200 rounded-lg h-11 md:h-12 px-4 md:px-6 font-bold flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signupMutation.isPending ? "Processing..." : "Get Code"}
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </form>
            <p className="text-[#CAD5E2] text-xs md:text-sm px-4">
              No spam, just magic. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00D5BE] to-[#C27AFF] flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Early Access Locked In — Code: {userCode}
            </DialogTitle>
            <DialogDescription className="text-center pt-4 space-y-3">
              {isReturning ? (
                <>
                  <p className="text-base text-gray-700">
                    Welcome back! You're already on our Early Access list.
                  </p>
                  <p className="text-base text-gray-700">
                    Your code is still{" "}
                    <strong className="text-[#8200DB]">{userCode}</strong> —
                    you've secured 40% off your first 3 months!
                  </p>
                  <p className="text-sm text-gray-600">
                    We'll keep you updated with your invite, upcoming features,
                    and the official launch date. Keep a lookout for your email
                    – all updates will be sent there.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base text-gray-700 font-semibold">
                    Congrats! You've secured 40% off your first 3 months.
                  </p>
                  <p className="text-base text-gray-700">
                    You're officially on our Early Access list, and we'll keep
                    you updated with your invite, upcoming features, and the
                    official launch date. Keep a lookout for your email – all
                    updates will be sent there.
                  </p>
                  <p className="text-base text-gray-700">
                    During Early Access, you'll get to try the platform before
                    everyone else—your feedback will directly shape the final
                    version of our launch.
                  </p>
                  <p className="text-base font-semibold text-[#8200DB]">
                    Let the magic begin!
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="bg-[#00BBA7] hover:bg-[#00BBA7]/80 text-white rounded-full px-8 py-2"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Contact;
