import { Switch, Route, useLocation } from "wouter";
import { useEffect, type ComponentType } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import Signup from "@/pages/signup";
import Signin from "@/pages/signin";
import Checkout from "@/pages/checkout";
import Settings from "@/pages/settings";
import Subscription from "@/pages/subscription";
import TemplateBooks from "@/pages/template-books";
import Help from "@/pages/help";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

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
      return null; // Will redirect via useEffect
    }
    return <Component />;
  };

  return (
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
      <Route path="/help">
        {() => <ProtectedRoute component={Help} />}
      </Route>
      <Route>
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
