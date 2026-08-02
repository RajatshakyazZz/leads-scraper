"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhaseShell } from "./PhaseShell";
import { IncompleteState } from "./IncompleteState";
import { Check, Copy, ExternalLink, Save, Sparkles, Loader2 } from "lucide-react";
import type { RankedLead } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

const PLATFORMS = [
  { id: "lovable", label: "Lovable", url: "https://lovable.dev" },
  { id: "claude-code", label: "Claude Code", url: "https://claude.com/claude-code" },
  { id: "bolt", label: "Bolt.new", url: "https://bolt.new" },
  { id: "codex", label: "Codex", url: "https://chat.openai.com" },
];

export function Phase4Build({
  selected,
  sessionId,
  onNext,
  onPrev,
}: {
  selected: RankedLead | null;
  sessionId?: string | null;
  onNext: () => void;
  onPrev: () => void;
}) {
  const { getIdToken } = useAuth();
  const [platform, setPlatform] = useState("lovable");
  const [building, setBuilding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState("");
  const prompt = useMemo(() => (selected ? buildPrompt(selected, platform) : ""), [selected, platform]);

  function copyPrompt() {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied. Paste into " + PLATFORMS.find((p) => p.id === platform)?.label);
  }

  async function savePrompt() {
    if (!selected || !prompt) return;

    setSaving(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ lead: selected, platform, prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to save prompt.");

      if (sessionId) {
        try {
          await fetch(`/api/sessions/${sessionId}/builds`, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
            body: JSON.stringify({
              leadId: selected.id,
              leadName: selected.name,
              platform,
              prompt,
              version: 1
            }),
          });
        } catch (err) {
          console.error("Failed to save build to session:", err);
        }
      }

      setSavedKey(`${selected.id}:${platform}`);
      toast.success("Prompt saved to this lead");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function openPlatform() {
    const url = PLATFORMS.find((p) => p.id === platform)?.url;
    if (url) window.open(url, "_blank");
  }

  function simulateBuild() {
    setBuilding(true);
    setTimeout(() => {
      setBuilding(false);
      toast.success("Demo site ready. Preview loaded.");
    }, 1800);
  }

  if (!selected) {
    return (
      <PhaseShell
        title="Phase 4 — Generate website"
        subtitle="Pick a platform. We craft a battle-tested prompt with brand, structure, sections, and SEO baked in."
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled
        nextLabel="Draft outreach"
      >
        <IncompleteState
          title="No lead selected yet"
          description="Run scrape and audit, then pick the highest-scoring prospect in Phase 3. We'll generate a complete website prompt (Lovable / Bolt / Claude Code / Codex) plus a live preview here."
          actionLabel="Go to Rank"
          onAction={onPrev}
        />

      </PhaseShell>
    );
  }

  return (
    <PhaseShell
      title="Phase 4 — Generate website"
      subtitle={`Pick a platform. We craft a battle-tested prompt with brand, structure, sections, and SEO baked in.`}
      onPrev={onPrev}
      onNext={onNext}
      nextLabel="Draft outreach"
    >
      <div className="flex items-center justify-between mb-6 gap-6 flex-wrap bg-white border border-border rounded-xl p-5 shadow-premium">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">Selected Prospect</div>
          <div className="font-sans font-bold text-xl text-foreground mt-0.5">{selected.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5 font-sans">{selected.address}</div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
            <SelectTrigger className="w-[140px] rounded-lg border-border bg-white text-xs h-8"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-lg border-border shadow-premium bg-white">
              {PLATFORMS.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs rounded-md">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={openPlatform} className="rounded-lg h-8 text-xs font-medium"><ExternalLink className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> Open</Button>
          <Button variant="outline" size="sm" onClick={savePrompt} disabled={saving || savedKey === `${selected.id}:${platform}`} className="rounded-lg h-8 text-xs font-medium">
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : savedKey === `${selected.id}:${platform}` ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Save className="h-3.5 w-3.5 mr-1 text-muted-foreground" />}
            {savedKey === `${selected.id}:${platform}` ? "Saved" : "Save"}
          </Button>
          <Button size="sm" onClick={copyPrompt} className="rounded-lg h-8 px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-xs cursor-pointer"><Copy className="h-3.5 w-3.5 mr-1" /> Copy Prompt</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-base tracking-tight font-bold text-slate-900">Generated Prompt</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono bg-slate-900 text-slate-100 rounded-xl p-4 max-h-[520px] overflow-y-auto border border-slate-800 shadow-inner scrollbar-thin">
              {prompt}
            </pre>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5 gap-3 border-b border-sky-100">
            <CardTitle className="text-base tracking-tight font-bold text-slate-900">Live Preview</CardTitle>
            <Button size="sm" variant="outline" onClick={simulateBuild} disabled={building} className="rounded-xl h-8.5 px-3.5 border-sky-200 text-sky-700 text-xs font-semibold hover:bg-sky-50 cursor-pointer">
              {building ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Building</> : <><Sparkles className="h-3.5 w-3.5 mr-1 text-sky-600" /> Build Site</>}
            </Button>
          </CardHeader>
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-rose-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 max-w-md mx-auto bg-white rounded-lg px-3 py-1 text-[11px] font-mono text-slate-500 text-center border border-slate-200 truncate">
              https://preview.{selected.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com
            </div>
          </div>
          <CardContent className="p-8 text-center bg-slate-50/50">
            <div className="max-w-md mx-auto space-y-4">
              <h3 className="text-xl font-bold text-slate-900">{selected.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Premium landing page architecture designed for high conversion. Custom appointment booking flow, patient testimonials, and localized SEO schema included.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Button className="h-9 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/20">
                  Book Appointment
                </Button>
                <Button variant="outline" className="h-9 px-5 rounded-xl border-sky-200 text-sky-700 text-xs font-semibold hover:bg-sky-50">
                  View Services
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PhaseShell>
  );
}


function buildPrompt(l: RankedLead, platform: string): string {
  const name = l.name;
  const niche = l.category;
  const phone = l.phone ?? "+91 XXXXX XXXXX";
  const whatsapp = l.whatsapp ?? phone;
  const addr = l.address;
  const rating = l.rating ?? 4.5;
  const reviews = l.reviewsCount ?? 0;
  const gap = l.audit.biggestGap;

  return `You are building a high-converting local-business website for an Indian ${niche}.

# BUSINESS
Name: ${name}
Category: ${niche}
Address: ${addr}
Phone: ${phone}
WhatsApp: ${whatsapp}
Google rating: ${rating}★ (${reviews} reviews)
Biggest current gap: ${gap}

# DESIGN
- Mobile-first (90% of Indian traffic is mobile). Hero CTA visible above fold on 375px width.
- Premium local-business aesthetic suited to a ${niche}. Off-white base + one deep accent colour. Generous whitespace.
- Inter or DM Sans font. Large H1 (48-64px desktop, 32px mobile).
- Trust signals everywhere: ratings, reviews, "years in practice", credentials.
- Floating WhatsApp button (bottom-right) on every page. Click → wa.me/${whatsapp.replace(/\D/g, "")}
- Click-to-call phone in header. tel:${phone.replace(/\s/g, "")}

# SECTIONS (in order)
1. Hero: Business name + 1-line promise + "Book on WhatsApp" CTA + rating badge
2. Trust strip: "${rating}★ on Google · ${reviews}+ reviews · ${l.yearsInBusiness ?? 8}+ years in ${l.city.split(",")[0]}"
3. Services grid: 6 cards with icons — pick the 6 most-searched services for a ${niche} in India
4. About + owner bio: 2-col, photo placeholder + credentials + years
5. Gallery/portfolio placeholder (3x2 grid, "Coming soon" overlay)
6. Reviews carousel: pull 6 review snippets (use Lorem placeholder, mark for replacement)
7. FAQ accordion: 5 questions a first-time ${niche} customer in India actually asks (pricing, timings, first visit, payments)
8. Location: Google Maps embed of ${addr} + business hours table + directions CTA
9. Footer: WhatsApp + Phone + Address + Hours + social icons (Instagram, Google)

# SEO & TECHNICAL
- HTML lang="en-IN"
- Meta: "${name} | ${niche} in ${l.city} | Book on WhatsApp"
- LocalBusiness schema markup (pick the closest @type for a ${niche}) in JSON-LD: name, address, geo, telephone, openingHours, aggregateRating
- All images <img loading="lazy" alt="...">
- Lighthouse mobile 90+: minify, no blocking JS, preload hero image
- HTTPS, semantic HTML, accessible color contrast

# COPY TONE
Warm, calm, confident. Hindi/Hinglish allowed for trust phrases ("zaroorat padne pe call kariye"). Avoid jargon. Address common customer hesitations (cost, quality, trust) directly.

# CTA HIERARCHY
Primary: WhatsApp book. Secondary: Call. Tertiary: Google Maps directions.

${
  platform === "lovable" || platform === "bolt"
    ? `OUTPUT: Single React + Tailwind page. No backend. Use placeholder images from unsplash.com (search: ${niche.toLowerCase()}, indian local business).`
    : platform === "claude-code"
      ? "OUTPUT: Next.js 15 app with app router, Tailwind, shadcn. Single landing page route. Include Suspense boundaries."
      : "OUTPUT: Static HTML + Tailwind CDN. Single index.html, self-contained."
}

Generate now. Then list 3 sentences I can use to show the owner why this beats their current ${l.audit.hasWebsite ? "outdated site" : "Google listing only"}.`;
}

function demoSiteHtml(l: RankedLead): string {
  const wa = (l.whatsapp ?? l.phone ?? "919999999999").replace(/\D/g, "");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${l.name}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>body{font-family:ui-serif,Georgia,'Times New Roman',serif;background:#f5efe6;color:#2c2620}h1,h2,.sans{font-family:ui-sans-serif,system-ui,sans-serif}</style>
</head><body>
<header class="border-b border-stone-200 bg-[#faf6ee]"><div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between"><div class="font-medium tracking-tight text-stone-800">${l.name}</div><a href="tel:${(l.phone ?? "").replace(/\s/g, "")}" class="text-sm text-stone-600 sans">${l.phone ?? ""}</a></div></header>
<section><div class="max-w-5xl mx-auto px-6 py-20 sm:py-28"><div class="text-[11px] uppercase tracking-[0.2em] text-stone-500 sans">${l.category} · ${l.city}</div><h1 class="text-4xl sm:text-6xl font-medium mt-4 leading-[1.05] tracking-tight text-stone-900">A name ${l.city.split(",")[0]}<br/>has trusted for years.<br/><span class="italic text-stone-500">Now online.</span></h1><p class="mt-6 text-lg text-stone-600 max-w-xl leading-relaxed">${l.rating} on Google · ${l.reviewsCount} reviews. Book in under a minute on WhatsApp — no calls, no waiting.</p><div class="mt-8 flex gap-3 sans"><a href="https://wa.me/${wa}" class="bg-stone-900 text-stone-50 font-medium px-7 py-3.5 rounded-full text-sm tracking-wide hover:bg-stone-700 transition">Book on WhatsApp →</a><a href="tel:${(l.phone ?? "").replace(/\s/g, "")}" class="border border-stone-300 text-stone-700 px-7 py-3.5 rounded-full text-sm tracking-wide">Call us</a></div></div></section>
<section class="bg-[#ede4d3] border-y border-stone-200"><div class="max-w-5xl mx-auto px-6 py-14 grid sm:grid-cols-3 gap-8 text-center"><div><div class="text-4xl font-medium tracking-tight text-stone-900">${l.reviewsCount}+</div><div class="text-[11px] uppercase tracking-[0.2em] text-stone-500 mt-2 sans">Happy customers</div></div><div><div class="text-4xl font-medium tracking-tight text-stone-900">${l.rating}</div><div class="text-[11px] uppercase tracking-[0.2em] text-stone-500 mt-2 sans">Google rating</div></div><div><div class="text-4xl font-medium tracking-tight text-stone-900">${l.yearsInBusiness ?? 8}+</div><div class="text-[11px] uppercase tracking-[0.2em] text-stone-500 mt-2 sans">Years in ${l.city.split(",")[0]}</div></div></div></section>
<section class="max-w-5xl mx-auto px-6 py-16"><div class="text-[11px] uppercase tracking-[0.2em] text-stone-500 sans">Services</div><h2 class="text-3xl font-medium tracking-tight text-stone-900 mt-2">What we do well.</h2><div class="grid sm:grid-cols-3 gap-px bg-stone-200 mt-8 border border-stone-200">${["Service one","Service two","Service three","Service four","Service five","Service six"].map((s)=>`<div class="bg-[#faf6ee] p-6"><div class="font-medium tracking-tight text-stone-900">${s}</div><div class="text-xs text-stone-500 mt-1.5 sans">Reliable · modern · affordable</div></div>`).join("")}</div></section>
<section class="max-w-5xl mx-auto px-6 py-16 border-t border-stone-200"><div class="text-[11px] uppercase tracking-[0.2em] text-stone-500 sans">Visit us</div><h2 class="text-3xl font-medium tracking-tight text-stone-900 mt-2">${l.address}</h2><div class="mt-6 rounded-lg overflow-hidden bg-stone-200/60 border border-stone-300 h-64 flex items-center justify-center text-stone-500 sans text-sm">[Google Maps embed]</div></section>
<a href="https://wa.me/${wa}" class="fixed bottom-6 right-6 bg-stone-900 text-stone-50 rounded-full w-14 h-14 flex items-center justify-center text-xl shadow-md">○</a>
<footer class="bg-[#ede4d3] border-t border-stone-200 sans"><div class="max-w-5xl mx-auto px-6 py-8 text-xs text-stone-500 flex justify-between"><span>© ${l.name}</span><span>${l.address}</span></div></footer>
</body></html>`;
}
