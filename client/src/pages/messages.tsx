import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Send,
  Phone,
  Mail,
  Bot,
  User,
  ArrowLeft,
  Sparkles,
  Edit,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Message, Client, Setting } from "@shared/schema";

type FilterTab = "all" | "sms" | "email" | "web";
type SendChannel = "sms" | "email";

export default function Messages() {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [sendChannel, setSendChannel] = useState<SendChannel>("sms");
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [deliveryStatuses, setDeliveryStatuses] = useState<Record<number, { delivered: boolean; error?: string }>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: allMessages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const { data: clientsList } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: settingsList } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const getSetting = (key: string) =>
    settingsList?.find((s) => s.key === key)?.value || "";

  const smsEnabled = getSetting("sms_enabled") === "true";
  const emailEnabled = getSetting("email_enabled") === "true";

  // Real send mutation (SMS or email)
  const sendMutation = useMutation({
    mutationFn: async (data: { clientId: number; content: string; channel: string }) => {
      const res = await apiRequest("POST", "/api/messages/send", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageText("");
      setAiDraft(null);
      setEditingDraft(false);

      if (data.id) {
        setDeliveryStatuses((prev) => ({
          ...prev,
          [data.id]: { delivered: data.delivered, error: data.deliveryError || undefined },
        }));
      }

      if (data.delivered) {
        toast({ title: `Sent via ${data.channel?.toUpperCase() || "message"}` });
      } else if (data.deliveryError) {
        toast({ title: "Message saved but not delivered", description: data.deliveryError, variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    },
  });

  // Fallback store-only mutation (for when no channel configured)
  const storeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageText("");
      setAiDraft(null);
      setEditingDraft(false);
    },
  });

  // Group messages by client
  const conversations = useMemo(() => {
    if (!allMessages || !clientsList) return [];
    const map = new Map<number, Message[]>();
    for (const msg of allMessages) {
      if (!map.has(msg.clientId)) map.set(msg.clientId, []);
      map.get(msg.clientId)!.push(msg);
    }
    return Array.from(map.entries())
      .map(([clientId, msgs]) => {
        const client = clientsList.find((c) => c.id === clientId);
        const lastMsg = msgs[msgs.length - 1];
        const isNewLead = client?.isLead;
        return { clientId, client, messages: msgs, lastMsg, isNewLead };
      })
      .sort((a, b) => {
        // New leads first
        if (a.isNewLead && !b.isNewLead) return -1;
        if (!a.isNewLead && b.isNewLead) return 1;
        return new Date(b.lastMsg.sentAt).getTime() - new Date(a.lastMsg.sentAt).getTime();
      });
  }, [allMessages, clientsList]);

  const selectedConvo = conversations.find(
    (c) => c.clientId === selectedClientId
  );

  // Auto-detect default channel based on client info
  useEffect(() => {
    if (selectedConvo?.client) {
      if (selectedConvo.client.phone && smsEnabled) {
        setSendChannel("sms");
      } else if (selectedConvo.client.email && emailEnabled) {
        setSendChannel("email");
      } else if (selectedConvo.client.phone) {
        setSendChannel("sms");
      } else {
        setSendChannel("email");
      }
    }
  }, [selectedClientId, smsEnabled, emailEnabled]);

  const filteredMessages = useMemo(() => {
    if (!selectedConvo) return [];
    if (filterTab === "all") return selectedConvo.messages;
    return selectedConvo.messages.filter((m) => m.channel === filterTab);
  }, [selectedConvo, filterTab]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredMessages]);

  // Fetch AI draft when selecting a conversation with inbound messages
  useEffect(() => {
    if (!selectedClientId || !selectedConvo) {
      setAiDraft(null);
      return;
    }
    const lastInbound = [...selectedConvo.messages].reverse().find(m => m.direction === "inbound");
    if (!lastInbound) {
      setAiDraft(null);
      return;
    }
    // Check if last message is inbound (needs reply)
    const lastMsg = selectedConvo.messages[selectedConvo.messages.length - 1];
    if (lastMsg.direction !== "inbound") {
      setAiDraft(null);
      return;
    }
    // Check if the message already has a stored draft
    if (lastMsg.aiDraft) {
      setAiDraft(lastMsg.aiDraft);
      setDraftText(lastMsg.aiDraft);
      return;
    }
    // Fetch AI draft
    apiRequest("POST", "/api/ai/draft-reply", {
      clientId: selectedClientId,
      lastMessage: lastInbound.content,
      clientName: selectedConvo.client?.name || "there",
    }).then(r => r.json()).then(r => {
      setAiDraft(r.draft);
      setDraftText(r.draft);
    }).catch(() => {});
  }, [selectedClientId, allMessages]);

  const handleSend = () => {
    if (!messageText.trim() || !selectedClientId) return;

    // Use real send endpoint
    sendMutation.mutate({
      clientId: selectedClientId,
      content: messageText.trim(),
      channel: sendChannel,
    });
  };

  const handleSendDraft = (text: string) => {
    if (!text.trim() || !selectedClientId) return;

    // Use real send endpoint for AI drafts too
    sendMutation.mutate({
      clientId: selectedClientId,
      content: text.trim(),
      channel: sendChannel,
    });
  };

  const isAutoMessage = (content: string) => {
    const autoKeywords = [
      "confirmed",
      "reminder",
      "looking sharp",
      "review",
      "Thanks for coming",
    ];
    return autoKeywords.some((k) => content.toLowerCase().includes(k.toLowerCase()));
  };

  const isAiGenerated = (msg: Message) => {
    return (msg as any).aiGenerated === true || (msg as any).aiGenerated === 1;
  };

  const getDeliveryStatus = (msgId: number) => {
    return deliveryStatuses[msgId];
  };

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div
        className={cn(
          "w-full lg:w-[300px] border-r border-border flex flex-col",
          selectedClientId ? "hidden lg:flex" : "flex"
        )}
      >
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold font-display" data-testid="text-page-title">
            Messages
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {messagesLoading ? (
            <div className="space-y-0 p-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full mb-1" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-16 text-center px-4">
              <MessageSquare
                size={32}
                className="mx-auto text-muted-foreground/40 mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No conversations yet.
              </p>
            </div>
          ) : (
            conversations.map(({ clientId, client, lastMsg, messages: msgs, isNewLead }) => {
              const hasUnreplied = msgs[msgs.length - 1]?.direction === "inbound";
              return (
                <button
                  key={clientId}
                  onClick={() => { setSelectedClientId(clientId); setFilterTab("all"); }}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border transition-colors",
                    selectedClientId === clientId
                      ? "bg-primary/5"
                      : isNewLead
                      ? "bg-blue-500/5 hover:bg-blue-500/10"
                      : "hover:bg-accent/50"
                  )}
                  data-testid={`convo-${clientId}`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">
                        {client?.name || "Unknown"}
                      </span>
                      {isNewLead && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20">
                          Lead
                        </Badge>
                      )}
                      {hasUnreplied && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(lastMsg.sentAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 shrink-0"
                    >
                      {lastMsg.channel.toUpperCase()}
                    </Badge>
                    <p className="text-xs text-muted-foreground truncate">
                      {lastMsg.direction === "outbound" ? "You: " : ""}
                      {lastMsg.content}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message thread */}
      {selectedClientId ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Thread header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <button
              onClick={() => setSelectedClientId(null)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
              data-testid="button-back-messages"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {selectedConvo?.client?.name || "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedConvo?.client?.phone}
                {selectedConvo?.client?.phone && selectedConvo?.client?.email && " · "}
                {selectedConvo?.client?.email}
              </p>
            </div>
            {/* Filter tabs */}
            <div className="flex gap-1">
              {(["all", "sms", "email", "web"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-md transition-colors uppercase",
                    filterTab === tab
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  data-testid={`tab-filter-${tab}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          >
            {filteredMessages.map((msg) => {
              const isOutbound = msg.direction === "outbound";
              const isAuto = isOutbound && isAutoMessage(msg.content);
              const isAi = isOutbound && isAiGenerated(msg);
              const showAiTag = isAi || isAuto;
              const delivery = getDeliveryStatus(msg.id);
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    isOutbound ? "justify-end" : "justify-start"
                  )}
                  data-testid={`msg-${msg.id}`}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                      isOutbound
                        ? isAi
                          ? "bg-blue-500/8 border border-blue-500/20 text-foreground"
                          : isAuto
                          ? "bg-primary/5 border border-primary/20 text-foreground"
                          : "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {showAiTag && (
                      <div className="flex items-center gap-1 mb-1">
                        <Bot size={10} className={isAi ? "text-blue-400" : "text-primary"} />
                        <span className={cn("text-[10px] font-medium", isAi ? "text-blue-400" : "text-primary")}>
                          {isAi ? "AI" : "Auto"}
                        </span>
                      </div>
                    )}
                    <p className="leading-relaxed">{msg.content}</p>
                    <div className={cn(
                      "flex items-center gap-1.5 mt-1",
                      isOutbound && !showAiTag
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    )}>
                      <span className="text-[10px]">
                        {new Date(msg.sentAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-[10px]">·</span>
                      <span className="text-[10px]">
                        {msg.channel === "sms" ? "SMS" : msg.channel === "email" ? "Email" : msg.channel.toUpperCase()}
                      </span>
                      {isAi && (
                        <>
                          <span className="text-[10px]">·</span>
                          <span className="text-[10px] text-blue-400/70">[AI]</span>
                        </>
                      )}
                      {isOutbound && delivery && (
                        <>
                          <span className="text-[10px]">·</span>
                          {delivery.delivered ? (
                            <span className="flex items-center gap-0.5 text-[10px]">
                              <CheckCircle2 size={9} className={isOutbound && !showAiTag ? "text-green-300" : "text-green-500"} />
                              Sent
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-[10px]">
                              <AlertCircle size={9} className="text-orange-400" />
                              Not delivered
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Draft Section */}
          {aiDraft && (
            <div className="mx-4 mb-2 rounded-lg border border-teal-500/20 bg-teal-500/5 p-3 space-y-2" data-testid="ai-draft-section">
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-teal-400" />
                <span className="text-xs font-semibold text-teal-400">AI Draft</span>
              </div>
              {editingDraft ? (
                <Textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  rows={3}
                  className="text-sm bg-background"
                  autoFocus
                  data-testid="textarea-edit-draft"
                />
              ) : (
                <p className="text-sm leading-relaxed">{aiDraft}</p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => handleSendDraft(editingDraft ? draftText : aiDraft)}
                  disabled={sendMutation.isPending}
                  data-testid="button-send-draft"
                >
                  {sendMutation.isPending ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Send size={10} />
                  )}
                  {editingDraft ? "Send edited" : "Send as-is"}
                </Button>
                {!editingDraft && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => { setEditingDraft(true); setDraftText(aiDraft); }}
                    data-testid="button-edit-draft"
                  >
                    <Edit size={10} /> Edit
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => { setAiDraft(null); setEditingDraft(false); }}
                  data-testid="button-dismiss-draft"
                >
                  <X size={10} /> Dismiss
                </Button>
                <div className="flex-1" />
                <span className="text-[10px] text-muted-foreground">
                  via {sendChannel.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Compose */}
          <div className="px-4 py-3 border-t border-border">
            <div className="flex gap-2 items-center">
              {/* Channel selector pills */}
              <div className="flex rounded-md border border-border overflow-hidden shrink-0">
                <button
                  onClick={() => setSendChannel("sms")}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium transition-colors",
                    sendChannel === "sms"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  data-testid="channel-sms"
                  title={!smsEnabled ? "SMS not enabled — go to Settings" : "Send via SMS"}
                >
                  <Phone size={10} />
                  SMS
                </button>
                <button
                  onClick={() => setSendChannel("email")}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium transition-colors border-l border-border",
                    sendChannel === "email"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  data-testid="channel-email"
                  title={!emailEnabled ? "Email not enabled — go to Settings" : "Send via email"}
                >
                  <Mail size={10} />
                  Email
                </button>
              </div>
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={sendChannel === "sms" ? "Type an SMS..." : "Type an email..."}
                className="h-9 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                data-testid="input-message"
              />
              <Button
                size="sm"
                className="h-9 px-3"
                onClick={handleSend}
                disabled={!messageText.trim() || sendMutation.isPending}
                data-testid="button-send-message"
              >
                {sendMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </Button>
            </div>
            {/* Channel status hint */}
            {sendChannel === "sms" && !smsEnabled && (
              <p className="text-[10px] text-orange-400 mt-1">SMS is not enabled. Messages will be saved but not delivered. Enable in Settings.</p>
            )}
            {sendChannel === "email" && !emailEnabled && (
              <p className="text-[10px] text-orange-400 mt-1">Email is not enabled. Messages will be saved but not delivered. Enable in Settings.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center">
            <MessageSquare
              size={40}
              className="mx-auto text-muted-foreground/30 mb-2"
            />
            <p className="text-sm text-muted-foreground">
              Select a conversation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
