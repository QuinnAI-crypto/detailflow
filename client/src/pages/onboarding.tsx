import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { auth } from "@/lib/auth";
import { DetailFlowLogo } from "@/components/DetailFlowLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ArrowRight, Loader2, ChevronDown, ChevronRight as ChevRight, Phone, Plus, SkipForward } from "lucide-react";
import type { Service } from "@shared/schema";
import { SERVICE_CATEGORIES } from "@shared/schema";
import { cn } from "@/lib/utils";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits.length > 0 ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function extractDigits(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const TOTAL_STEPS = 4;
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState(auth.getUser()?.businessName || "");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // Phone setup state
  const [phoneChoice, setPhoneChoice] = useState<"hosted" | "new" | "skip" | null>(null);
  const [hostedNumber, setHostedNumber] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [phoneSetupLoading, setPhoneSetupLoading] = useState(false);
  const [phoneSetupResult, setPhoneSetupResult] = useState<any>(null);
  const [phoneSetupError, setPhoneSetupError] = useState<string | null>(null);

  const { data: servicesList } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Pre-select all services by default
  useEffect(() => {
    if (servicesList && selectedServices.length === 0) {
      setSelectedServices(servicesList.map((s) => s.id));
    }
  }, [servicesList]);

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

  const handleFinish = async () => {
    setSaving(true);
    try {
      const res = await apiRequest("PATCH", "/api/auth/me", {
        businessName,
        phone,
        onboardingComplete: true,
      });
      const data = await res.json();
      auth.updateUser(data.user);
      onComplete();
    } catch {
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneSetup = async () => {
    setPhoneSetupLoading(true);
    setPhoneSetupError(null);
    try {
      if (phoneChoice === "hosted") {
        const digits = extractDigits(hostedNumber);
        if (digits.length !== 10) {
          setPhoneSetupError("Please enter a valid 10-digit US phone number.");
          setPhoneSetupLoading(false);
          return;
        }
        const res = await apiRequest("POST", "/api/phone/setup-hosted", { phoneNumber: digits });
        const data = await res.json();
        if (data.error) { setPhoneSetupError(data.error); return; }
        setPhoneSetupResult(data);
        setStep(4);
      } else if (phoneChoice === "new") {
        const res = await apiRequest("POST", "/api/phone/provision-new", {
          areaCode: areaCode || undefined,
        });
        const data = await res.json();
        if (data.error) { setPhoneSetupError(data.error); return; }
        setPhoneSetupResult(data);
        setStep(4);
      }
    } catch (err: any) {
      setPhoneSetupError("Something went wrong. Please try again.");
    } finally {
      setPhoneSetupLoading(false);
    }
  };

  const handleSkipPhone = async () => {
    setPhoneSetupLoading(true);
    try {
      await apiRequest("POST", "/api/phone/skip");
      setPhoneChoice("skip");
      setPhoneSetupResult({ status: "skipped" });
      setStep(4);
    } catch {
      setStep(4);
    } finally {
      setPhoneSetupLoading(false);
    }
  };

  const toggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleAllInCategory = (cat: string, svcs: Service[]) => {
    const ids = svcs.map((s) => s.id);
    const allSelected = ids.every((id) => selectedServices.includes(id));
    if (allSelected) {
      setSelectedServices((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedServices((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          <DetailFlowLogo className="w-8 h-8 mr-2" />
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  s < step
                    ? "bg-primary text-primary-foreground"
                    : s === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <Check size={14} /> : s}
              </div>
              {s < TOTAL_STEPS && (
                <div className={`w-8 h-0.5 ${s < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">Step {step} of {TOTAL_STEPS}</p>

        {/* Step 1: Business Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-bold font-display" data-testid="text-onboarding-title">
                Let's set up your business
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                This helps us personalize your experience.
              </p>
            </div>
            <div>
              <Label htmlFor="ob-name" className="text-xs">Business Name</Label>
              <Input
                id="ob-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="h-10 text-sm"
                placeholder="Your detail shop name"
                data-testid="input-ob-business"
              />
            </div>
            <div>
              <Label htmlFor="ob-phone" className="text-xs">Phone Number</Label>
              <Input
                id="ob-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 text-sm"
                placeholder="(555) 000-0000"
                data-testid="input-ob-phone"
              />
            </div>
            <div>
              <Label htmlFor="ob-city" className="text-xs">City / State</Label>
              <Input
                id="ob-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-10 text-sm"
                placeholder="Austin, TX"
                data-testid="input-ob-city"
              />
            </div>
            <Button
              className="w-full h-10 gap-2"
              onClick={() => setStep(2)}
              data-testid="button-ob-next-1"
            >
              Next <ArrowRight size={14} />
            </Button>
          </div>
        )}

        {/* Step 2: Services — Grouped by Category */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-bold font-display" data-testid="text-onboarding-services">
                Which services do you offer?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Toggle categories or individual services. Customize prices later.
              </p>
            </div>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {SERVICE_CATEGORIES.map((cat) => {
                const svcs = groupedServices[cat] || [];
                if (!svcs.length) return null;
                const collapsed = collapsedCats.has(cat);
                const allSelected = svcs.every((s) => selectedServices.includes(s.id));
                const someSelected = svcs.some((s) => selectedServices.includes(s.id));
                return (
                  <div key={cat} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
                      data-testid={`cat-toggle-${cat}`}
                    >
                      <div className="flex items-center gap-2">
                        {collapsed ? <ChevRight size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                        <span className="text-xs font-semibold uppercase tracking-wider">{cat}</span>
                        <span className="text-[10px] text-muted-foreground">({svcs.filter(s => selectedServices.includes(s.id)).length}/{svcs.length})</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleAllInCategory(cat, svcs); }}
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${allSelected ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground border-border"}`}
                      >
                        {allSelected ? "Deselect all" : "Select all"}
                      </button>
                    </button>
                    {!collapsed && (
                      <div className="divide-y divide-border">
                        {svcs.map((svc) => {
                          const selected = selectedServices.includes(svc.id);
                          return (
                            <button
                              key={svc.id}
                              onClick={() => toggleService(svc.id)}
                              className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent/30 transition-colors"
                              data-testid={`toggle-service-${svc.id}`}
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
                              <span className="text-xs text-muted-foreground">
                                {svc.isFlat
                                  ? `$${svc.flatPrice}`
                                  : `$${svc.sedanPrice}+`}
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
            <Button
              className="w-full h-10 gap-2"
              onClick={() => setStep(3)}
              data-testid="button-ob-next-2"
            >
              Next <ArrowRight size={14} />
            </Button>
          </div>
        )}

        {/* Step 3: Set Up Your Business Line */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-bold font-display" data-testid="text-onboarding-phone">
                Set up your business line
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                How should clients text you?
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Text-enable existing number */}
              <div
                onClick={() => setPhoneChoice("hosted")}
                className={cn(
                  "rounded-xl border-2 p-4 cursor-pointer transition-all",
                  phoneChoice === "hosted"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                )}
                data-testid="card-phone-hosted"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    phoneChoice === "hosted" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Phone size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Text-enable my business number</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Keep your existing landline or VoIP number. Clients text the same number they already know. Takes 1-3 business days.
                    </p>
                    {phoneChoice === "hosted" && (
                      <div className="mt-3 space-y-2">
                        <Label htmlFor="hosted-num" className="text-xs">Your business number</Label>
                        <Input
                          id="hosted-num"
                          value={hostedNumber}
                          onChange={(e) => setHostedNumber(formatPhone(e.target.value))}
                          className="h-9 text-sm"
                          placeholder="(555) 123-4567"
                          maxLength={14}
                          data-testid="input-hosted-number"
                        />
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 w-full"
                          onClick={handlePhoneSetup}
                          disabled={phoneSetupLoading || extractDigits(hostedNumber).length !== 10}
                          data-testid="button-enable-texting"
                        >
                          {phoneSetupLoading ? <Loader2 size={12} className="animate-spin" /> : <Phone size={12} />}
                          Enable Texting
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Option 2: Get a new number */}
              <div
                onClick={() => setPhoneChoice("new")}
                className={cn(
                  "rounded-xl border-2 p-4 cursor-pointer transition-all",
                  phoneChoice === "new"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                )}
                data-testid="card-phone-new"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    phoneChoice === "new" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Plus size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Get a new business line</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      We'll set up a dedicated local number for your business. Ready instantly. Put it on your website, cards, and social media.
                    </p>
                    {phoneChoice === "new" && (
                      <div className="mt-3 space-y-2">
                        <Label htmlFor="area-code" className="text-xs">Preferred area code (optional)</Label>
                        <Input
                          id="area-code"
                          value={areaCode}
                          onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                          className="h-9 text-sm w-24"
                          placeholder="512"
                          maxLength={3}
                          data-testid="input-area-code"
                        />
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 w-full"
                          onClick={handlePhoneSetup}
                          disabled={phoneSetupLoading}
                          data-testid="button-get-number"
                        >
                          {phoneSetupLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                          Get My Number
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Option 3: Skip */}
              <div
                onClick={() => { setPhoneChoice("skip"); }}
                className={cn(
                  "rounded-xl border-2 p-4 cursor-pointer transition-all",
                  phoneChoice === "skip"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                )}
                data-testid="card-phone-skip"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    phoneChoice === "skip" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <SkipForward size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Skip for now</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Set up texting later in Settings. You can still use scheduling, quoting, and CRM without SMS.
                    </p>
                    {phoneChoice === "skip" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 w-full mt-3"
                        onClick={handleSkipPhone}
                        disabled={phoneSetupLoading}
                        data-testid="button-skip-phone"
                      >
                        {phoneSetupLoading ? <Loader2 size={12} className="animate-spin" /> : <SkipForward size={12} />}
                        Skip
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {phoneSetupError && (
              <p className="text-xs text-destructive text-center" data-testid="text-phone-error">
                {phoneSetupError}
              </p>
            )}
          </div>
        )}

        {/* Step 4: Ready */}
        {step === 4 && (
          <div className="space-y-4 text-center">
            <div>
              <h2 className="text-lg font-bold font-display" data-testid="text-onboarding-done">
                You're all set{businessName ? `, ${businessName}` : ""}!
              </h2>
              {phoneChoice === "hosted" && phoneSetupResult && (
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Your number is being set up. We'll notify you when it's ready. In the meantime, you can start using DetailFlow.
                </p>
              )}
              {phoneChoice === "new" && phoneSetupResult && (
                <div className="mt-2 max-w-sm mx-auto">
                  <p className="text-sm text-muted-foreground">
                    Your business line is{" "}
                    <span className="text-foreground font-semibold">
                      {phoneSetupResult.formatted || phoneSetupResult.phoneNumber}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start sharing it with clients!
                  </p>
                </div>
              )}
              {phoneChoice === "skip" && (
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  You can set up texting anytime in Settings. Your dashboard is ready to go.
                </p>
              )}
              {!phoneChoice && (
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Your dashboard is ready. You can manage scheduling, build quotes, track clients, and send automated messages — all from one place.
                </p>
              )}
            </div>
            <Button
              className="h-10 px-8 gap-2"
              onClick={handleFinish}
              disabled={saving}
              data-testid="button-ob-finish"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : "Go to dashboard"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
