import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import {
  Search,
  Plus,
  X,
  Phone,
  Mail,
  MapPin,
  Car,
  Calendar,
  DollarSign,
  StickyNote,
  Zap,
  CircleDot,
  Upload,
} from "lucide-react";
import ImportContacts from "@/components/ImportContacts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import type { Client, Vehicle, Appointment, Service, Quote } from "@shared/schema";

// Smart parser for the input bar
function parseSmartInput(input: string): { name: string; phone: string; email: string } {
  const trimmed = input.trim();
  if (!trimmed) return { name: "", phone: "", email: "" };

  // Phone regex
  const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
  // Email regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  let phone = "";
  let email = "";
  let remaining = trimmed;

  const phoneMatch = remaining.match(phoneRegex);
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/[^\d]/g, "");
    if (phone.length === 10) {
      phone = `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    } else if (phone.length === 11 && phone.startsWith("1")) {
      phone = `(${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7)}`;
    }
    remaining = remaining.replace(phoneMatch[0], "").trim();
  }

  const emailMatch = remaining.match(emailRegex);
  if (emailMatch) {
    email = emailMatch[0];
    remaining = remaining.replace(emailMatch[0], "").trim();
  }

  // Clean up remaining as name
  let name = remaining.replace(/[,;|]+/g, " ").replace(/\s+/g, " ").trim();

  // If only phone was entered
  if (!name && phone) {
    name = "New Lead";
  }

  return { name, phone, email };
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickPhone, setQuickPhone] = useState("");
  const [smartInput, setSmartInput] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const { toast } = useToast();

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: allAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: allQuotes } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: servicesList } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/clients", data);
      return res.json();
    },
    onSuccess: (newClient: Client) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setAddDialogOpen(false);
      setQuickAddOpen(false);
      setQuickPhone("");
      setSelectedClient(newClient);
    },
  });

  const filtered = clients?.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  const getClientVehicles = (clientId: number) =>
    vehicles?.filter((v) => v.clientId === clientId) || [];

  const getClientAppointments = (clientId: number) =>
    allAppointments?.filter((a) => a.clientId === clientId) || [];

  const isNewLead = (client: Client) => {
    const appts = getClientAppointments(client.id);
    const quotes = allQuotes?.filter((q) => q.clientId === client.id) || [];
    return appts.length === 0 && quotes.length === 0;
  };

  const getLastServiceDate = (clientId: number) => {
    const apts = getClientAppointments(clientId).filter(
      (a) => a.status === "complete"
    );
    if (!apts.length) return null;
    return apts.sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    )[0].scheduledAt;
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

  const handleAddClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createClientMutation.mutate({
      name: form.get("name"),
      email: form.get("email") || "",
      phone: form.get("phone") || "",
      address: form.get("address") || null,
      notes: form.get("notes") || null,
      isLead: false,
      createdAt: new Date().toISOString(),
    });
    toast({ title: "Client added" });
  };

  const handleQuickAdd = () => {
    if (!quickPhone.trim()) return;
    createClientMutation.mutate({
      name: "New Lead",
      email: "",
      phone: formatPhoneNumber(quickPhone),
      address: null,
      notes: null,
      isLead: true,
      createdAt: new Date().toISOString(),
    });
    toast({ title: "Client added", description: `New Lead — ${formatPhoneNumber(quickPhone)}` });
  };

  const handleSmartAdd = () => {
    if (!smartInput.trim()) return;
    const parsed = parseSmartInput(smartInput);
    if (!parsed.name && !parsed.phone) return;
    createClientMutation.mutate({
      name: parsed.name || "New Lead",
      email: parsed.email,
      phone: parsed.phone,
      address: null,
      notes: null,
      isLead: !parsed.name || parsed.name === "New Lead",
      createdAt: new Date().toISOString(),
    });
    toast({ title: "Client added", description: `${parsed.name || "New Lead"}${parsed.phone ? ` — ${parsed.phone}` : ""}` });
    setSmartInput("");
  };

  return (
    <div className="flex h-full">
      {/* Client list */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${selectedClient ? "hidden lg:flex" : ""}`}
      >
        <div className="p-4 lg:p-6 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold font-display" data-testid="text-page-title">
              Clients
            </h1>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-sm h-8"
                onClick={() => setImportOpen(true)}
                data-testid="button-import-contacts"
              >
                <Upload size={13} /> Import
              </Button>
              <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 text-sm h-8" data-testid="button-quick-add">
                    <Zap size={13} /> Quick Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xs">
                  <DialogHeader>
                    <DialogTitle className="font-display text-base">Quick Add — Phone</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(formatPhoneNumber(e.target.value))}
                      placeholder="(555) 123-4567"
                      className="h-10 text-base"
                      maxLength={14}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleQuickAdd(); }}
                      data-testid="input-quick-phone"
                    />
                    <Button
                      className="w-full h-9 text-sm"
                      onClick={handleQuickAdd}
                      disabled={createClientMutation.isPending || quickPhone.replace(/\D/g, "").length < 7}
                      data-testid="button-quick-add-submit"
                    >
                      {createClientMutation.isPending ? "Adding..." : "Add Client"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 text-sm h-8" data-testid="button-add-client">
                    <Plus size={14} /> Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display">New Client</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddClient} className="space-y-3">
                    <div>
                      <Label htmlFor="name" className="text-xs">Name *</Label>
                      <Input id="name" name="name" required className="h-9 text-sm" data-testid="input-client-name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="email" className="text-xs">Email</Label>
                        <Input id="email" name="email" type="email" className="h-9 text-sm" data-testid="input-client-email" />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-xs">Phone</Label>
                        <Input id="phone" name="phone" className="h-9 text-sm" data-testid="input-client-phone" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address" className="text-xs">Address</Label>
                      <Input id="address" name="address" className="h-9 text-sm" data-testid="input-client-address" />
                    </div>
                    <div>
                      <Label htmlFor="notes" className="text-xs">Notes</Label>
                      <Textarea id="notes" name="notes" rows={2} className="text-sm" data-testid="input-client-notes" />
                    </div>
                    <Button type="submit" className="w-full h-9 text-sm" disabled={createClientMutation.isPending} data-testid="button-submit-client">
                      {createClientMutation.isPending ? "Adding..." : "Add Client"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Smart Input Bar */}
          <div className="relative">
            <Input
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              placeholder="Add client — paste name, phone, or full contact info..."
              className="h-10 text-sm pr-20 bg-muted/30 border-dashed"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSmartAdd();
                }
              }}
              data-testid="input-smart-add"
            />
            {smartInput.trim() && (
              <Button
                size="sm"
                className="absolute right-1 top-1 h-8 text-xs gap-1"
                onClick={handleSmartAdd}
                disabled={createClientMutation.isPending}
                data-testid="button-smart-add-submit"
              >
                <Plus size={12} /> Add
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
              data-testid="input-search-clients"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !filtered?.length ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">No clients found.</p>
              <Button
                size="sm"
                className="mt-3 gap-1.5"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus size={14} /> Add your first client
              </Button>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Name</th>
                      <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground hidden md:table-cell">Phone</th>
                      <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground hidden lg:table-cell">Vehicle(s)</th>
                      <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground hidden lg:table-cell">Last Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((client) => {
                      const cvs = getClientVehicles(client.id);
                      const lastDate = getLastServiceDate(client.id);
                      const lead = isNewLead(client);
                      return (
                        <tr
                          key={client.id}
                          className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedClient(client)}
                          data-testid={`row-client-${client.id}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium text-sm">{client.name}</p>
                                <p className="text-xs text-muted-foreground">{client.email || "—"}</p>
                              </div>
                              {lead && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20">
                                  New Lead
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {client.phone || "—"}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {cvs.length > 0 ? (
                              <span className="text-xs">
                                {cvs.map((v) => `${v.year} ${v.make} ${v.model}`).join(", ")}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {lastDate ? (
                              <span className="text-xs">
                                {new Date(lastDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedClient && (
        <div className="w-full lg:w-[400px] border-l border-border bg-card overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display">{selectedClient.name}</h2>
                {isNewLead(selectedClient) && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20">
                    New Lead
                  </Badge>
                )}
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-close-detail"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contact info */}
            <div className="space-y-2">
              {selectedClient.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-muted-foreground" />
                  <span>{selectedClient.phone}</span>
                </div>
              )}
              {selectedClient.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-muted-foreground" />
                  <span>{selectedClient.email}</span>
                </div>
              )}
              {selectedClient.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-muted-foreground" />
                  <span>{selectedClient.address}</span>
                </div>
              )}
              {selectedClient.notes && (
                <div className="flex items-start gap-2 text-sm">
                  <StickyNote size={14} className="text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">{selectedClient.notes}</span>
                </div>
              )}
            </div>

            {/* Vehicles */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Vehicles
              </h3>
              {getClientVehicles(selectedClient.id).length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No vehicles yet.</p>
              ) : (
                getClientVehicles(selectedClient.id).map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-border mb-1.5"
                    data-testid={`card-vehicle-${v.id}`}
                  >
                    <Car size={14} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.color} · {v.size.charAt(0).toUpperCase() + v.size.slice(1)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Service History */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Service History
              </h3>
              {getClientAppointments(selectedClient.id).length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  No service history yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {getClientAppointments(selectedClient.id)
                    .sort(
                      (a, b) =>
                        new Date(b.scheduledAt).getTime() -
                        new Date(a.scheduledAt).getTime()
                    )
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="p-2.5 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">
                            {new Date(apt.scheduledAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {apt.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getServiceNames(apt.serviceIds)}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ImportContacts open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
