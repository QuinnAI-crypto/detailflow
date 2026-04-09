import { useState } from "react";
import { useLocation } from "wouter";
import { auth } from "@/lib/auth";
import { DetailFlowLogo } from "@/components/DetailFlowLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordError =
    password.length > 0 && password.length < 8
      ? "Password must be at least 8 characters"
      : "";
  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== password
      ? "Passwords don't match"
      : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        ("__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__") + "/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, businessName }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
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
          <h1 className="text-lg font-bold font-display" data-testid="text-signup-title">
            Create your free account
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2" data-testid="text-signup-error">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="businessName" className="text-xs">Business Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="h-10 text-sm"
              placeholder="Your detail shop name"
              data-testid="input-signup-business"
            />
          </div>
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
              data-testid="input-signup-email"
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
              placeholder="Minimum 8 characters"
              data-testid="input-signup-password"
            />
            {passwordError && <p className="text-xs text-destructive mt-1">{passwordError}</p>}
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-10 text-sm"
              placeholder="Repeat password"
              data-testid="input-signup-confirm"
            />
            {confirmError && <p className="text-xs text-destructive mt-1">{confirmError}</p>}
          </div>
          <Button type="submit" className="w-full h-10" disabled={loading} data-testid="button-signup">
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Create free account"}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <button
            onClick={() => setLocation("/login")}
            className="text-primary hover:underline font-medium"
            data-testid="link-login"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
