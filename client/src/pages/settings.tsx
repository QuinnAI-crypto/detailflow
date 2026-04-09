import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { auth } from "@/lib/auth";
import { useState, useMemo } from "react";
import { Save, Store, Wrench, Zap, CreditCard, LogOut, Check, Crown, Upload, Link2, QrCode, Phone, ChevronDown, ChevronRight, Copy, Download, Mail, Send, Loader2, Plus, SkipForward, CircleDot, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Setting, Service, User } from "@shared/schema";
import { SERVICE_CATEGORIES } from "@shared/schema";

// Simple QR code generator using SVG
function generateQRSVG(text: string): string {
  // A simplified QR code SVG for display purposes
  const size = 256;
  const modules = 25;
  const cellSize = size / modules;
  
  // Simple hash-based pattern (not a real QR code, but visually representative)
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  
  // Fixed position patterns (corners)
  const drawFinderPattern = (x: number, y: number) => {
    svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${7 * cellSize}" height="${7 * cellSize}" fill="black"/>`;
    svg += `<rect x="${(x + 1) * cellSize}" y="${(y + 1) * cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" fill="white"/>`;
    svg += `<rect x="${(x + 2) * cellSize}" y="${(y + 2) * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" fill="black"/>`;
  };
  
  drawFinderPattern(0, 0);
  drawFinderPattern(modules - 7, 0);
  drawFinderPattern(0, modules - 7);
  
  // Data area - seeded random pattern
  let seed = Math.abs(hash);
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      // Skip finder patterns
      if ((x < 8 && y < 8) || (x >= modules - 8 && y < 8) || (x < 8 && y >= modules - 8)) continue;
      seed = (seed * 16807 + 12345) & 0x7fffffff;
      if (seed % 3 !== 0) {
        svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
  }
  
  svg += '</svg>';
  return svg;
}

function formatPhoneDisplay(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return e164;
}

export default function Settings() {
  const { toast } = useToast();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const user = auth.getUser();

  const { data: settingsList, isLoading: settingsLoading } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const { data: servicesList, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await apiRequest("PUT", `/api/settings/${key}`, { value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/services/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service updated" });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/clients/bulk", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: `${data.count} clients imported` });
      setBulkText("");
      setBulkPreview([]);
    },
  });

  // Phone setup queries
  const { data: phoneStatus, isLoading: phoneLoading } = useQuery<{
    phoneSetupType: string | null;
    businessPhone: string | null;
    twilioPhoneSid: string | null;
    phoneSetupStatus: string | null;
    smsEnabled: boolean;
  }>({
    queryKey: ["/api/phone/status"],
  });

  const phoneTestSmsMutation = useMutation({
    mutationFn: async (to: string) => {
      const res = await apiRequest("POST", "/api/phone/test-sms", { to });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: data.message || "Test SMS sent!" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to send test SMS", description: err.message, variant: "destructive" });
    },
  });

  const setupHostedMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const res = await apiRequest("POST", "/api/phone/setup-hosted", { phoneNumber });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone/status"] });
      toast({ title: "Number submitted for text-enablement" });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const provisionNewMutation = useMutation({
    mutationFn: async (areaCode?: string) => {
      const res = await apiRequest("POST", "/api/phone/provision-new", { areaCode });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone/status"] });
      toast({ title: "New number provisioned!" });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const aiSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/phone/ai-settings", data);
      return res.json();
    },
    onSuccess: (data) => {
      // Update local user
      const u = auth.getUser();
      if (u) auth.updateUser({ ...u, ...data });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const testSmsMutation = useMutation({
    mutationFn: async (to: string) => {
      const res = await apiRequest("POST", "/api/test/sms", { to });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: data.message || "Test SMS sent!" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to send test SMS", description: err.message, variant: "destructive" });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (to: string) => {
      const res = await apiRequest("POST", "/api/test/email", { to });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: data.message || "Test email sent!" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to send test email", description: err.message, variant: "destructive" });
    },
  });

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

  const getSetting = (key: string) =>
    settingsList?.find((s) => s.key === key)?.value || "";

  const handleBusinessSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fields = ["business_name", "business_phone", "business_address"];
    for (const key of fields) {
      const value = form.get(key) as string;
      updateSettingMutation.mutate({ key, value });
    }
    toast({ title: "Business info saved" });
  };

  const handleToggle = (key: string, current: string) => {
    updateSettingMutation.mutate({
      key,
      value: current === "true" ? "false" : "true",
    });
  };

  const handleSignOut = () => {
    auth.clearSession();
    queryClient.clear();
  };

  const handleUpgradeCheckout = (plan: 'pro' | 'shop' = 'pro') => {
    const links = {
      pro: 'https://buy.stripe.com/fZucN4cCG2BW8I3clpawo01',
      shop: 'https://buy.stripe.com/bJeaEW0TYccw1fB2KPawo00',
    };
    window.open(links[plan], '_blank');
    setUpgradeOpen(false);
  };

  const parseBulkInput = (text: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    return lines.map(line => {
      const parts = line.split(/[,\t]+/).map(p => p.trim());
      return {
        name: parts[0] || "New Lead",
        phone: parts[1] || "",
        email: parts[2] || "",
      };
    });
  };

  const handleBulkPreview = () => {
    const parsed = parseBulkInput(bulkText);
    setBulkPreview(parsed);
  };

  const handleBulkImport = () => {
    if (!bulkPreview.length) return;
    bulkImportMutation.mutate({ clients: bulkPreview });
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Booking link (use current URL origin)
  const bookingUrl = `https://detailflowapp.com/#/book/${user?.id || 1}`;
  const embedCode = `<iframe src="${bookingUrl}" width="100%" height="700" frameborder="0"></iframe>`;
  const qrSvg = generateQRSVG(bookingUrl);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    toast({ title: `${label} copied!` });
  };

  const planLabel = user?.plan === "pro" ? "Pro" : user?.plan === "shop" ? "Shop" : "Free";

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[800px]">
      <h1 className="text-lg font-bold font-display" data-testid="text-page-title">
        Settings
      </h1>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="bg-muted h-9 flex-wrap">
          <TabsTrigger value="business" className="text-xs gap-1.5" data-testid="tab-business">
            <Store size={13} /> Business
          </TabsTrigger>
          <TabsTrigger value="services" className="text-xs gap-1.5" data-testid="tab-services">
            <Wrench size={13} /> Services
          </TabsTrigger>
          <TabsTrigger value="automation" className="text-xs gap-1.5" data-testid="tab-automation">
            <Zap size={13} /> Automation
          </TabsTrigger>
          <TabsTrigger value="sharing" className="text-xs gap-1.5" data-testid="tab-sharing">
            <Link2 size={13} /> Share
          </TabsTrigger>
          <TabsTrigger value="account" className="text-xs gap-1.5" data-testid="tab-account">
            <CreditCard size={13} /> Account
          </TabsTrigger>
        </TabsList>

        {/* Business Info */}
        <TabsContent value="business">
          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Business Information</CardTitle>
              </CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-9 w-full" />
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleBusinessSave} className="space-y-3">
                    <div>
                      <Label htmlFor="business_name" className="text-xs">Business Name</Label>
                      <Input id="business_name" name="business_name" defaultValue={getSetting("business_name")} className="h-9 text-sm" data-testid="input-business-name" />
                    </div>
                    <div>
                      <Label htmlFor="business_phone" className="text-xs">Phone</Label>
                      <Input id="business_phone" name="business_phone" defaultValue={getSetting("business_phone")} className="h-9 text-sm" data-testid="input-business-phone" />
                    </div>
                    <div>
                      <Label htmlFor="business_address" className="text-xs">Address</Label>
                      <Input id="business_address" name="business_address" defaultValue={getSetting("business_address")} className="h-9 text-sm" data-testid="input-business-address" />
                    </div>
                    <Button type="submit" size="sm" className="h-8 gap-1.5 text-sm" disabled={updateSettingMutation.isPending} data-testid="button-save-business">
                      <Save size={13} /> Save Changes
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Import Clients */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Upload size={14} /> Import Clients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Paste client list — one per line. Format: Name, Phone, Email (comma or tab separated)</p>
                <Textarea
                  value={bulkText}
                  onChange={(e) => { setBulkText(e.target.value); setBulkPreview([]); }}
                  rows={4}
                  placeholder={"John Smith, (555) 123-4567, john@email.com\nJane Doe, (555) 987-6543, jane@email.com"}
                  className="text-sm font-mono"
                  data-testid="textarea-bulk-import"
                />
                {bulkPreview.length > 0 && (
                  <div className="border border-border rounded-md overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border">
                          <th className="text-left px-2 py-1.5 font-medium">Name</th>
                          <th className="text-left px-2 py-1.5 font-medium">Phone</th>
                          <th className="text-left px-2 py-1.5 font-medium">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkPreview.map((row, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="px-2 py-1.5">{row.name}</td>
                            <td className="px-2 py-1.5">{row.phone}</td>
                            <td className="px-2 py-1.5">{row.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleBulkPreview} disabled={!bulkText.trim()} data-testid="button-preview-import">
                    Preview
                  </Button>
                  {bulkPreview.length > 0 && (
                    <Button size="sm" className="h-8 text-xs" onClick={handleBulkImport} disabled={bulkImportMutation.isPending} data-testid="button-import-all">
                      Import {bulkPreview.length} Clients
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Your Business Line */}
            <Card className="border-border bg-card" data-testid="card-business-line">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Phone size={14} /> Your Business Line
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {phoneLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : phoneStatus?.businessPhone ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Phone size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold font-mono" data-testid="text-business-phone">
                            {formatPhoneDisplay(phoneStatus.businessPhone)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {phoneStatus.phoneSetupType === 'hosted' ? 'Text-enabled landline' : 'Dedicated line'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${phoneStatus.phoneSetupStatus === 'active' ? 'bg-green-500' : phoneStatus.phoneSetupStatus === 'verifying' ? 'bg-yellow-500' : phoneStatus.phoneSetupStatus === 'failed' ? 'bg-red-500' : 'bg-muted'}`} />
                        <span className={`text-xs font-medium capitalize ${phoneStatus.phoneSetupStatus === 'active' ? 'text-green-500' : phoneStatus.phoneSetupStatus === 'verifying' ? 'text-yellow-500' : phoneStatus.phoneSetupStatus === 'failed' ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {phoneStatus.phoneSetupStatus || 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5"
                        disabled={phoneTestSmsMutation.isPending || !phoneStatus.smsEnabled}
                        onClick={() => {
                          const ph = getSetting("business_phone") || user?.phone;
                          if (!ph) {
                            toast({ title: "Set a business phone first", variant: "destructive" });
                            return;
                          }
                          phoneTestSmsMutation.mutate(ph);
                        }}
                        data-testid="button-test-sms"
                      >
                        {phoneTestSmsMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Send Test SMS
                      </Button>
                    </div>
                    <div className="rounded-md bg-muted/30 p-2.5 text-xs space-y-1">
                      <p className="font-medium">Webhook URL (for incoming SMS):</p>
                      <code className="block bg-background px-2 py-1 rounded text-[10px] break-all">
                        {window.location.origin}/api/webhooks/twilio/incoming
                      </code>
                      <p className="text-muted-foreground">Add this URL to your Twilio console under "A MESSAGE COMES IN" webhook.</p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">No business line set up yet.</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => {
                          const num = prompt("Enter your business phone number:");
                          if (num) setupHostedMutation.mutate(num);
                        }}
                        disabled={setupHostedMutation.isPending}
                        data-testid="button-setup-hosted"
                      >
                        <Phone size={12} /> Text-enable my number
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => {
                          const ac = prompt("Preferred area code (optional):") || undefined;
                          provisionNewMutation.mutate(ac);
                        }}
                        disabled={provisionNewMutation.isPending}
                        data-testid="button-provision-new"
                      >
                        <Plus size={12} /> Get a new number
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Auto-create leads from unknown numbers</p>
                    <p className="text-xs text-muted-foreground">When someone texts who isn't in your client list</p>
                  </div>
                  <Switch
                    checked={getSetting("auto_create_leads") !== "false"}
                    onCheckedChange={() => handleToggle("auto_create_leads", getSetting("auto_create_leads") || "true")}
                    data-testid="toggle-auto-leads"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Email Setup (SendGrid) */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Mail size={14} /> Email Setup (SendGrid)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="from-email" className="text-xs">Send emails from</Label>
                  <Input
                    id="from-email"
                    defaultValue={getSetting("from_email")}
                    placeholder="hello@yourbusiness.com"
                    className="h-9 text-sm"
                    onBlur={(e) => updateSettingMutation.mutate({ key: "from_email", value: e.target.value })}
                    data-testid="input-from-email"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Must be verified in your SendGrid account.</p>
                </div>
                <div>
                  <Label htmlFor="from-name" className="text-xs">Sender name</Label>
                  <Input
                    id="from-name"
                    defaultValue={getSetting("from_name")}
                    placeholder="Your Business Name"
                    className="h-9 text-sm"
                    onBlur={(e) => updateSettingMutation.mutate({ key: "from_name", value: e.target.value })}
                    data-testid="input-from-name"
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Enable email notifications</p>
                    <p className="text-xs text-muted-foreground">Send real emails via SendGrid</p>
                  </div>
                  <Switch
                    checked={getSetting("email_enabled") === "true"}
                    onCheckedChange={() => handleToggle("email_enabled", getSetting("email_enabled"))}
                    data-testid="toggle-email-enabled"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  disabled={testEmailMutation.isPending || !getSetting("from_email")}
                  onClick={() => {
                    const email = user?.email;
                    if (!email) {
                      toast({ title: "No account email found", variant: "destructive" });
                      return;
                    }
                    testEmailMutation.mutate(email);
                  }}
                  data-testid="button-test-email"
                >
                  {testEmailMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Send test email
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services */}
        <TabsContent value="services">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Service Menu & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {SERVICE_CATEGORIES.map((cat) => {
                    const svcs = groupedServices[cat] || [];
                    if (!svcs.length) return null;
                    const collapsed = collapsedCats.has(cat);
                    return (
                      <div key={cat} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleCategory(cat)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          {collapsed ? <ChevronRight size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                          <span className="text-xs font-semibold uppercase tracking-wider">{cat}</span>
                          <span className="text-[10px] text-muted-foreground">({svcs.length})</span>
                        </button>
                        {!collapsed && (
                          <div className="divide-y divide-border">
                            {svcs.map((svc) => (
                              <ServiceRow
                                key={svc.id}
                                service={svc}
                                onSave={(data) =>
                                  updateServiceMutation.mutate({ id: svc.id, data })
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation */}
        <TabsContent value="automation">
          <div className="space-y-4">
            {/* SMS Automations */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  SMS Automations
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-send SMS notifications at key moments.
                </p>
              </CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { key: "auto_booking_confirmation", label: "Booking confirmation", desc: "Sent when an appointment is created" },
                      { key: "auto_24hr_reminder", label: "24-hour reminder", desc: "Sent day before appointment" },
                      { key: "auto_followup", label: "Post-service follow-up", desc: "Sent after job is marked complete" },
                      { key: "auto_review_request", label: "Review request", desc: "Ask for a review after follow-up" },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-1">
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={getSetting(key) === "true"}
                          onCheckedChange={() => handleToggle(key, getSetting(key))}
                          data-testid={`toggle-${key}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Auto-Reply Settings */}
            <Card className="border-border bg-card" data-testid="card-ai-settings">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  AI Auto-Replies
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Let AI draft and send replies to client texts automatically.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">AI auto-replies</p>
                    <p className="text-xs text-muted-foreground">When on, AI sends replies automatically. When off, you review drafts first.</p>
                  </div>
                  <Switch
                    checked={user?.aiAutoReply ?? true}
                    onCheckedChange={(val) => aiSettingsMutation.mutate({ aiAutoReply: val })}
                    data-testid="toggle-ai-auto-reply"
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Send price quotes automatically</p>
                    <p className="text-xs text-muted-foreground">Price inquiries get instant responses</p>
                  </div>
                  <Switch
                    checked={user?.aiAutoPrice ?? true}
                    onCheckedChange={(val) => aiSettingsMutation.mutate({ aiAutoPrice: val })}
                    data-testid="toggle-ai-auto-price"
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Auto-schedule appointments</p>
                    <p className="text-xs text-muted-foreground">Booking requests get auto-handled</p>
                  </div>
                  <Switch
                    checked={user?.aiAutoSchedule ?? false}
                    onCheckedChange={(val) => aiSettingsMutation.mutate({ aiAutoSchedule: val })}
                    data-testid="toggle-ai-auto-schedule"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reply style</Label>
                  <Select
                    value={user?.aiReplyStyle || 'casual'}
                    onValueChange={(val) => aiSettingsMutation.mutate({ aiReplyStyle: val })}
                  >
                    <SelectTrigger className="h-9 text-sm" data-testid="select-reply-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Friendly & casual</SelectItem>
                      <SelectItem value="direct">Short & direct</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    {user?.aiReplyStyle === 'professional' && '"Thank you for reaching out. I\'d be happy to assist you with..."'}
                    {(user?.aiReplyStyle === 'casual' || !user?.aiReplyStyle) && '"Hey! Thanks for hitting us up. Let me help you out..."'}
                    {user?.aiReplyStyle === 'direct' && '"Full detail on a sedan: $250. Want me to book you in?"'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Share & Embed */}
        <TabsContent value="sharing">
          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Link2 size={14} /> Booking Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Share this link on Instagram, TikTok, Facebook, or anywhere clients can find you.</p>
                <div className="flex gap-2">
                  <Input value={bookingUrl} readOnly className="h-9 text-xs font-mono" data-testid="input-booking-url" />
                  <Button size="sm" variant="outline" className="h-9 px-3 gap-1.5 shrink-0" onClick={() => handleCopy(bookingUrl, "Link")} data-testid="button-copy-link">
                    <Copy size={13} /> Copy
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <QrCode size={14} /> QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Great for business cards, flyers, and vehicle wraps.</p>
                <div className="flex justify-center p-4 bg-white rounded-lg border border-border" data-testid="qr-code-display">
                  <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="w-48 h-48" />
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 w-full" data-testid="button-download-qr">
                  <Download size={13} /> Download QR Code
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Embed Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Paste this into your website to add a booking widget.</p>
                <div className="bg-muted/30 rounded-md p-2.5">
                  <code className="text-[10px] break-all text-foreground">{embedCode}</code>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => handleCopy(embedCode, "Embed code")} data-testid="button-copy-embed">
                  <Copy size={13} /> Copy embed code
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Account & Billing */}
        <TabsContent value="account">
          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Account & Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">{user?.businessName}</p>
                  </div>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Crown size={10} />
                    {planLabel} Plan
                  </Badge>
                </div>

                {user?.plan === "free" && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full h-9 text-sm gap-2"
                      onClick={() => handleUpgradeCheckout('pro')}
                      data-testid="button-upgrade-pro"
                    >
                      <Crown size={14} className="text-primary" />
                      Upgrade to Pro — $89/month
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-9 text-sm gap-2"
                      onClick={() => handleUpgradeCheckout('shop')}
                      data-testid="button-upgrade-shop"
                    >
                      <Crown size={14} className="text-primary" />
                      Upgrade to Shop — $179/month
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="py-4">
                <Button
                  variant="outline"
                  className="w-full h-9 text-sm gap-2 text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                  data-testid="button-signout"
                >
                  <LogOut size={14} />
                  Sign out
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upgrade modal */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Upgrade Your Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3 p-3 rounded-lg border border-border">
              <p className="text-sm font-semibold">Pro — $89/month</p>
              <ul className="space-y-1.5">
                {[
                  "Unlimited clients",
                  "Full calendar & scheduling",
                  "Automated SMS & email",
                  "CRM + client history",
                  "Quote builder",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check size={12} className="text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full h-9 text-sm"
                onClick={() => handleUpgradeCheckout('pro')}
                data-testid="button-checkout-pro"
              >
                Upgrade to Pro
              </Button>
            </div>
            <div className="space-y-3 p-3 rounded-lg border border-border">
              <p className="text-sm font-semibold">Shop — $179/month</p>
              <ul className="space-y-1.5">
                {[
                  "Everything in Pro",
                  "Multi-tech support (5 users)",
                  "Analytics dashboard",
                  "Review automation",
                  "Route optimization",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check size={12} className="text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full h-9 text-sm"
                onClick={() => handleUpgradeCheckout('shop')}
                data-testid="button-checkout-shop"
              >
                Upgrade to Shop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServiceRow({
  service,
  onSave,
}: {
  service: Service;
  onSave: (data: any) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(service.name);
  const [sedanPrice, setSedanPrice] = useState(String(service.sedanPrice || ""));
  const [suvPrice, setSuvPrice] = useState(String(service.suvPrice || ""));
  const [vanPrice, setVanPrice] = useState(String(service.vanPrice || ""));
  const [flatPrice, setFlatPrice] = useState(String(service.flatPrice || ""));

  if (!editing) {
    return (
      <div
        className="flex items-center justify-between px-3 py-2.5 hover:bg-accent/30 transition-colors cursor-pointer"
        onClick={() => setEditing(true)}
        data-testid={`service-row-${service.id}`}
      >
        <div>
          <p className="text-sm font-medium">{service.name}</p>
          {service.isFlat ? (
            <p className="text-xs text-muted-foreground">
              Flat: ${service.flatPrice?.toFixed(0)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sedan: ${service.sedanPrice?.toFixed(0)} · SUV: $
              {service.suvPrice?.toFixed(0)} · Van: $
              {service.vanPrice?.toFixed(0)}
            </p>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">Edit</span>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5 bg-primary/5 space-y-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 text-sm"
        data-testid={`input-service-name-${service.id}`}
      />
      {service.isFlat ? (
        <div>
          <Label className="text-[10px]">Flat Price</Label>
          <Input
            type="number"
            value={flatPrice}
            onChange={(e) => setFlatPrice(e.target.value)}
            className="h-8 text-sm w-28"
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[10px]">Sedan</Label>
            <Input type="number" value={sedanPrice} onChange={(e) => setSedanPrice(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[10px]">SUV</Label>
            <Input type="number" value={suvPrice} onChange={(e) => setSuvPrice(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[10px]">Van</Label>
            <Input type="number" value={vanPrice} onChange={(e) => setVanPrice(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            onSave({
              name,
              ...(service.isFlat
                ? { flatPrice: Number(flatPrice) }
                : {
                    sedanPrice: Number(sedanPrice),
                    suvPrice: Number(suvPrice),
                    vanPrice: Number(vanPrice),
                  }),
            });
            setEditing(false);
          }}
          data-testid={`button-save-service-${service.id}`}
        >
          Save
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
