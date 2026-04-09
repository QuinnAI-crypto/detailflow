import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { auth } from "@/lib/auth";
import { DetailFlowLogo } from "@/components/DetailFlowLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        ("__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__") + "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      auth.setSession(data.token, data.user);
      setLocation("/");
    } catch (err: any) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <DetailFlowLogo className="w-12 h-12" />
          <h1 className="text-lg font-bold font-display" data-testid="text-login-title">
            Sign in to your account
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2" data-testid="text-login-error">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 text-sm"
              placeholder="you@example.com"
              data-testid="input-login-email"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-xs">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 text-sm"
              placeholder="••••••••"
              data-testid="input-login-password"
            />
          </div>
          <Button type="submit" className="w-full h-10" disabled={loading} data-testid="button-login">
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign in"}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Don't have an account?{" "}
          <button
            onClick={() => setLocation("/signup")}
            className="text-primary hover:underline font-medium"
            data-testid="link-signup"
          >
            Start free
          </button>
        </p>
      </div>
    </div>
  );
}
