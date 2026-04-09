import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useState } from "react";
import {
  Briefcase,
  DollarSign,
  FileText,
  MessageSquare,
  Plus,
  Clock,
  ArrowRight,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import ImportContacts from "@/components/ImportContacts";
import type { Appointment, Client, Vehicle, Service } from "@shared/schema";

function KPICard({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  loading: boolean;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-7 w-20 mt-1" />
            ) : (
              <p className="text-xl font-bold font-display mt-1">{value}</p>
            )}
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon size={20} style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  complete: "bg-success/10 text-success border-success/20",
};

export default function Dashboard() {
  const [importOpen, setImportOpen] = useState(false);

  const { data: clientCount } = useQuery<{ count: number }>({
    queryKey: ["/api/clients/count"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    todayJobs: number;
    todayRevenue: number;
    pendingQuotes: number;
    unreadMessages: number;
    newLeads: number;
  }>({
    queryKey: ["/api/dashboard"],
  });

  const { data: upcoming, isLoading: upcomingLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/upcoming"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/appointments/upcoming?limit=5");
      return res.json();
    },
  });

  const { data: clientsList } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: vehiclesList } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: servicesList } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const getClientName = (id: number) =>
    clientsList?.find((c) => c.id === id)?.name || "—";
  const getVehicleLabel = (id: number) => {
    const v = vehiclesList?.find((v) => v.id === id);
    return v ? `${v.year} ${v.make} ${v.model}` : "—";
  };
  const getServiceNames = (idsJson: string) => {
    try {
      const ids: number[] = JSON.parse(idsJson);
      return ids
        .map((id) => servicesList?.find((s) => s.id === id)?.name || "")
        .filter(Boolean)
        .join(", ");
    } catch {
      return "—";
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-display" data-testid="text-page-title">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3" data-testid="kpi-grid">
        <KPICard
          title="Today's Jobs"
          value={stats?.todayJobs ?? 0}
          icon={Briefcase}
          color="#3B7BF8"
          loading={statsLoading}
        />
        <KPICard
          title="Revenue Today"
          value={`$${(stats?.todayRevenue ?? 0).toLocaleString()}`}
          icon={DollarSign}
          color="#22C55E"
          loading={statsLoading}
        />
        <KPICard
          title="Pending Quotes"
          value={stats?.pendingQuotes ?? 0}
          icon={FileText}
          color="#F59E0B"
          loading={statsLoading}
        />
        <KPICard
          title="Messages"
          value={stats?.unreadMessages ?? 0}
          icon={MessageSquare}
          color="#3B7BF8"
          loading={statsLoading}
        />
        <KPICard
          title="New Leads"
          value={stats?.newLeads ?? 0}
          icon={UserPlus}
          color="#8B5CF6"
          loading={statsLoading}
        />
      </div>

      {/* Import CTA — show when no clients */}
      {clientCount && clientCount.count === 0 && (
        <Card className="border-border bg-card border-dashed" data-testid="card-import-cta">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Import your clients</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Get started faster — import your existing client list from a file, your iPhone contacts, or just paste them in.
                </p>
                <Button
                  size="sm"
                  className="mt-3 h-8 text-xs gap-1.5"
                  onClick={() => setImportOpen(true)}
                  data-testid="button-dashboard-import"
                >
                  Import Contacts
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions + Upcoming */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/scheduling">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-sm h-9"
                data-testid="button-new-booking"
              >
                <Plus size={14} /> New Booking
              </Button>
            </Link>
            <Link href="/quotes">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-sm h-9"
                data-testid="button-new-quote"
              >
                <Plus size={14} /> New Quote
              </Button>
            </Link>
            <Link href="/clients">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-sm h-9"
                data-testid="button-new-client"
              >
                <Plus size={14} /> New Client
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Upcoming Appointments
            </CardTitle>
            <Link href="/scheduling">
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                View all <ArrowRight size={12} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : !upcoming?.length ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No upcoming appointments.{" "}
                <Link href="/scheduling">
                  <span className="text-primary hover:underline cursor-pointer">
                    Book one now
                  </span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background"
                    data-testid={`card-appointment-${apt.id}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getClientName(apt.clientId)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getVehicleLabel(apt.vehicleId)} · {getServiceNames(apt.serviceIds)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">
                        {new Date(apt.scheduledAt).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(apt.scheduledAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0.5 ${statusColors[apt.status] || ""}`}
                    >
                      {apt.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ImportContacts open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
