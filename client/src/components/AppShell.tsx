import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
} from "lucide-react";
import { DetailFlowLogo } from "./DetailFlowLogo";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/clients", label: "Clients", icon: Users },
  { path: "/scheduling", label: "Scheduling", icon: Calendar },
  { path: "/quotes", label: "Quotes", icon: FileText },
  { path: "/messages", label: "Messages", icon: MessageSquare },
  { path: "/settings", label: "Settings", icon: Settings },
];

// Bottom nav shows these 5 items (skip settings on mobile bottom bar — it's accessible elsewhere)
const mobileNavItems = navItems.slice(0, 5);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — hidden below md */}
      <aside className="hidden md:flex w-[240px] flex-col border-r border-border bg-sidebar shrink-0">
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <DetailFlowLogo className="w-8 h-8 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold font-display text-foreground tracking-tight">
              DetailFlow
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              Auto Detailing CRM
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive =
              path === "/"
                ? location === "/"
                : location.startsWith(path);

            return (
              <Link key={path} href={path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  data-testid={`nav-${label.toLowerCase()}`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            Run your detail shop.
            <br />
            Not the paperwork.
          </p>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Page content — add bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-border flex items-center justify-around h-14 px-1">
        {mobileNavItems.map(({ path, label, icon: Icon }) => {
          const isActive =
            path === "/"
              ? location === "/"
              : location.startsWith(path);

          return (
            <Link key={path} href={path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center w-14 h-12 rounded-md transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
                data-testid={`mobile-nav-${label.toLowerCase()}`}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              </button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
