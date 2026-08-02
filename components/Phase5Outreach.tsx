"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PhaseShell } from "./PhaseShell";
import { IncompleteState } from "./IncompleteState";
import { MessageCircle, Mail, Share2, Copy, Check, ExternalLink, Sparkles, RefreshCw, Send } from "lucide-react";
import type { RankedLead } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "email", label: "Email", icon: Mail },
  { id: "instagram", label: "Instagram DM", icon: Share2 },
];


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

  const initialDraft = useMemo(() => {
    if (!selected) return "";
    return generatePitch(selected, channel, lang);
  }, [selected, channel, lang]);

  const [message, setMessage] = useState(initialDraft);

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
      window.open(`mailto:${selected.email}?subject=${encodeURIComponent(`Website design for ${selected.name}`)}&body=${encodeURIComponent(message)}`, "_blank");
    } else {
      copyText(message);
      toast.info("Opened copy. Paste into " + channel);
    }
  }

  if (!selected) {
    return (
      <PhaseShell
        title="Phase 5 — Multi-channel outreach"
        subtitle="Hinglish or English pitches crafted specifically for WhatsApp, Email, and Instagram."
        onPrev={onPrev}
        nextDisabled
        nextLabel="Finish"
      >
        <IncompleteState
          title="No prospect selected"
          description="Pick a top prospect in Phase 3 to generate custom outreach pitches."
          actionLabel="Go to Rank"
          onAction={onPrev}
        />
      </PhaseShell>
    );
  }

  return (
    <PhaseShell
      title="Phase 5 — Multi-channel outreach"
      subtitle="Hinglish or English pitches crafted specifically for WhatsApp, Email, and Instagram."
      onPrev={onPrev}
      onNext={onReset}
      nextLabel="Start new search"
    >
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap bg-white border border-sky-100 rounded-2xl p-5 shadow-lg shadow-sky-500/5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold">Target Prospect</div>
          <div className="font-sans font-bold text-xl text-slate-900 mt-0.5">{selected.name}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">{selected.phone || selected.email || "No direct phone"}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-sky-50 border border-sky-200 p-1">
            <button
              onClick={() => { setLang("hinglish"); setMessage(generatePitch(selected, channel, "hinglish")); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${lang === "hinglish" ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Hinglish
            </button>
            <button
              onClick={() => { setLang("english"); setMessage(generatePitch(selected, channel, "english")); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${lang === "english" ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {CHANNELS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={channel === id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setChannel(id);
              setMessage(generatePitch(selected, id, lang));
            }}
            className={`rounded-xl h-9 px-4 text-xs font-semibold cursor-pointer ${channel === id ? "bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20" : "border-sky-200 text-slate-700 hover:bg-sky-50"}`}
          >
            <Icon className="h-3.5 w-3.5 mr-1.5" /> {label}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5 gap-3">
            <CardTitle className="text-base tracking-tight font-bold text-slate-900">First Message</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => copyText(message)} className="rounded-xl h-8.5 px-3 border-sky-200 text-slate-700 text-xs font-semibold hover:bg-sky-50"><Copy className="h-3.5 w-3.5 mr-1" /> Copy</Button>
              <Button size="sm" onClick={openChannel} disabled={sending} className="rounded-xl h-8.5 px-3.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-md shadow-sky-600/20 cursor-pointer"><Send className="h-3.5 w-3.5 mr-1" /> Send</Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="font-mono text-xs leading-relaxed min-h-[300px] rounded-xl border-sky-100 focus-visible:ring-1 focus-visible:ring-sky-500 p-4 bg-sky-50/20 text-slate-800"
            />
            <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 font-sans">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              <span>Personalized with ratings, review volume, and lost revenue metrics</span>
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
            You scraped, audited, ranked, and generated a tailored website prompt + outreach message for {selected.name}. Send the message now to close the deal!
          </p>
        </Card>
      </div>
    </PhaseShell>
  );
}

function generatePitch(l: RankedLead, ch: string, lang: "hinglish" | "english"): string {
  const name = l.name;
  const city = l.city.split(",")[0];
  const reviews = l.reviewsCount ?? 0;
  const rating = l.rating ?? 4.5;
  const lost = l.audit.estLostRevenuePerMonth.toLocaleString("en-IN");
  const gap = l.audit.biggestGap;

  if (lang === "hinglish") {
    if (ch === "whatsapp") {
      return `Namaste ${name} team! 👋

Mera naam Rajat hai. Aapka Google profile dekha (${city} me ${rating}★ rating with ${reviews} reviews) — kaafi accha kaam kar rahe ho aap!

Main local businesses ke liye high-converting websites banata hu. Aapke profile ko audit karne par dekha ki:
• ${gap}
• Iski wajah se est. ₹${lost}/month ki new patient/customer leads miss ho rahi hain.

Maine aapke business ke liye ek sample demo site structure sketch kiya hai. Kya main 2 min me WhatsApp par link share karu?

Zero obligation, bilkul free demo. Real leads gain karne me help karega!`;
    }
    return `Subject: ${name} ke liye new website design + ₹${lost}/mo extra leads

Hi ${name} team,

Aapka Google business listing check kar raha tha. ${rating}★ with ${reviews} reviews super impressive hai!

Magar ek choti problem noticeable hai: ${gap}.

Aaj kal 80%+ customers pehle website check karke call karte hain. Maine aapke liye ek modern, fast mobile demo design banaya hai.

Agar interested ho to bas "YES" reply kijiye, main link attach karke bhej dunga.

Best regards,
Rajat`;
  } else {
    if (ch === "whatsapp") {
      return `Hi ${name} team! 👋

I noticed your Google listing in ${city} (${rating}★ with ${reviews}+ reviews) — impressive reputation!

I ran a quick audit on your online presence and spotted a key growth bottleneck:
• ${gap}
• Estimated revenue leakage: ~₹${lost}/month in missed bookings.

I've built a free interactive preview website tailored for ${name}. Would you be open to seeing a 2-min demo link?

No pitch, totally free preview!`;
    }
    return `Subject: Digital growth proposal for ${name}

Hello ${name} team,

Congratulations on maintaining a strong ${rating}★ reputation on Google in ${city}!

While auditing top local businesses in your category, I noticed:
• ${gap}
• Estimated missed revenue: ₹${lost}/month.

I have already created a high-converting website concept designed to capture these missed leads.

Would you be open to reviewing the demo preview this week?

Best regards,
Rajat`;
  }
}
