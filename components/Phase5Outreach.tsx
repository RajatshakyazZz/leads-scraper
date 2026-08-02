"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PhaseShell } from "./PhaseShell";
import { IncompleteState } from "./IncompleteState";
import { MessageCircle, Mail, Camera, Copy, ExternalLink, Sparkles } from "lucide-react";
import type { RankedLead, OutreachChannel, OutreachLanguage } from "@/lib/types";
import { toast } from "sonner";

import { useAuth } from "@/components/AuthProvider";

export function Phase5Outreach({
  selected,
  sessionId,
  onPrev,
}: {
  selected: RankedLead | null;
  sessionId?: string | null;
  onPrev: () => void;
}) {
  const { getIdToken } = useAuth();
  const [channel, setChannel] = useState<OutreachChannel>("whatsapp");
  const [lang, setLang] = useState<OutreachLanguage>("hinglish");
  const [message, setMessage] = useState("");
  const [followUp, setFollowUp] = useState("");

  useEffect(() => {
    if (!selected) return;
    const m = buildOutreach(selected, channel, lang);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessage(m.first);
    setFollowUp(m.followUp);
  }, [selected, channel, lang]);

  useEffect(() => {
    if (!selected || !sessionId || !message) return;
    
    const timer = setTimeout(async () => {
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
            subject: channel === "email" ? (lang === "hinglish" ? "Aapke business ke liye ek website demo banayi hai" : "Built a website demo for your business") : undefined,
            body: message,
            followUp: followUp,
            status: "draft"
          })
        });
      } catch (err) {
        console.error("Failed to save outreach draft:", err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [sessionId, selected, channel, lang, message, followUp, getIdToken]);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  function openChannel() {
    if (!selected) return;
    if (channel === "whatsapp" && selected.whatsapp) {
      const num = selected.whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, "_blank");
    } else if (channel === "email" && selected.email) {
      const subject = lang === "hinglish" ? "Aapke business ke liye ek website demo banayi hai" : "Built a website demo for your business";
      window.open(`mailto:${selected.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, "_blank");
    } else if (channel === "instagram") {
      window.open(`https://instagram.com/`, "_blank");
    } else {
      toast.error("No contact for this channel");
    }
  }

  if (!selected) {
    return (
      <PhaseShell
        title="Phase 5 — Outreach"
        subtitle="Hinglish-first by default — converts 3x better in India. Built-in 5-day follow-up."
        onPrev={onPrev}
      >
        <IncompleteState
          title="No lead selected yet"
          description="Outreach drafts are tailored to a specific lead — picking up name, biggest gap, review count, and reachable channels. Run earlier phases and select a prospect to see WhatsApp, email, and Instagram drafts here."
          prevPhaseLabel="Rank"
          onPrev={onPrev}
        />
      </PhaseShell>
    );
  }

  const channels: { id: OutreachChannel; label: string; icon: typeof MessageCircle; enabled: boolean }[] = [
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, enabled: !!selected.whatsapp },
    { id: "email", label: "Email", icon: Mail, enabled: !!selected.email },
    { id: "instagram", label: "Instagram", icon: Camera, enabled: true },
  ];

  return (
    <PhaseShell title="Phase 5 — Outreach" subtitle="Hinglish-first by default — converts 3x better in India. Built-in 5-day follow-up." onPrev={onPrev}>
      <div className="flex flex-wrap items-center justify-between gap-6 mb-8 bg-card/65 backdrop-blur-sm border border-border/60 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground font-bold">Sending To</div>
          <div className="font-display text-2xl text-foreground font-medium mt-1">{selected.name}</div>
          <div className="text-xs text-muted-foreground mt-1 font-sans">{selected.phone}{selected.email ? ` · ${selected.email}` : ""}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-muted/50 border border-border/50 px-3.5 py-1.5 rounded-xl text-xs">
            <span className="text-muted-foreground font-medium">English</span>
            <Switch id="lang" checked={lang === "hinglish"} onCheckedChange={(c) => setLang(c ? "hinglish" : "english")} />
            <span className="text-foreground font-semibold">Hinglish</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {channels.map(({ id, label, icon: Icon, enabled }) => (
          <Button
            key={id}
            variant={channel === id ? "default" : "outline"}
            size="sm"
            disabled={!enabled}
            onClick={() => setChannel(id)}
            className="rounded-xl h-9 px-4 text-xs cursor-pointer"
          >
            <Icon className="h-3.5 w-3.5 mr-1.5" /> {label}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-border/80 bg-card/85 backdrop-blur-md shadow-premium">
          <CardHeader className="flex flex-row items-center justify-between pb-4 pt-5 px-5 gap-3">
            <CardTitle className="text-lg tracking-tight font-medium text-foreground">First Message</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => copy(message)} className="rounded-xl h-8 text-xs"><Copy className="h-3.5 w-3.5 mr-1" /> Copy</Button>
              <Button size="sm" onClick={openChannel} className="rounded-xl h-8 text-xs cursor-pointer"><ExternalLink className="h-3.5 w-3.5 mr-1" /> Send</Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="font-mono text-xs leading-relaxed min-h-[300px] rounded-xl border-border/60 focus-visible:ring-offset-1 p-3.5 bg-background/30"
            />
            <div className="mt-3.5 text-xs text-muted-foreground/80 flex items-center gap-1.5 font-sans">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Hook: personal · Pain: their biggest gap · Demo: live link · CTA: low-friction yes/no</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 bg-card/85 backdrop-blur-md shadow-premium">
          <CardHeader className="flex flex-row items-center justify-between pb-4 pt-5 px-5">
            <CardTitle className="text-lg tracking-tight font-medium text-foreground">Day-3 Follow-Up (Auto-Draft)</CardTitle>
            <Button size="sm" variant="outline" onClick={() => copy(followUp)} className="rounded-xl h-8 text-xs"><Copy className="h-3.5 w-3.5 mr-1" /> Copy Follow-Up</Button>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <Textarea
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="font-mono text-xs leading-relaxed min-h-[300px] rounded-xl border-border/60 focus-visible:ring-offset-1 p-3.5 bg-background/30"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 bg-emerald-500/5 border-emerald-500/20 rounded-2xl shadow-sm">
        <CardContent className="pt-5 pb-5 px-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 text-base font-bold shadow-sm">✓</div>
            <div>
              <div className="font-semibold text-foreground tracking-tight">Pipeline complete</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-sans">Lead successfully generated, audited, ranked, structured, and outreach drafted. Repeat for next prospect in Phase 3.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PhaseShell>
  );
}

function buildOutreach(l: RankedLead, channel: OutreachChannel, lang: OutreachLanguage): { first: string; followUp: string } {
  const ownerName = l.name.includes("Dr.") ? l.name.split(",")[0].replace(/['s].*/, "").trim() : "there";
  const niche = l.category.toLowerCase();
  const reviews = l.reviewsCount ?? 0;
  const rating = l.rating ?? 4.5;
  const demoUrl = `[your-demo-link]`;

  if (lang === "hinglish") {
    if (channel === "whatsapp") {
      return {
        first: `Hi ${ownerName} 👋

${l.city} mein ${niche} options dekh raha tha aur aapki ${l.name} sabse top ratings mein aayi — ${rating}★ aur ${reviews}+ reviews 🔥

Ek baat noticed ki: ${l.audit.biggestGap}

Iska ek solution banaya hai — aapke business ke liye ek FREE website demo bana di hai. WhatsApp booking, Google reviews, services, sab ready.

Live demo dekhiye (30 seconds):
${demoUrl}

Pasand aaye toh launch karwa denge. Nahi toh no problem — demo aapke paas free hi rahega.

Reply karein "YES" agar interested?`,
        followUp: `Hi ${ownerName}, kal jo demo bheja tha — dekha aapne?

Quick recap: ${l.audit.biggestGap.split(".")[0]}.

Iska monthly impact roughly ₹${l.audit.estLostRevenuePerMonth.toLocaleString("en-IN")} hai (Google search volume ke basis pe).

Demo abhi bhi live hai:
${demoUrl}

5 minute call kar sakte hain to walk through? Bas batao kab free ho.`,
      };
    }
    if (channel === "email") {
      return {
        first: `Subject: Aapki ${l.name} ke liye ek website demo (free, 30 sec dekhiye)

Hi ${ownerName},

${l.city} mein ${niche} services research kar raha tha. ${l.name} top results mein aayi — ${rating}★, ${reviews}+ reviews.

Lekin ek gap noticed kiya: ${l.audit.biggestGap}

Aapke business ke liye ek live website demo banayi hai. Saari information already filled in — services, location, WhatsApp booking, Google reviews integration.

Demo: ${demoUrl}

30 seconds lagega dekhne mein. Pasand aaye toh launch karwa denge — full price ₹15,000 (one-time), zero monthly fees.

Reply with "YES" agar interested ho, ya "NO" agar relevant nahi — dono works.

Best,
[Your Name]`,
        followUp: `Subject: Re: ${l.name} website demo

Hi ${ownerName},

Pichli email pe quick check-in. Demo abhi bhi live hai: ${demoUrl}

Conservative estimate: ${l.audit.biggestGap.split(".")[0].toLowerCase()} costs around ₹${l.audit.estLostRevenuePerMonth.toLocaleString("en-IN")}/month in missed bookings.

Worth a 5-min call?

Best,
[Your Name]`,
      };
    }
    return {
      first: `Hi! 🙏 ${l.name} ke liye ek website demo banayi hai — ${l.audit.biggestGap} solve karne ke liye. ${demoUrl} pe live preview. Pasand aaye toh DM!`,
      followUp: `Hey, kal jo website demo bheja tha — koi feedback? Demo: ${demoUrl} | 5 min call set kar sakte hain?`,
    };
  }

  // English
  if (channel === "whatsapp") {
    return {
      first: `Hi ${ownerName} 👋

Was researching ${niche} businesses in ${l.city} and ${l.name} stood out — ${rating}★ with ${reviews}+ Google reviews.

Spotted one gap though: ${l.audit.biggestGap}

So I built you a free website demo with WhatsApp booking, Google reviews integration, and services. All pre-filled with your info.

30-second preview: ${demoUrl}

If you like it, we launch it. If not, the demo is yours to keep — free.

Reply "YES" if interested?`,
      followUp: `Hi ${ownerName}, following up on the demo from a couple of days ago: ${demoUrl}

The biggest gap I shared (${l.audit.biggestGap.split(".")[0]}) is costing roughly ₹${l.audit.estLostRevenuePerMonth.toLocaleString("en-IN")}/month in missed bookings.

Worth a quick 5-min call to walk through?`,
    };
  }
  if (channel === "email") {
    return {
      first: `Subject: Built ${l.name} a website demo — 30 sec preview

Hi ${ownerName},

I was researching ${niche} businesses in ${l.city}. ${l.name} stood out (${rating}★, ${reviews}+ reviews).

But I noticed: ${l.audit.biggestGap}

So I built a free demo website for your business, pre-filled with services, location, WhatsApp booking, and Google reviews.

Demo: ${demoUrl}

If you like it, launch is ₹15,000 one-time, zero monthly. If not, demo is yours.

Reply "YES" or "NO" — both work.

Best,
[Your Name]`,
      followUp: `Subject: Re: ${l.name} website demo

Hi ${ownerName},

Quick check-in. Demo still live: ${demoUrl}

Conservative estimate: the gap above costs around ₹${l.audit.estLostRevenuePerMonth.toLocaleString("en-IN")}/month.

5-min call?

Best,
[Your Name]`,
    };
  }
  return {
    first: `Hey! Built a website demo for ${l.name} to fix one gap (${l.audit.biggestGap.split(".")[0]}). Preview: ${demoUrl}. DM if interested!`,
    followUp: `Hi! Following up on the demo: ${demoUrl}. 5-min call?`,
  };
}
