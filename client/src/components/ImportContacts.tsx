import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Smartphone,
  ClipboardList,
  Globe,
  CheckCircle2,
  FileUp,
  X,
  AlertCircle,
} from "lucide-react";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

// Helper to make authenticated fetch requests with file uploads
async function uploadFile(url: string, formData: FormData): Promise<any> {
  const token = auth.getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

async function postJSON(url: string, data: any): Promise<any> {
  const token = auth.getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

// ===== Contact type =====
interface ParsedContact {
  name: string;
  phone: string;
  email: string;
  address?: string;
  selected?: boolean;
}

// ===== MAPPING OPTIONS =====
const MAPPING_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "address", label: "Address" },
  { value: "vehicle_make", label: "Vehicle Make" },
  { value: "vehicle_model", label: "Vehicle Model" },
  { value: "vehicle_year", label: "Vehicle Year" },
  { value: "skip", label: "Skip this column" },
];

// ===== FILE DROP ZONE =====
function FileDropZone({
  accept,
  label,
  onFile,
  fileName,
  onClear,
}: {
  accept: string;
  label: string;
  onFile: (file: File) => void;
  fileName?: string;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        dragOver
          ? "border-primary bg-primary/5"
          : fileName
          ? "border-primary/40 bg-primary/5"
          : "border-border hover:border-muted-foreground/50 bg-muted/20"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !fileName && inputRef.current?.click()}
      data-testid="dropzone-file"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      {fileName ? (
        <div className="flex items-center justify-center gap-2">
          <FileUp size={18} className="text-primary" />
          <span className="text-sm font-medium">{fileName}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="ml-2 text-muted-foreground hover:text-foreground"
            data-testid="button-clear-file"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <Upload size={28} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{label}</p>
        </>
      )}
    </div>
  );
}

// ===== PREVIEW TABLE =====
function ContactPreviewTable({
  contacts,
  onToggle,
  onEdit,
  showCheckbox,
}: {
  contacts: ParsedContact[];
  onToggle?: (index: number) => void;
  onEdit?: (index: number, field: keyof ParsedContact, value: string) => void;
  showCheckbox: boolean;
}) {
  if (!contacts.length) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 sticky top-0">
            {showCheckbox && (
              <th className="px-3 py-2 w-8"></th>
            )}
            <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">
              Name
            </th>
            <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">
              Phone
            </th>
            <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground hidden sm:table-cell">
              Email
            </th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {showCheckbox && (
                <td className="px-3 py-2">
                  <Checkbox
                    checked={c.selected !== false}
                    onCheckedChange={() => onToggle?.(i)}
                    data-testid={`checkbox-contact-${i}`}
                  />
                </td>
              )}
              <td className="px-3 py-2">
                {onEdit ? (
                  <Input
                    value={c.name}
                    onChange={(e) => onEdit(i, "name", e.target.value)}
                    className="h-7 text-xs border-transparent hover:border-border focus:border-primary bg-transparent"
                    data-testid={`input-contact-name-${i}`}
                  />
                ) : (
                  <span className="text-xs">{c.name}</span>
                )}
              </td>
              <td className="px-3 py-2">
                {onEdit ? (
                  <Input
                    value={c.phone}
                    onChange={(e) => onEdit(i, "phone", e.target.value)}
                    className="h-7 text-xs border-transparent hover:border-border focus:border-primary bg-transparent"
                    data-testid={`input-contact-phone-${i}`}
                  />
                ) : (
                  <span className="text-xs">{c.phone || "—"}</span>
                )}
              </td>
              <td className="px-3 py-2 hidden sm:table-cell">
                {onEdit ? (
                  <Input
                    value={c.email}
                    onChange={(e) => onEdit(i, "email", e.target.value)}
                    className="h-7 text-xs border-transparent hover:border-border focus:border-primary bg-transparent"
                    data-testid={`input-contact-email-${i}`}
                  />
                ) : (
                  <span className="text-xs">{c.email || "—"}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== SUCCESS STATE =====
function ImportSuccess({
  imported,
  duplicates,
  errors,
  onClose,
}: {
  imported: number;
  duplicates: number;
  errors: number;
  onClose: () => void;
}) {
  return (
    <div className="py-8 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
        <CheckCircle2 size={28} className="text-green-500" />
      </div>
      <div>
        <p className="text-base font-semibold">
          Imported {imported} contact{imported !== 1 ? "s" : ""}
        </p>
        {duplicates > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {duplicates} duplicate{duplicates !== 1 ? "s" : ""} skipped
          </p>
        )}
        {errors > 0 && (
          <p className="text-sm text-destructive mt-1">
            {errors} error{errors !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <Button onClick={onClose} className="h-9 text-sm" data-testid="button-import-done">
        Go to Clients
      </Button>
    </div>
  );
}

// ===== TAB 1: CSV/SPREADSHEET UPLOAD =====
function CSVTab() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    headers: string[];
    rows: Record<string, string>[];
    totalRows: number;
    autoMapping: Record<string, string>;
  } | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    imported: number;
    duplicates: number;
    errors: number;
  } | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setResult(null);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("file", f);
      const data = await uploadFile("/api/clients/import-csv/preview", formData);
      setPreview(data);
      setMapping(data.autoMapping || {});
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleImport = async () => {
    if (!file || !preview) return;
    setImporting(true);
    setProgress(30);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mapping", JSON.stringify(mapping));

      setProgress(60);
      const data = await uploadFile("/api/clients/import-csv", formData);
      setProgress(100);
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/count"] });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  if (result) {
    return (
      <ImportSuccess
        imported={result.imported}
        duplicates={result.duplicates}
        errors={result.errors}
        onClose={() => {
          setFile(null);
          setPreview(null);
          setResult(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <FileDropZone
        accept=".csv,.tsv,.xlsx,.xls,.txt"
        label="Drop a CSV, Excel, or spreadsheet file here — or click to browse"
        onFile={handleFile}
        fileName={file?.name}
        onClear={() => {
          setFile(null);
          setPreview(null);
        }}
      />

      {preview && (
        <>
          {/* Column mapper */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Column Mapping
            </p>
            <div className="grid gap-2">
              {preview.headers.map((header) => (
                <div key={header} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-32 truncate shrink-0">{header}</span>
                  <Select
                    value={mapping[header] || "skip"}
                    onValueChange={(val) =>
                      setMapping((prev) => ({ ...prev, [header]: val }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs flex-1" data-testid={`select-mapping-${header}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MAPPING_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview table */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Preview (first {preview.rows.length} rows of {preview.totalRows})
            </p>
            <div className="border border-border rounded-lg overflow-auto max-h-[200px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 sticky top-0">
                    {preview.headers.map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {preview.headers.map((h) => (
                        <td key={h} className="px-3 py-1.5 whitespace-nowrap max-w-[150px] truncate">
                          {row[h] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {importing ? (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">Importing contacts...</p>
            </div>
          ) : (
            <Button
              className="w-full h-10 text-sm"
              onClick={handleImport}
              data-testid="button-import-csv"
            >
              Import {preview.totalRows} contacts
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// ===== TAB 2: IPHONE VCF =====
function VCFTab() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    imported: number;
    duplicates: number;
    errors: number;
  } | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setResult(null);
    setContacts([]);

    try {
      const formData = new FormData();
      formData.append("file", f);
      formData.append("action", "preview");
      const data = await uploadFile("/api/clients/import-vcf", formData);
      setContacts(
        (data.contacts || []).map((c: any) => ({ ...c, selected: true }))
      );
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleContact = (index: number) => {
    setContacts((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, selected: !c.selected } : c
      )
    );
  };

  const selectedCount = contacts.filter((c) => c.selected !== false).length;

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setProgress(40);

    try {
      const selectedIndices = contacts
        .map((c, i) => (c.selected !== false ? i : -1))
        .filter((i) => i >= 0);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "import");
      formData.append("selectedIndices", JSON.stringify(selectedIndices));

      setProgress(70);
      const data = await uploadFile("/api/clients/import-vcf", formData);
      setProgress(100);
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/count"] });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  if (result) {
    return (
      <ImportSuccess
        imported={result.imported}
        duplicates={result.duplicates}
        errors={result.errors}
        onClose={() => {
          setFile(null);
          setContacts([]);
          setResult(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium">How to export from iPhone:</p>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Open the <strong>Contacts</strong> app</li>
          <li>Tap <strong>Lists</strong> → <strong>All Contacts</strong></li>
          <li>Tap the <strong>Share</strong> button → <strong>Export</strong></li>
          <li>Send the .vcf file to yourself (email, AirDrop, etc.)</li>
          <li>Upload it here</li>
        </ol>
      </div>

      <FileDropZone
        accept=".vcf"
        label="Drop a .vcf contacts file here — or click to browse"
        onFile={handleFile}
        fileName={file?.name}
        onClear={() => {
          setFile(null);
          setContacts([]);
        }}
      />

      {contacts.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found <strong>{contacts.length}</strong> contact{contacts.length !== 1 ? "s" : ""} in your file
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() =>
                setContacts((prev) => {
                  const allSelected = prev.every((c) => c.selected !== false);
                  return prev.map((c) => ({ ...c, selected: !allSelected }));
                })
              }
              data-testid="button-toggle-all-vcf"
            >
              {contacts.every((c) => c.selected !== false) ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <ContactPreviewTable
            contacts={contacts}
            onToggle={toggleContact}
            showCheckbox={true}
          />

          {importing ? (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">Importing contacts...</p>
            </div>
          ) : (
            <Button
              className="w-full h-10 text-sm"
              onClick={handleImport}
              disabled={selectedCount === 0}
              data-testid="button-import-vcf"
            >
              Import {selectedCount} Selected Contact{selectedCount !== 1 ? "s" : ""}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// ===== TAB 3: PASTE TEXT =====
function PasteTab() {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [parsed, setParsed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    imported: number;
    duplicates: number;
    errors: number;
  } | null>(null);

  const handleParse = async () => {
    if (!text.trim()) return;
    try {
      const data = await postJSON("/api/clients/import-text", {
        text,
        action: "parse",
      });
      setContacts(
        (data.contacts || []).map((c: any) => ({
          ...c,
          selected: true,
        }))
      );
      setParsed(true);
    } catch (err: any) {
      toast({ title: "Parse error", description: err.message, variant: "destructive" });
    }
  };

  const editContact = (index: number, field: keyof ParsedContact, value: string) => {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const toggleContact = (index: number) => {
    setContacts((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, selected: !c.selected } : c
      )
    );
  };

  const selectedContacts = contacts.filter((c) => c.selected !== false);

  const handleImport = async () => {
    setImporting(true);
    setProgress(40);

    try {
      const toImport = selectedContacts.map((c) => ({
        name: c.name,
        phone: c.phone,
        email: c.email,
      }));

      setProgress(70);
      const data = await postJSON("/api/clients/import-text", {
        text: "",
        action: "import",
        contacts: toImport,
      });
      setProgress(100);
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/count"] });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  if (result) {
    return (
      <ImportSuccess
        imported={result.imported}
        duplicates={result.duplicates}
        errors={result.errors}
        onClose={() => {
          setText("");
          setContacts([]);
          setParsed(false);
          setResult(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {!parsed ? (
        <>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Paste your client list — one per line\n\nExamples:\nJohn Smith, 555-123-4567, john@email.com\nJane Doe 555-987-6543\nMike Johnson (555) 456-7890 mike@gmail.com\n5551234567\nSarah Williams`}
            rows={8}
            className="text-sm resize-none font-mono"
            data-testid="textarea-paste-contacts"
          />
          <Button
            className="w-full h-10 text-sm"
            onClick={handleParse}
            disabled={!text.trim()}
            data-testid="button-parse-text"
          >
            Parse Contacts
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Parsed <strong>{contacts.length}</strong> contact{contacts.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setParsed(false);
                  setContacts([]);
                }}
                data-testid="button-edit-text"
              >
                Edit text
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() =>
                  setContacts((prev) => {
                    const allSelected = prev.every((c) => c.selected !== false);
                    return prev.map((c) => ({ ...c, selected: !allSelected }));
                  })
                }
                data-testid="button-toggle-all-paste"
              >
                {contacts.every((c) => c.selected !== false) ? "Deselect All" : "Select All"}
              </Button>
            </div>
          </div>

          <ContactPreviewTable
            contacts={contacts}
            onToggle={toggleContact}
            onEdit={editContact}
            showCheckbox={true}
          />

          {importing ? (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">Importing contacts...</p>
            </div>
          ) : (
            <Button
              className="w-full h-10 text-sm"
              onClick={handleImport}
              disabled={selectedContacts.length === 0}
              data-testid="button-import-paste"
            >
              Import {selectedContacts.length} Contact{selectedContacts.length !== 1 ? "s" : ""}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// ===== TAB 4: GOOGLE (COMING SOON) =====
function GoogleTab() {
  return (
    <div className="py-8 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
        <Globe size={28} className="text-muted-foreground" />
      </div>
      <div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <p className="text-sm font-semibold">Import from Google Contacts</p>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0" data-testid="badge-coming-soon">
            Coming Soon
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          One-click import from your Google account. Coming in the next update.
        </p>
      </div>
      <Button disabled className="h-9 text-sm" data-testid="button-connect-google">
        Connect Google
      </Button>
    </div>
  );
}

// ===== MAIN IMPORT MODAL =====
export default function ImportContacts({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="modal-import-contacts">
        <DialogHeader>
          <DialogTitle className="font-display text-base" data-testid="text-import-title">
            Import Contacts
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-9" data-testid="tabs-import-method">
            <TabsTrigger value="csv" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-csv">
              <Upload size={13} />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="vcf" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-vcf">
              <Smartphone size={13} />
              <span className="hidden sm:inline">iPhone</span>
            </TabsTrigger>
            <TabsTrigger value="paste" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-paste">
              <ClipboardList size={13} />
              <span className="hidden sm:inline">Paste</span>
            </TabsTrigger>
            <TabsTrigger value="google" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-google">
              <Globe size={13} />
              <span className="hidden sm:inline">Google</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="mt-4">
            <CSVTab />
          </TabsContent>
          <TabsContent value="vcf" className="mt-4">
            <VCFTab />
          </TabsContent>
          <TabsContent value="paste" className="mt-4">
            <PasteTab />
          </TabsContent>
          <TabsContent value="google" className="mt-4">
            <GoogleTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
