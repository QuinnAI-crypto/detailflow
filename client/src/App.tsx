import { Switch, Route, Router, useParams } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Scheduling from "@/pages/scheduling";
import Quotes from "@/pages/quotes";
import Messages from "@/pages/messages";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Onboarding from "@/pages/onboarding";
import BookingPage from "@/pages/booking";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import { auth } from "@/lib/auth";
import { useState, useEffect, useCallback } from "react";

function BookingRoute() {
  const params = useParams<{ userId: string }>();
  return <BookingPage userId={params.userId || "1"} />;
}

function AuthenticatedApp() {
  return (
    <Router hook={useHashLocation}>
      <AppShell>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/clients" component={Clients} />
          <Route path="/scheduling" component={Scheduling} />
          <Route path="/quotes" component={Quotes} />
          <Route path="/messages" component={Messages} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </AppShell>
    </Router>
  );
}

function UnauthenticatedApp() {
  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route component={Landing} />
      </Switch>
    </Router>
  );
}

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: auth.isAuthenticated(),
    user: auth.getUser(),
    checking: true,
  });

  // Check if current hash matches the public booking route
  const [hashPath, setHashPath] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHashPath(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const isBookingPage = hashPath.startsWith("#/book/");
  const isPublicPage = hashPath === "#/privacy" || hashPath === "#/terms";

  const syncAuth = useCallback(() => {
    setAuthState({
      isAuthenticated: auth.isAuthenticated(),
      user: auth.getUser(),
      checking: false,
    });
  }, []);

  useEffect(() => {
    const unsub = auth.subscribe(syncAuth);
    // On mount, check if already have token (they won't in sandbox, but check anyway)
    setAuthState((s) => ({ ...s, checking: false }));
    return unsub;
  }, [syncAuth]);

  const handleOnboardingComplete = () => {
    const user = auth.getUser();
    if (user) {
      user.onboardingComplete = true;
      auth.updateUser(user);
    }
  };

  if (authState.checking) {
    return null; // brief flash, acceptable
  }

  let content;
  if (isBookingPage) {
    content = (
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/book/:userId" component={BookingRoute} />
        </Switch>
      </Router>
    );
  } else if (isPublicPage) {
    content = (
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
        </Switch>
      </Router>
    );
  } else if (!authState.isAuthenticated) {
    content = <UnauthenticatedApp />;
  } else if (authState.user && !authState.user.onboardingComplete) {
    content = <Onboarding onComplete={handleOnboardingComplete} />;
  } else {
    content = <AuthenticatedApp />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {content}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
