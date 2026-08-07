"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PhaseShell } from "./PhaseShell";
import { IncompleteState } from "./IncompleteState";
import { MessageCircle, Mail, Share2, Copy, Check, ExternalLink, Sparkles, RefreshCw, Send, Globe, Link as LinkIcon } from "lucide-react";
import type { RankedLead } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "email", label: "Email", icon: Mail },
  { id: "instagram", label: "Instagram DM", icon: Share2 },
];

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function Phase5Outreach({
  selected,
  sessionId,
  onPrev,
  onReset,
}: {
  selected: RankedLead | null;
  sessionId?: string | null;
  onPrev: () => void;
  onReset: () => void;
}) {
  const { getIdToken } = useAuth();
  const [channel, setChannel] = useState("whatsapp");
  const [lang, setLang] = useState<"hinglish" | "english">("hinglish");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [includeLink, setIncludeLink] = useState(true);

  // Compute or save preview URL to Firestore automatically
  useEffect(() => {
    if (!selected) return;

    // Derive deterministic preview URL
    const nameSlug = slugify(selected.name) || "business";
    const shortId = selected.id ? selected.id.slice(-6) : "demo";
    const pId = `${nameSlug}-${shortId}`;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const fullUrl = `${origin}/preview/${pId}`;
    setPreviewUrl(fullUrl);

    // Save/ensure preview in Firestore asynchronously
    fetch("/api/previews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lead: selected }),
    }).catch((err) => console.error("Failed to auto-save preview for outreach:", err));
  }, [selected]);

  const initialDraft = useMemo(() => {
    if (!selected) return "";
    return generatePitch(selected, channel, lang, previewUrl, includeLink);
  }, [selected, channel, lang, previewUrl, includeLink]);

  const [message, setMessage] = useState(initialDraft);

  // Update message when channel, language, or link settings change
  useEffect(() => {
    if (selected) {
      setMessage(generatePitch(selected, channel, lang, previewUrl, includeLink));
    }
  }, [selected, channel, lang, previewUrl, includeLink]);

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Outreach pitch copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function openChannel() {
    if (!selected) return;
    setSending(true);

    if (sessionId) {
      try {
        const token = await getIdToken();
        await fetch(`/api/sessions/${sessionId}/outreach`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            leadId: selected.id,
            leadName: selected.name,
            channel,
            language: lang,
            status: "sent",
            body: message
          })
        });
      } catch (err) {
        console.error("Failed to save outreach status:", err);
      } finally {
        setSending(false);
      }
    }

    if (channel === "whatsapp" && selected.phone) {
      const num = selected.phone.replace(/\D/g, "");
      const full = num.length === 10 ? `91${num}` : num;
      window.open(`https://wa.me/${full}?text=${encodeURIComponent(message)}`, "_blank");
    } else if (channel === "email" && selected.email) {
      window.open(`mailto:${selected.email}?subject=${encodeURIComponent(`Website design preview for ${selected.name}`)}&body=${encodeURIComponent(message)}`, "_blank");
    } else {
      copyText(message);
      toast.info("Opened copy. Paste into " + channel);
    }
  }

  if (!selected) {
    return (
      <PhaseShell
        title="Phase 5 — Multi-channel outreach"
        subtitle="Hinglish or English pitches crafted specifically for WhatsApp, Email, and Instagram with live website preview links."
        onPrev={onPrev}
        nextDisabled
        nextLabel="Finish"
      >
        <IncompleteState
          title="No prospect selected"
          description="Pick a top prospect in Phase 3 to generate custom outreach pitches with live preview links."
          actionLabel="Go to Rank"
          onAction={onPrev}
        />
      </PhaseShell>
    );
  }

  return (
    <PhaseShell
      title="Phase 5 — Multi-channel outreach"
      subtitle="Hinglish or English pitches crafted specifically for WhatsApp, Email, and Instagram with live website preview links."
      onPrev={onPrev}
      onNext={onReset}
      nextLabel="Start new search"
    >
      {/* Target Prospect & Live Preview Link Bar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap bg-white border border-sky-100 rounded-2xl p-5 shadow-lg shadow-sky-500/5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold">Target Prospect</div>
          <div className="font-sans font-bold text-xl text-slate-900 mt-0.5">{selected.name}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">{selected.phone || selected.email || "No direct phone"}</div>
        </div>

        {/* Live Preview Link Badge */}
        {previewUrl && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Live Prospect Preview Link</div>
              <div className="text-xs font-mono text-emerald-700 font-semibold truncate max-w-[200px] sm:max-w-[300px]">{previewUrl}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(previewUrl);
                  toast.success("Live preview link copied!");
                }}
                className="h-7 px-2 text-[11px] font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg"
              >
                <Copy className="h-3 w-3 mr-1" /> Copy Link
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(previewUrl, "_blank")}
                className="h-7 px-2 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 rounded-lg"
              >
                <ExternalLink className="h-3 w-3 mr-1" /> Test
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-sky-50 border border-sky-200 p-1">
            <button
              onClick={() => setLang("hinglish")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${lang === "hinglish" ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Hinglish
            </button>
            <button
              onClick={() => setLang("english")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${lang === "english" ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Channel Switcher */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex gap-2">
          {CHANNELS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={channel === id ? "default" : "outline"}
              size="sm"
              onClick={() => setChannel(id)}
              className={`rounded-xl h-9 px-4 text-xs font-semibold cursor-pointer ${channel === id ? "bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20" : "border-sky-200 text-slate-700 hover:bg-sky-50"}`}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" /> {label}
            </Button>
          ))}
        </div>

        {/* Toggle Include Preview Link */}
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-sky-100 shadow-2xs">
          <input
            type="checkbox"
            checked={includeLink}
            onChange={(e) => setIncludeLink(e.target.checked)}
            className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
          />
          <LinkIcon className="h-3.5 w-3.5 text-sky-600" /> Include Live Website Preview Link in Pitch
        </label>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5 gap-3">
            <CardTitle className="text-base tracking-tight font-bold text-slate-900">Outreach Message (with Live Preview Link)</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => copyText(message)} className="rounded-xl h-8.5 px-3 border-sky-200 text-slate-700 text-xs font-semibold hover:bg-sky-50">
                <Copy className="h-3.5 w-3.5 mr-1" /> {copied ? "Copied!" : "Copy"}
              </Button>
              <Button size="sm" onClick={openChannel} disabled={sending} className="rounded-xl h-8.5 px-3.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-md shadow-sky-600/20 cursor-pointer">
                <Send className="h-3.5 w-3.5 mr-1" /> Send via {channel === "whatsapp" ? "WhatsApp" : channel === "email" ? "Email" : "DM"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="font-mono text-xs leading-relaxed min-h-[340px] rounded-xl border-sky-100 focus-visible:ring-1 focus-visible:ring-sky-500 p-4 bg-sky-50/20 text-slate-800 select-all"
            />
            <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 font-sans">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              <span>Includes live preview link + ratings, review volume, and lost revenue metrics</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/80 via-white to-white p-6 shadow-lg shadow-sky-500/5 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 mb-3 shadow-xs">
            <Sparkles className="h-6 w-6" />
          </div>
          <Badge className="bg-sky-100 text-sky-700 border-sky-300 font-mono text-xs px-3 py-1 font-bold">
            PIPELINE COMPLETE
          </Badge>
          <h3 className="text-xl font-bold text-slate-900 pt-3">Ready to Convert!</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed font-sans">
            You scraped, audited, ranked, and generated a live website preview link + pitch message for <strong>{selected.name}</strong>. Send the message now to close the deal!
          </p>

          {previewUrl && (
            <div className="mt-5 w-full bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <Globe className="h-4 w-4 text-emerald-600" /> Live Client Website Preview
              </div>
              <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded-lg break-all select-all border border-slate-200">
                {previewUrl}
              </div>
              <div className="flex justify-end pt-1">
                <Button size="sm" onClick={() => window.open(previewUrl, "_blank")} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg">
                  Open Client Preview →
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PhaseShell>
  );
}

function generatePitch(
  l: RankedLead,
  ch: string,
  lang: "hinglish" | "english",
  previewUrl: string,
  includeLink: boolean
): string {
  const name = l.name;
  const city = l.city.split(",")[0];
  const reviews = l.reviewsCount ?? 0;
  const rating = l.rating ?? 4.5;
  const lost = (l.audit.estLostRevenuePerMonth || 45000).toLocaleString("en-IN");
  const gap = l.audit.biggestGap;

  const linkBlock = includeLink && previewUrl
    ? `\n\n🚀 Maine aapke business ke liye ek interactive live website preview ready kiya hai:\n👉 ${previewUrl}\n`
    : "";

  const linkBlockEng = includeLink && previewUrl
    ? `\n\n🚀 I've created a custom, interactive live website preview for ${name}:\n👉 ${previewUrl}\n`
    : "";

  if (lang === "hinglish") {
    if (ch === "whatsapp") {
      return `Namaste ${name} team! 👋

Mera naam Rajat hai. Aapka Google profile dekha (${city} me ${rating}★ rating with ${reviews} reviews) — kaafi accha kaam kar rahe ho aap!

Main local businesses ke liye high-converting websites banata hu. Aapke profile ko audit karne par dekha ki:
• ${gap}
• Iski wajah se est. ₹${lost}/month ki new patient/customer leads miss ho rahi hain.${linkBlock}
Zero obligation, bilkul free demo link hai. Aap phone par open karke check kar sakte ho!`;
    }
    return `Subject: ${name} ke liye new website design + ₹${lost}/mo extra leads

Hi ${name} team,

Aapka Google business listing check kar raha tha. ${rating}★ with ${reviews} reviews super impressive hai!

Magar ek choti problem noticeable hai: ${gap}.${linkBlock}
Aaj kal 80%+ customers pehle website check karke call karte hain. Aap upar waale link par click karke dekhiye ki aapka business online kitna premium dikh sakta hai.

Agar pasand aaye to batana, setup bilkul fast ho jayega!

Best regards,
Rajat`;
  } else {
    if (ch === "whatsapp") {
      return `Hi ${name} team! 👋

I noticed your Google listing in ${city} (${rating}★ with ${reviews}+ reviews) — impressive reputation!

I ran a quick audit on your online presence and spotted a key growth bottleneck:
• ${gap}
• Estimated revenue leakage: ~₹${lost}/month in missed bookings.${linkBlockEng}
You can tap the link above to test how your business website looks on mobile & desktop. Zero cost, totally free preview!`;
    }
    return `Subject: Digital growth proposal for ${name}

Hello ${name} team,

Congratulations on maintaining a strong ${rating}★ reputation on Google in ${city}!

While auditing top local businesses in your category, I noticed:
• ${gap}
• Estimated missed revenue: ₹${lost}/month.${linkBlockEng}
Click the link above to test the interactive live website concept designed specifically for ${name}.

Would you be open to reviewing the demo this week?

Best regards,
Rajat`;
  }
}
