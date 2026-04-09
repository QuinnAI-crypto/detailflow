import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  X,
  Sparkles,
  CalendarClock,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Appointment, Client, Vehicle, Service } from "@shared/schema";
import { SERVICE_CATEGORIES } from "@shared/schema";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  complete: "bg-success/10 text-success border-success/20",
};

function getWeekDays(baseDate: Date): Date[] {
  const monday = new Date(baseDate);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function Scheduling() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailApt, setDetailApt] = useState<Appointment | null>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [suggestedSlots, setSuggestedSlots] = useState<string[]>([]);
  const [showManualTime, setShowManualTime] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDays = getWeekDays(baseDate);
  const start = weekDays[0].toISOString();
  const end = new Date(weekDays[6].getTime() + 86400000).toISOString();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", start, end],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/appointments?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      );
      return res.json();
    },
  });

  const { data: clientsList } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: vehiclesList } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const { data: servicesList } = useQuery<Service[]>({ queryKey: ["/api/services"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setAddDialogOpen(false);
      resetForm();
      toast({ title: "Appointment booked", description: "New appointment scheduled." });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setDetailApt(null);
    },
  });

  const resetForm = () => {
    setSelectedClientId("");
    setSelectedVehicleId("");
    setSelectedServices([]);
    setSuggestedSlots([]);
    setShowManualTime(false);
  };

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
        .filter(Boolean);
    } catch {
      return [];
    }
  };

  const groupedServices = useMemo(() => {
    if (!servicesList) return {};
    const groups: Record<string, Service[]> = {};
    for (const svc of servicesList) {
      const cat = svc.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(svc);
    }
    return groups;
  }, [servicesList]);

  const clientVehicles = selectedClientId
    ? vehiclesList?.filter((v) => v.clientId === Number(selectedClientId)) || []
    : [];

  const getApptsForDay = (day: Date) => {
    return (appointments || []).filter((a) => {
      const d = new Date(a.scheduledAt);
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
      );
    });
  };

  // Fetch suggested slots when services change
  const fetchSuggestions = async () => {
    if (selectedServices.length === 0) {
      setSuggestedSlots([]);
      return;
    }
    try {
      const res = await apiRequest("POST", "/api/appointments/suggest", {
        serviceIds: selectedServices,
      });
      const data = await res.json();
      setSuggestedSlots(data.slots || []);
    } catch {
      setSuggestedSlots([]);
    }
  };

  const handleBookSuggested = (slot: string) => {
    if (!selectedClientId || !selectedVehicleId || !selectedServices.length) {
      toast({ title: "Missing fields", description: "Select client, vehicle, and services first.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      clientId: Number(selectedClientId),
      vehicleId: Number(selectedVehicleId),
      serviceIds: JSON.stringify(selectedServices),
      scheduledAt: slot,
      status: "scheduled",
      notes: null,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const date = form.get("date") as string;
    const time = form.get("time") as string;
    if (!date || !time || !selectedClientId || !selectedVehicleId || !selectedServices.length) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      clientId: Number(selectedClientId),
      vehicleId: Number(selectedVehicleId),
      serviceIds: JSON.stringify(selectedServices),
      scheduledAt: new Date(`${date}T${time}`).toISOString(),
      status: "scheduled",
      notes: (form.get("notes") as string) || null,
    });
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold font-display" data-testid="text-page-title">
          Scheduling
        </h1>
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-sm h-8" data-testid="button-add-appointment">
              <Plus size={14} /> New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">New Appointment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label className="text-xs">Client *</Label>
                <Select value={selectedClientId} onValueChange={(val) => { setSelectedClientId(val); setSelectedVehicleId(""); }}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsList?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Vehicle *</Label>
                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId} disabled={!selectedClientId}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-vehicle">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientVehicles.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.year} {v.make} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Services *</Label>
                <div className="border border-border rounded-md max-h-[200px] overflow-y-auto mt-1">
                  {SERVICE_CATEGORIES.map((cat) => {
                    const svcs = groupedServices[cat] || [];
                    if (!svcs.length) return null;
                    const collapsed = collapsedCats.has(cat);
                    return (
                      <div key={cat}>
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className="w-full flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/40 border-b border-border text-left hover:bg-muted/60 transition-colors sticky top-0 z-10"
                        >
                          {collapsed ? <ChevronRight size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</span>
                        </button>
                        {!collapsed && svcs.map((s) => (
                          <label
                            key={s.id}
                            className="flex items-center gap-2 py-1 px-2.5 rounded hover:bg-accent/50 cursor-pointer text-sm border-b border-border last:border-0"
                          >
                            <Checkbox
                              checked={selectedServices.includes(s.id)}
                              onCheckedChange={(checked) => {
                                const next = checked
                                  ? [...selectedServices, s.id]
                                  : selectedServices.filter((id) => id !== s.id);
                                setSelectedServices(next);
                              }}
                              data-testid={`checkbox-service-${s.id}`}
                            />
                            <span className="flex-1">{s.name}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Suggested Times */}
              {selectedServices.length > 0 && selectedClientId && selectedVehicleId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-teal-400" />
                      <span className="text-xs font-semibold text-teal-400">Suggested Times</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2"
                      onClick={fetchSuggestions}
                      data-testid="button-fetch-suggestions"
                    >
                      <CalendarClock size={12} className="mr-1" /> Find slots
                    </Button>
                  </div>
                  {suggestedSlots.length > 0 ? (
                    <div className="space-y-1">
                      {suggestedSlots.map((slot, i) => {
                        const d = new Date(slot);
                        return (
                          <Button
                            key={i}
                            type="button"
                            variant="outline"
                            className="w-full h-8 text-xs justify-between"
                            onClick={() => handleBookSuggested(slot)}
                            disabled={createMutation.isPending}
                            data-testid={`button-book-slot-${i}`}
                          >
                            <span>
                              {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              {" at "}
                              {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </span>
                            <span className="text-primary">Book</span>
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Click "Find slots" to get AI-suggested times.</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowManualTime(true)}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Or pick a time manually
                  </button>
                </div>
              )}

              {/* Manual date/time (always show if no services or if toggled) */}
              {(showManualTime || selectedServices.length === 0) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="date" className="text-xs">Date *</Label>
                    <Input id="date" name="date" type="date" required className="h-9 text-sm" data-testid="input-date" />
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-xs">Time *</Label>
                    <Input id="time" name="time" type="time" required className="h-9 text-sm" data-testid="input-time" />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes" className="text-xs">Notes</Label>
                <Input id="notes" name="notes" className="h-9 text-sm" data-testid="input-apt-notes" />
              </div>
              {(showManualTime || selectedServices.length === 0) && (
                <Button type="submit" className="w-full h-9 text-sm" disabled={createMutation.isPending} data-testid="button-submit-appointment">
                  {createMutation.isPending ? "Booking..." : "Book Appointment"}
                </Button>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setWeekOffset((w) => w - 1)} data-testid="button-prev-week">
          <ChevronLeft size={16} />
        </Button>
        <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => setWeekOffset(0)} data-testid="button-today">
          Today
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setWeekOffset((w) => w + 1)} data-testid="button-next-week">
          <ChevronRight size={16} />
        </Button>
        <span className="text-sm font-medium ml-1">
          {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
          {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>

      {/* Week view */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayApts = getApptsForDay(day);
            const isToday =
              day.getFullYear() === today.getFullYear() &&
              day.getMonth() === today.getMonth() &&
              day.getDate() === today.getDate();

            return (
              <div
                key={day.toISOString()}
                className={`rounded-lg border min-h-[160px] flex flex-col ${
                  isToday ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className={`px-2.5 py-2 border-b ${isToday ? "border-primary/20" : "border-border"}`}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p className={`text-sm font-semibold ${isToday ? "text-primary" : ""}`}>
                    {day.getDate()}
                  </p>
                </div>
                <div className="p-1.5 space-y-1 flex-1 overflow-y-auto">
                  {dayApts.map((apt) => (
                    <button
                      key={apt.id}
                      onClick={() => setDetailApt(apt)}
                      className={`w-full text-left p-1.5 rounded-md border text-[11px] leading-tight transition-colors hover:brightness-110 ${statusColors[apt.status] || "border-border"}`}
                      data-testid={`card-apt-${apt.id}`}
                    >
                      <p className="font-medium truncate">{getClientName(apt.clientId)}</p>
                      <p className="opacity-70 truncate">
                        {new Date(apt.scheduledAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detailApt && (
        <Dialog open={!!detailApt} onOpenChange={() => setDetailApt(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display">Appointment Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{getClientName(detailApt.clientId)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-medium">{getVehicleLabel(detailApt.vehicleId)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {new Date(detailApt.scheduledAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  at{" "}
                  {new Date(detailApt.scheduledAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Services</span>
                <div className="mt-1 space-y-0.5">
                  {getServiceNames(detailApt.serviceIds).map((name, i) => (
                    <p key={i} className="text-sm font-medium">• {name}</p>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={statusColors[detailApt.status]}>
                  {detailApt.status.replace("_", " ")}
                </Badge>
              </div>
              {detailApt.notes && (
                <div>
                  <span className="text-muted-foreground">Notes</span>
                  <p className="mt-0.5">{detailApt.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {detailApt.status === "scheduled" && (
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: detailApt.id, status: "in_progress" })
                    }
                    data-testid="button-start-job"
                  >
                    Start Job
                  </Button>
                )}
                {detailApt.status === "in_progress" && (
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: detailApt.id, status: "complete" })
                    }
                    data-testid="button-complete-job"
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
