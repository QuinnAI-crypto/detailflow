import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useMemo } from "react";
import {
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Send,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import type { Quote, Client, Vehicle, Service } from "@shared/schema";
import { SERVICE_CATEGORIES } from "@shared/schema";

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  draft: { icon: Clock, color: "text-muted-foreground border-border", label: "Draft" },
  sent: { icon: Send, color: "text-primary border-primary/20 bg-primary/10", label: "Sent" },
  accepted: { icon: CheckCircle, color: "text-success border-success/20 bg-success/10", label: "Accepted" },
  declined: { icon: XCircle, color: "text-destructive border-destructive/20 bg-destructive/10", label: "Declined" },
};

export default function Quotes() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: quotesList, isLoading } = useQuery<Quote[]>({ queryKey: ["/api/quotes"] });
  const { data: clientsList } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: vehiclesList } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const { data: servicesList } = useQuery<Service[]>({ queryKey: ["/api/services"] });

  const createQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/quotes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setAddDialogOpen(false);
      resetForm();
      toast({ title: "Quote created" });
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/quotes/${id}`, { status });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      // Generate AI follow-up on status change
      if (data.status === "sent" || data.status === "accepted") {
        const client = clientsList?.find((c) => c.id === data.clientId);
        let lineItems: any[] = [];
        try { lineItems = JSON.parse(data.lineItems); } catch {}
        const svcNames = lineItems.map((li: any) => li.serviceName).join(", ");
        apiRequest("POST", "/api/ai/quote-followup", {
          clientName: client?.name || "",
          services: svcNames,
          total: data.total,
          status: data.status,
        }).then(r => r.json()).then(r => {
          setAiDraft(r.draft);
        }).catch(() => {});
      }
    },
  });

  const resetForm = () => {
    setSelectedClientId("");
    setSelectedVehicleId("");
    setSelectedServices([]);
    setAiDraft(null);
  };

  const getClientName = (id: number) =>
    clientsList?.find((c) => c.id === id)?.name || "—";

  const getVehicleLabel = (id: number) => {
    const v = vehiclesList?.find((v) => v.id === id);
    return v ? `${v.year} ${v.make} ${v.model}` : "—";
  };

  const getVehicleSize = (id: number) => {
    const v = vehiclesList?.find((v) => v.id === id);
    return (v?.size || "sedan") as "sedan" | "suv" | "van";
  };

  const clientVehicles = selectedClientId
    ? vehiclesList?.filter((v) => v.clientId === Number(selectedClientId)) || []
    : [];

  const selectedVehicleSize = selectedVehicleId ? getVehicleSize(Number(selectedVehicleId)) : "sedan";

  const getServicePrice = (service: Service, size: "sedan" | "suv" | "van") => {
    if (service.isFlat) return service.flatPrice || 0;
    if (size === "sedan") return service.sedanPrice || 0;
    if (size === "suv") return service.suvPrice || 0;
    return service.vanPrice || 0;
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

  const selectedLineItems = selectedServices.map((svcId) => {
    const svc = servicesList?.find((s) => s.id === svcId);
    if (!svc) return null;
    const price = getServicePrice(svc, selectedVehicleSize);
    return { serviceId: svc.id, serviceName: svc.name, price };
  }).filter(Boolean);

  const total = selectedLineItems.reduce((sum, item) => sum + (item?.price || 0), 0);

  const handleCreateQuote = (saveAs: "draft" | "sent") => {
    if (!selectedClientId || !selectedVehicleId || !selectedServices.length) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    createQuoteMutation.mutate({
      clientId: Number(selectedClientId),
      vehicleId: Number(selectedVehicleId),
      lineItems: JSON.stringify(selectedLineItems),
      total,
      status: saveAs,
      createdAt: new Date().toISOString(),
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

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold font-display" data-testid="text-page-title">
          Quotes
        </h1>
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-sm h-8" data-testid="button-new-quote">
              <Plus size={14} /> New Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Quote Builder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Client *</Label>
                  <Select value={selectedClientId} onValueChange={(val) => { setSelectedClientId(val); setSelectedVehicleId(""); setSelectedServices([]); }}>
                    <SelectTrigger className="h-9 text-sm" data-testid="select-quote-client">
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
                  <Select value={selectedVehicleId} onValueChange={(val) => { setSelectedVehicleId(val); setSelectedServices([]); }} disabled={!selectedClientId}>
                    <SelectTrigger className="h-9 text-sm" data-testid="select-quote-vehicle">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientVehicles.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.year} {v.make} {v.model} ({v.size})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedVehicleId && (
                <>
                  <div>
                    <Label className="text-xs">Services</Label>
                    <p className="text-[10px] text-muted-foreground mb-1">
                      Prices for {selectedVehicleSize.toUpperCase()} size
                    </p>
                    <div className="border border-border rounded-md max-h-[280px] overflow-y-auto">
                      {SERVICE_CATEGORIES.map((cat) => {
                        const svcs = groupedServices[cat] || [];
                        if (!svcs.length) return null;
                        const collapsed = collapsedCats.has(cat);
                        return (
                          <div key={cat}>
                            <button
                              onClick={() => toggleCategory(cat)}
                              className="w-full flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/40 border-b border-border text-left hover:bg-muted/60 transition-colors sticky top-0 z-10"
                            >
                              {collapsed ? <ChevronRight size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</span>
                            </button>
                            {!collapsed && svcs.map((svc) => {
                              const price = getServicePrice(svc, selectedVehicleSize);
                              return (
                                <label
                                  key={svc.id}
                                  className="flex items-center gap-2 py-1.5 px-2.5 hover:bg-accent/50 cursor-pointer border-b border-border last:border-0"
                                >
                                  <Checkbox
                                    checked={selectedServices.includes(svc.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedServices([...selectedServices, svc.id]);
                                      } else {
                                        setSelectedServices(selectedServices.filter((id) => id !== svc.id));
                                      }
                                    }}
                                    data-testid={`checkbox-quote-service-${svc.id}`}
                                  />
                                  <span className="flex-1 text-sm">{svc.name}</span>
                                  <span className="text-sm font-medium text-muted-foreground">
                                    ${price.toFixed(0)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedLineItems.length > 0 && (
                    <div className="rounded-lg border border-border p-3 bg-muted/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Summary
                      </p>
                      {selectedLineItems.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm py-0.5">
                          <span>{item?.serviceName}</span>
                          <span className="font-medium">${item?.price.toFixed(0)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold pt-2 mt-2 border-t border-border">
                        <span>Total</span>
                        <span>${total.toFixed(0)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-9 text-sm"
                      onClick={() => handleCreateQuote("draft")}
                      disabled={createQuoteMutation.isPending}
                      data-testid="button-save-draft"
                    >
                      Save Draft
                    </Button>
                    <Button
                      className="flex-1 h-9 text-sm"
                      onClick={() => handleCreateQuote("sent")}
                      disabled={createQuoteMutation.isPending}
                      data-testid="button-send-quote"
                    >
                      Send Quote
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Quote Follow-up Banner */}
      {aiDraft && (
        <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-3 space-y-2" data-testid="ai-quote-draft">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-teal-400" />
            <span className="text-xs font-semibold text-teal-400">AI Draft Follow-up</span>
          </div>
          <p className="text-sm leading-relaxed">{aiDraft}</p>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={() => { toast({ title: "Message sent!" }); setAiDraft(null); }}>
              Send as-is
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAiDraft(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Quotes List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : !quotesList?.length ? (
        <div className="py-16 text-center">
          <FileText size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No quotes yet.</p>
          <Button
            size="sm"
            className="mt-3 gap-1.5"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus size={14} /> Create your first quote
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {quotesList.map((quote) => {
            const sc = statusConfig[quote.status] || statusConfig.draft;
            const StatusIcon = sc.icon;
            let lineItems: any[] = [];
            try {
              lineItems = JSON.parse(quote.lineItems);
            } catch {}

            return (
              <Card key={quote.id} className="border-border bg-card" data-testid={`card-quote-${quote.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{getClientName(quote.clientId)}</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sc.color}`}>
                          <StatusIcon size={10} className="mr-1" />
                          {sc.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getVehicleLabel(quote.vehicleId)} · {lineItems.length} service{lineItems.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lineItems.map((li: any) => li.serviceName).join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold font-display">${quote.total.toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(quote.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  {(quote.status === "draft" || quote.status === "sent") && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      {quote.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => updateQuoteMutation.mutate({ id: quote.id, status: "sent" })}
                          data-testid={`button-send-${quote.id}`}
                        >
                          <Send size={10} /> Mark Sent
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 text-success hover:text-success"
                        onClick={() => updateQuoteMutation.mutate({ id: quote.id, status: "accepted" })}
                        data-testid={`button-accept-${quote.id}`}
                      >
                        <CheckCircle size={10} /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={() => updateQuoteMutation.mutate({ id: quote.id, status: "declined" })}
                        data-testid={`button-decline-${quote.id}`}
                      >
                        <XCircle size={10} /> Decline
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
