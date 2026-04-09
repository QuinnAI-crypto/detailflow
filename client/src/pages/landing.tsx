import { useLocation } from "wouter";
import { auth } from "@/lib/auth";
import { DetailFlowLogo } from "@/components/DetailFlowLogo";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  FileText,
  MessageSquare,
  Phone,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useState } from "react";

function DemoLogin({ onLogin }: { onLogin: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleDemo = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        ("__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__") + "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "demo@detailflow.app", password: "detailflow2026" }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        auth.setSession(data.token, data.user);
        onLogin();
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="h-11 px-6 text-sm gap-2 border-border"
      onClick={handleDemo}
      disabled={loading}
      data-testid="button-demo"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <>See it live <ArrowRight size={14} /></>}
    </Button>
  );
}

// Mini visual components for feature illustrations
function ScheduleVisual() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-primary" />
        <span className="text-xs font-semibold text-foreground">This Week</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {days.map((d, i) => (
          <div key={d} className="space-y-1">
            <p className="text-[10px] text-muted-foreground text-center">{d}</p>
            <div className={`h-12 rounded-md border ${i === 2 ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}>
              {i < 3 && (
                <div className={`mx-1 mt-1 h-3 rounded-sm text-[8px] px-1 ${i === 0 ? "bg-success/20 text-success" : i === 1 ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"}`}>
                  {i === 0 ? "Done" : i === 1 ? "In progress" : "9:30 AM"}
                </div>
              )}
              {i === 2 && <div className="mx-1 mt-0.5 h-3 rounded-sm text-[8px] px-1 bg-primary/20 text-primary">1:00 PM</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuoteVisual() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-primary" />
        <span className="text-xs font-semibold">Quote Builder</span>
      </div>
      <div className="space-y-1.5">
        {[
          { name: "Full Detail", price: "$190" },
          { name: "Ceramic Coating", price: "$450" },
          { name: "Headlight Restoration", price: "$75" },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-background border border-border">
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-medium">{item.price}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
        <span>Total</span>
        <span className="text-primary">$715</span>
      </div>
    </div>
  );
}

function MessageVisual() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={14} className="text-primary" />
        <span className="text-xs font-semibold">Marcus Thompson</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-end">
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 text-xs max-w-[85%]">
            <div className="flex items-center gap-1 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span className="text-[9px] text-primary font-medium">Auto</span>
            </div>
            Your appointment is confirmed for Monday at 9 AM.
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-muted rounded-lg px-3 py-1.5 text-xs max-w-[85%]">
            Thanks! Can you add a wipe-down too?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs max-w-[85%]">
            Absolutely! Updated to include Interior Vacuum & Wipe. Total: $110.
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessLineVisual() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Phone size={14} className="text-primary" />
        <span className="text-xs font-semibold">Business Line</span>
      </div>
      {/* Phone number status */}
      <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span className="text-sm font-medium font-display">(512) 555-0147</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-success/15 text-success font-medium">Active</span>
      </div>
      {/* Mini thread preview */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-primary">JR</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium truncate">Jake Rivera</p>
            <p className="text-[9px] text-muted-foreground truncate">How much for a full detail on my truck?</p>
          </div>
          <span className="text-[8px] text-muted-foreground shrink-0">2m</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-primary">AI</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium truncate flex items-center gap-1">
              <span className="text-primary">AI Reply</span>
              <span className="text-muted-foreground">→ Jake Rivera</span>
            </p>
            <p className="text-[9px] text-muted-foreground truncate">Full detail for trucks starts at $190. Want to book?</p>
          </div>
          <span className="text-[8px] text-muted-foreground shrink-0">now</span>
        </div>
      </div>
    </div>
  );
}

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    features: ["Up to 10 clients", "Manual scheduling", "Basic quotes", "1 user"],
    cta: "Start free",
    recommended: false,
  },
  {
    name: "Pro",
    price: "$89",
    period: "/mo",
    features: [
      "Unlimited clients",
      "Full calendar + AI scheduling",
      "AI auto-replies",
      "Automated SMS & email",
      "CRM + client history",
      "Quote builder",
      "Public booking page",
    ],
    cta: "Start Pro",
    recommended: true,
  },
  {
    name: "Shop",
    price: "$179",
    period: "/mo",
    features: [
      "Everything in Pro",
      "Multi-tech support (5 users)",
      "Analytics dashboard",
      "Review automation",
      "Route optimization",
      "Priority support",
    ],
    cta: "Start Shop",
    recommended: false,
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DetailFlowLogo className="w-7 h-7" />
            <span className="font-display font-bold text-sm">DetailFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm h-8"
              onClick={() => setLocation("/login")}
              data-testid="nav-signin"
            >
              Sign in
            </Button>
            <Button
              size="sm"
              className="text-sm h-8"
              onClick={() => setLocation("/signup")}
              data-testid="nav-signup"
            >
              Start free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold font-display leading-[1.15] tracking-tight" data-testid="text-hero">
              Run your detail shop.<br />Not the paperwork.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-4 max-w-lg leading-relaxed">
              DetailFlow handles scheduling, quoting, client tracking, and automated texts — so you can stay focused on the work.
            </p>
            <div className="flex items-center gap-3 mt-8">
              <Button
                size="lg"
                className="h-11 px-6 text-sm"
                onClick={() => setLocation("/signup")}
                data-testid="button-hero-signup"
              >
                Start free
              </Button>
              <DemoLogin onLogin={() => setLocation("/")} />
            </div>
          </div>
          <div className="hidden lg:block">
            {/* Dashboard mockup */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-destructive"></div>
                <div className="w-2 h-2 rounded-full bg-warning"></div>
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span className="text-[10px] text-muted-foreground ml-2">DetailFlow Dashboard</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Today's Jobs", value: "4", color: "text-primary" },
                  { label: "Revenue", value: "$680", color: "text-success" },
                  { label: "Pending", value: "3", color: "text-warning" },
                  { label: "Messages", value: "7", color: "text-primary" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-border bg-background p-2.5">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                    <p className={`text-base font-bold font-display mt-0.5 ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                {[
                  { client: "Marcus T.", time: "9:00 AM", status: "complete", color: "bg-success/15 text-success" },
                  { client: "Sarah C.", time: "11:00 AM", status: "in progress", color: "bg-warning/15 text-warning" },
                  { client: "David R.", time: "2:00 PM", status: "scheduled", color: "bg-primary/15 text-primary" },
                ].map((row) => (
                  <div key={row.client} className="flex items-center justify-between p-2 rounded-md border border-border bg-background">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                        <Calendar size={10} className="text-primary" />
                      </div>
                      <span className="text-xs font-medium">{row.client}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{row.time}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${row.color}`}>{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Built for professional detailers and detail shops</span>
          <span>AI-powered detailing CRM</span>
          <span>Works on any device</span>
          <span>Set up in 5 minutes</span>
        </div>
      </section>

      {/* Feature 1 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display" data-testid="text-feature-1">
              Your schedule, organized.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed max-w-md">
              Book appointments, track job status, and see your whole week at a glance. No more double bookings or forgotten follow-ups.
            </p>
          </div>
          <ScheduleVisual />
        </div>
      </section>

      {/* Feature 2 */}
      <section className="bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <QuoteVisual />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-xl sm:text-2xl font-bold font-display" data-testid="text-feature-2">
                Quotes in 30 seconds.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed max-w-md">
                Pick the vehicle, check the services, done. DetailFlow auto-calculates your price so you never have to do math mid-job.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display" data-testid="text-feature-3">
              AI texts your clients for you.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed max-w-md">
              Client asks about pricing? AI pulls your service menu and quotes instantly. Wants to book? AI suggests available times. All from your business number.
            </p>
          </div>
          <MessageVisual />
        </div>
      </section>

      {/* Feature 4 — Business Line */}
      <section className="bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <BusinessLineVisual />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-xl sm:text-2xl font-bold font-display" data-testid="text-feature-4">
                One number. Every client.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed max-w-md">
                Text-enable your existing business number or get a new dedicated line. Every text flows through DetailFlow — AI replies, you stay focused.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-card/30 border-y border-border" id="pricing">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-center mb-10" data-testid="text-pricing">
            Simple, transparent pricing
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-5 space-y-4 ${
                  plan.recommended
                    ? "border-primary bg-primary/5 relative"
                    : "border-border bg-card"
                }`}
                data-testid={`card-pricing-${plan.name.toLowerCase()}`}
              >
                {plan.recommended && (
                  <span className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                    RECOMMENDED
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold">{plan.name}</p>
                  <p className="mt-1">
                    <span className="text-2xl font-bold font-display">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check size={12} className="text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.recommended ? "default" : "outline"}
                  className="w-full h-9 text-sm"
                  onClick={() => {
                    if (plan.name === "Pro") {
                      window.open('https://buy.stripe.com/fZucN4cCG2BW8I3clpawo01', '_blank');
                    } else if (plan.name === "Shop") {
                      window.open('https://buy.stripe.com/bJeaEW0TYccw1fB2KPawo00', '_blank');
                    } else {
                      setLocation("/signup");
                    }
                  }}
                  data-testid={`button-pricing-${plan.name.toLowerCase()}`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h2 className="text-xl sm:text-2xl font-bold font-display">
          Start DetailFlow free today
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          No credit card required. Set up in under 5 minutes.
        </p>
        <Button
          size="lg"
          className="mt-6 h-11 px-8 text-sm"
          onClick={() => setLocation("/signup")}
          data-testid="button-final-cta"
        >
          Create free account
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <DetailFlowLogo className="w-5 h-5" />
            <span className="font-display font-semibold text-foreground">DetailFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <span>&copy; 2026 detailflowapp.com</span>
            <a href="#/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#/terms" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
