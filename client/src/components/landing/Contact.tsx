import { Input } from "@/components/ui/input";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactProps {
  handleEmailSubmit: (e: React.FormEvent) => void;
  email: string;
  setEmail: (email: string) => void;
}

const Contact = ({ handleEmailSubmit, email, setEmail }: ContactProps) => {
  return (
    <section className="py-16 md:py-24">
      <div
        className="py-16 md:py-24 rounded-xl shadow-xl"
        style={{
          background: `linear-gradient(to bottom right, #D946EF, #8B5CF6, #0EA5E9)`,
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#4BFFEC]/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-white" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Don't Miss the Magic
            </h2>
            <p className="text-lg md:text-xl text-[#CAD5E2] mb-8 leading-relaxed">
              Sign up now to secure your{" "}
              <strong className="font-bold text-white">
                40% Early Access discount code
              </strong>
              . We'll also keep you updated on our launch date!
            </p>
            <form
              onSubmit={handleEmailSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-4"
            >
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 pr-4 bg-white border-gray-200 rounded-lg h-12 placeholder:text-[#90A1B9]"
                  required
                />
              </div>
              <Button
                type="submit"
                className="bg-white hover:bg-white/90 text-black border border-gray-200 rounded-lg h-12 px-6 font-bold flex items-center gap-2"
              >
                Get Code
                <ArrowRight className="h-5 w-5" />
              </Button>
            </form>
            <p className="text-[#CAD5E2] text-sm">
              No spam, just magic. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
