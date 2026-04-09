import { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
  Car,
  Calendar,
  User,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DetailFlowLogo } from "@/components/DetailFlowLogo";
import { SERVICE_CATEGORIES } from "@shared/schema";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

interface PublicService {
  id: number;
  name: string;
  category: string;
  sedanPrice: number | null;
  suvPrice: number | null;
  vanPrice: number | null;
  isFlat: boolean;
  flatPrice: number | null;
  durationMinutes: number;
}

interface BookingData {
  businessName: string;
  services: PublicService[];
}

export default function BookingPage({ userId }: { userId: string }) {
  const [data, setData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState(String(new Date().getFullYear()));
  const [vehicleSize, setVehicleSize] = useState("sedan");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetch(`${API_BASE}/api/public/book/${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Business not found");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [userId]);

  const groupedServices = useMemo(() => {
    if (!data) return {};
    const groups: Record<string, PublicService[]> = {};
    for (const svc of data.services) {
      const cat = svc.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(svc);
    }
    return groups;
  }, [data]);

  const getServicePrice = (svc: PublicService) => {
    if (svc.isFlat) return svc.flatPrice || 0;
    if (vehicleSize === "sedan") return svc.sedanPrice || 0;
    if (vehicleSize === "suv") return svc.suvPrice || 0;
    return svc.vanPrice || 0;
  };

  const total = selectedServices.reduce((sum, svcId) => {
    const svc = data?.services.find((s) => s.id === svcId);
    return sum + (svc ? getServicePrice(svc) : 0);
  }, 0);

  const toggleCategory = (cat: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  const handleSubmit = async () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    if (selectedServices.length === 0) {
      toast({ title: "Please select at least one service", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const body: any = {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        vehicleMake: vehicleMake.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleYear: Number(vehicleYear) || new Date().getFullYear(),
        vehicleSize,
        serviceIds: selectedServices,
      };
      if (scheduledAt && scheduledTime) {
        body.scheduledAt = new Date(`${scheduledAt}T${scheduledTime}`).toISOString();
      }

      const res = await fetch(`${API_BASE}/api/public/book/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit");
      }

      setSubmitted(true);
    } catch (err: any) {
      toast({ title: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <DetailFlowLogo className="w-10 h-10 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error || "Business not found"}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-success" />
          </div>
          <h2 className="text-xl font-bold font-display" data-testid="text-booking-confirmed">
            Booking Submitted!
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Your booking request has been submitted. {data.businessName} will confirm shortly.
          </p>
          <div className="mt-4 p-3 rounded-lg border border-border bg-card text-left text-sm">
            <p className="font-medium">{clientName}</p>
            <p className="text-muted-foreground text-xs mt-1">
              {selectedServices.length} service{selectedServices.length !== 1 ? "s" : ""} — ${total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <DetailFlowLogo className="w-7 h-7" />
          <div>
            <h1 className="text-base font-bold font-display" data-testid="text-booking-business">
              {data.businessName}
            </h1>
            <p className="text-xs text-muted-foreground">Online Booking</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Contact Info */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User size={14} /> Contact Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="John Smith"
                className="h-9 text-sm"
                data-testid="input-booking-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Phone *</Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(formatPhone(e.target.value))}
                  placeholder="(555) 123-4567"
                  className="h-9 text-sm"
                  maxLength={14}
                  data-testid="input-booking-phone"
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="john@email.com"
                  type="email"
                  className="h-9 text-sm"
                  data-testid="input-booking-email"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Car size={14} /> Vehicle Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Make</Label>
                <Input
                  value={vehicleMake}
                  onChange={(e) => setVehicleMake(e.target.value)}
                  placeholder="Toyota"
                  className="h-9 text-sm"
                  data-testid="input-booking-make"
                />
              </div>
              <div>
                <Label className="text-xs">Model</Label>
                <Input
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="Camry"
                  className="h-9 text-sm"
                  data-testid="input-booking-model"
                />
              </div>
              <div>
                <Label className="text-xs">Year</Label>
                <Input
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(e.target.value)}
                  type="number"
                  className="h-9 text-sm"
                  data-testid="input-booking-year"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Vehicle Size</Label>
              <Select value={vehicleSize} onValueChange={setVehicleSize}>
                <SelectTrigger className="h-9 text-sm" data-testid="select-booking-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedan">Sedan / Coupe / Small</SelectItem>
                  <SelectItem value="suv">SUV / Truck / Crossover</SelectItem>
                  <SelectItem value="van">Van / XL Vehicle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles size={14} /> Select Services
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">
              Prices shown for {vehicleSize.toUpperCase()} size
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {SERVICE_CATEGORIES.map((cat) => {
                const svcs = groupedServices[cat] || [];
                if (!svcs.length) return null;
                const collapsed = collapsedCats.has(cat);
                const selectedCount = svcs.filter((s) =>
                  selectedServices.includes(s.id)
                ).length;
                return (
                  <div key={cat} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      {collapsed ? (
                        <ChevronRight size={14} className="text-muted-foreground" />
                      ) : (
                        <ChevronDown size={14} className="text-muted-foreground" />
                      )}
                      <span className="text-xs font-semibold uppercase tracking-wider flex-1 text-left">
                        {cat}
                      </span>
                      {selectedCount > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20"
                        >
                          {selectedCount}
                        </Badge>
                      )}
                    </button>
                    {!collapsed && (
                      <div className="divide-y divide-border">
                        {svcs.map((svc) => {
                          const selected = selectedServices.includes(svc.id);
                          const price = getServicePrice(svc);
                          return (
                            <button
                              key={svc.id}
                              onClick={() => {
                                setSelectedServices((prev) =>
                                  selected
                                    ? prev.filter((id) => id !== svc.id)
                                    : [...prev, svc.id]
                                );
                              }}
                              className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent/30 transition-colors"
                              data-testid={`toggle-booking-service-${svc.id}`}
                            >
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  selected
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-muted-foreground/30"
                                }`}
                              >
                                {selected && <Check size={10} />}
                              </div>
                              <span className="flex-1 text-sm">{svc.name}</span>
                              <span className="text-sm font-medium text-muted-foreground">
                                ${price.toFixed(0)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Date/Time */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar size={14} /> Preferred Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="h-9 text-sm"
                  min={new Date().toISOString().split("T")[0]}
                  data-testid="input-booking-date"
                />
              </div>
              <div>
                <Label className="text-xs">Time</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-9 text-sm"
                  data-testid="input-booking-time"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary & Submit */}
        {selectedServices.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Summary
            </p>
            {selectedServices.map((svcId) => {
              const svc = data.services.find((s) => s.id === svcId);
              if (!svc) return null;
              const price = getServicePrice(svc);
              return (
                <div key={svcId} className="flex justify-between text-sm py-0.5">
                  <span>{svc.name}</span>
                  <span className="font-medium">${price.toFixed(0)}</span>
                </div>
              );
            })}
            <div className="flex justify-between text-sm font-bold pt-2 mt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">${total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <Button
          className="w-full h-11 text-sm"
          onClick={handleSubmit}
          disabled={submitting || !clientName.trim() || !clientPhone.trim() || selectedServices.length === 0}
          data-testid="button-submit-booking"
        >
          {submitting ? (
            <>
              <Loader2 size={14} className="animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            `Submit Booking Request${total > 0 ? ` — $${total.toLocaleString()}` : ""}`
          )}
        </Button>

        {/* Footer */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <span>Powered by</span>
            <DetailFlowLogo className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground">DetailFlow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
