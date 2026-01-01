import { Switch, Route, useLocation } from "wouter";
import { Suspense, lazy, useEffect, type ComponentType } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ScrollToTop from "@/components/ScrollToTop";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { StructuredData } from "@/components/StructuredData";
import { organizationSchema } from "@/components/StructuredData";
import { websiteSchema } from "@/components/StructuredData";

const Home = lazy(() => import("@/pages/home"));
const Landing = lazy(() => import("@/pages/landing"));
const Signup = lazy(() => import("@/pages/signup"));
const Signin = lazy(() => import("@/pages/signin"));
const RecoverPassword = lazy(() => import("@/pages/recover-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const VerifyEmail = lazy(() => import("@/pages/verify-email"));
const VerifyEmailSent = lazy(() => import("@/pages/verify-email-sent"));
const Checkout = lazy(() => import("@/pages/checkout"));
const Settings = lazy(() => import("@/pages/settings"));
const Subscription = lazy(() => import("@/pages/subscription"));
const TemplateBooks = lazy(() => import("@/pages/template-books"));
const Help = lazy(() => import("@/pages/help"));
const FAQ = lazy(() => import("@/pages/faq"));
const Support = lazy(() => import("@/pages/support"));
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminUser = lazy(() => import("@/pages/admin/users"));
const AdminEarlyAccess = lazy(() => import("@/pages/admin/early-access"));
const AdminPlans = lazy(() => import("@/pages/admin/plans"));
const AdminPromotions = lazy(() => import("@/pages/admin/promotions"));
const AdminSupport = lazy(() => import("@/pages/admin/support"));
const AdminSettings = lazy(() => import("./pages/admin/settings"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  const { isAuthenticated, isLoading, isAdminAuthenticated, adminLoading } = useAuth();

  // Root redirect handler - redirect to /home or /dashboard based on auth
  const RootRedirect = () => {
    const [, setLocation] = useLocation();
    
    useEffect(() => {
      if (!isLoading) {
        if (isAuthenticated) {
          setLocation('/dashboard');
        } else {
          setLocation('/home');
        }
      }
    }, [isLoading, isAuthenticated, setLocation]);
    
    // Show loading while deciding where to redirect
    if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>;
    }
    
    return null;
  };

  // Protected route wrapper - redirect to /home if not authenticated
  const ProtectedRoute = ({ component: Component }: { component: ComponentType }) => {
    const [, setLocation] = useLocation();
    
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        setLocation('/home');
      }
    }, [isLoading, isAuthenticated, setLocation]);
    
    if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>;
    }
    if (!isAuthenticated) {
      return null;
    }
    return <Component />;
  };

  const AdminProtectedRoute = ({ component: Component }: { component: ComponentType }) => {
    const [, setLocation] = useLocation();

    useEffect(() => {
      if (!adminLoading && !isAdminAuthenticated) {
        setLocation('/admin/signin');
      }
    }, [adminLoading, isAdminAuthenticated, setLocation]);
    
    if (adminLoading) {
      return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>;
    }
    if (!isAdminAuthenticated) {
      return null;
    }
    return <Component />;
  };

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <Switch>
        <Route path="/">
          {() => <RootRedirect />}
        </Route>
        <Route path="/home">
          {() => <Landing />}
        </Route>
        <Route path="/signup">
          {() => <Signup />}
        </Route>
        <Route path="/signin">
          {() => <Signin />}
        </Route>
        <Route path="/recover-password">
          {() => <RecoverPassword />}
        </Route>
        <Route path="/reset-password">
          {() => <ResetPassword />}
        </Route>
        <Route path="/verify-email">
          {() => <VerifyEmail />}
        </Route>
        <Route path="/verify-email-sent">
          {() => <VerifyEmailSent />}
        </Route>
        <Route path="/checkout">
          {() => <Checkout />}
        </Route>
        <Route path="/dashboard">
          {() => <ProtectedRoute component={Home} />}
        </Route>
        <Route path="/dashboard/template-books">
          {() => <ProtectedRoute component={TemplateBooks} />}
        </Route>
        <Route path="/settings">
          {() => <ProtectedRoute component={Settings} />}
        </Route>
        <Route path="/subscription">
          {() => <ProtectedRoute component={Subscription} />}
        </Route>
        <Route path="/privacypolicy">
          {() => <PrivacyPolicy />}
        </Route>
        <Route path="/termsofservice">
          {() => <TermsOfService />}
        </Route>
        <Route path="/help">
          {() => <ProtectedRoute component={Help} />}
        </Route>
        <Route path="/faq">
          {() => <ProtectedRoute component={FAQ} />}
        </Route>
        <Route path="/support">
          {() => <ProtectedRoute component={Support} />}
        </Route>
        <Route path="/admin/signin">
          {() => <AdminLogin />}
        </Route>
        <Route path="/admin/dashboard">
          {() => <AdminProtectedRoute component={AdminDashboard} />}
        </Route>
        <Route path="/admin/settings">
          {() => <AdminProtectedRoute component={AdminSettings} />}
        </Route>
        <Route path="/admin/users">
          {() => <AdminProtectedRoute component={AdminUser} />}
        </Route>
        <Route path="/admin/early-access">
          {() => <AdminProtectedRoute component={AdminEarlyAccess} />}
        </Route>
        <Route path="/admin/plans">
          {() => <AdminProtectedRoute component={AdminPlans} />}
        </Route>
        <Route path="/admin/promotions">
          {() => <AdminProtectedRoute component={AdminPromotions} />}
        </Route>
        <Route path="/admin/support">
          {() => <AdminProtectedRoute component={AdminSupport} />}
        </Route>
        <Route>
          {() => <NotFound />}
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <StructuredData data={organizationSchema} />
          <StructuredData data={websiteSchema} />
          <Toaster />
          <Router />
          <ScrollToTop />
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
