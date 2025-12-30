import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, HelpCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { SEOHead } from "@/components/SEOHead";

export default function NotFound() {
  return (
    <>
      <SEOHead 
        title="LittleRoot Studios"
        description="The page you're looking for doesn't exist. Browse our art collection or return to the homepage."
        canonicalUrl="https://littlerootstudios.com/404"
      />
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md mx-4 shadow-lg">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-16 w-16 text-purple-500 mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Page Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Oops! The page you're looking for doesn't exist. Let's get you back on track.
              </p>
              
              <div className="flex flex-col gap-3 w-full">
                <Link href="/home">
                  <Button className="w-full" size="lg">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Homepage
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
