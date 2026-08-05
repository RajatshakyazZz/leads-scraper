"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhaseShell } from "./PhaseShell";
import { IncompleteState } from "./IncompleteState";
import {
  Check,
  Copy,
  ExternalLink,
  Save,
  Sparkles,
  Loader2,
  Stethoscope,
  Utensils,
  Building2,
  Scissors,
  Dumbbell,
  Scale,
  Star,
  Phone,
  MessageSquare,
  CheckCircle2,
  MapPin,
  Clock,
  Smartphone,
  Monitor,
  Maximize2,
  X,
  ShieldCheck,
  ArrowRight,
  BadgePercent,
  Sparkle
} from "lucide-react";
import type { RankedLead } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";

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
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewTab, setPreviewTab] = useState<"hero" | "services" | "reviews" | "contact">("hero");
  const [fullModal, setFullModal] = useState(false);

  const nichePreset = useMemo(() => (selected ? getNichePreset(selected.category, selected.name) : null), [selected]);
  const prompt = useMemo(() => (selected && nichePreset ? buildPrompt(selected, platform, nichePreset) : ""), [selected, platform, nichePreset]);

  function copyPrompt() {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied! Paste into " + PLATFORMS.find((p) => p.id === platform)?.label);
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
      toast.success("Prompt saved for " + selected.name);
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
      toast.success(`High-converting preview generated for ${selected?.name}!`);
    }, 1500);
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

  const cleanPhone = (selected.phone ?? "").replace(/\s/g, "");
  const waNumber = (selected.whatsapp ?? selected.phone ?? "919999999999").replace(/\D/g, "");

  return (
    <PhaseShell
      title="Phase 4 — Generate website"
      subtitle="Pick a platform. We craft a battle-tested, niche-tailored prompt with business details, conversion sections, and localized SEO baked in."
      onPrev={onPrev}
      onNext={onNext}
      nextLabel="Draft outreach"
    >
      {/* Selected Prospect Header Card */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap bg-white border border-sky-100 rounded-2xl p-5 shadow-lg shadow-sky-500/5">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 font-bold shrink-0">
            {nichePreset?.icon ? <nichePreset.icon className="h-5 w-5 text-sky-600" /> : <Sparkles className="h-5 w-5 text-sky-600" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-sans font-bold text-xl text-slate-900">{selected.name}</div>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                {nichePreset?.nicheCategory ?? selected.category}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-sans flex items-center gap-2">
              <span>{selected.address}</span>
              <span>•</span>
              <span className="text-sky-700 font-semibold">{selected.rating ?? 4.5}★ ({selected.reviewsCount ?? 0} reviews)</span>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
            <SelectTrigger className="w-[130px] rounded-xl border-sky-200 bg-white text-xs h-9 font-medium focus:ring-1 focus:ring-sky-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-sky-100 shadow-xl bg-white">
              {PLATFORMS.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs rounded-lg font-medium">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={openPlatform} className="rounded-xl h-9 px-3 border-sky-200 text-slate-700 text-xs font-semibold hover:bg-sky-50">
            <ExternalLink className="h-3.5 w-3.5 mr-1 text-slate-400" /> Open
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={savePrompt}
            disabled={saving || savedKey === `${selected.id}:${platform}`}
            className="rounded-xl h-9 px-3 border-sky-200 text-slate-700 text-xs font-semibold hover:bg-sky-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : savedKey === `${selected.id}:${platform}` ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Save className="h-3.5 w-3.5 mr-1 text-slate-400" />}
            {savedKey === `${selected.id}:${platform}` ? "Saved" : "Save Prompt"}
          </Button>

          <Button size="sm" onClick={copyPrompt} className="rounded-xl h-9 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-md shadow-sky-600/20 cursor-pointer">
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Prompt
          </Button>
        </div>
      </div>

      {/* Main Grid: Prompt Code vs Live Preview */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Card: Tailored Niche Prompt */}
        <Card className="rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5 flex flex-col h-[660px]">
          <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between border-b border-sky-100">
            <div>
              <CardTitle className="text-base tracking-tight font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-600" />
                Tailored AI Prompt ({PLATFORMS.find((p) => p.id === platform)?.label})
              </CardTitle>
              <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                Niche: <span className="font-semibold text-slate-700">{nichePreset?.nicheCategory}</span> • {selected.city}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={copyPrompt} className="h-7 px-2 text-xs text-sky-600 hover:bg-sky-50 rounded-lg">
              <Copy className="h-3 w-3 mr-1" /> Copy
            </Button>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-hidden">
            <pre className="text-[11.5px] leading-relaxed whitespace-pre-wrap font-mono bg-slate-950 text-slate-200 rounded-xl p-4 h-full overflow-y-auto border border-slate-800 shadow-inner scrollbar-thin">
              {prompt}
            </pre>
          </CardContent>
        </Card>

        {/* Right Card: High Quality Interactive Preview */}
        <Card className="rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5 overflow-hidden flex flex-col h-[660px]">
          {/* Preview Toolbar Header */}
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 gap-3 border-b border-sky-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base tracking-tight font-bold text-slate-900">Live Website Preview</CardTitle>
              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                ● High Conversion
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Viewport Mode Switcher */}
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg mr-1">
                <button
                  onClick={() => setViewMode("desktop")}
                  className={`p-1 rounded-md text-xs transition-all ${viewMode === "desktop" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  title="Desktop View"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("mobile")}
                  className={`p-1 rounded-md text-xs transition-all ${viewMode === "mobile" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  title="Mobile View (375px)"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setFullModal(true)}
                className="rounded-xl h-8 px-2.5 border-sky-200 text-sky-700 text-xs font-semibold hover:bg-sky-50"
                title="Full Screen Preview"
              >
                <Maximize2 className="h-3.5 w-3.5 mr-1" /> Expand
              </Button>

              <Button
                size="sm"
                onClick={simulateBuild}
                disabled={building}
                className="rounded-xl h-8 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                {building ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1 text-sky-200" />}
                {building ? "Building..." : "Refresh"}
              </Button>
            </div>
          </CardHeader>

          {/* Browser Address Bar Chrome */}
          <div className="bg-slate-900 px-4 py-2 flex items-center justify-between gap-3 text-white border-b border-slate-800 shrink-0">
            <div className="flex gap-1.5 items-center">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex-1 max-w-sm mx-auto bg-slate-800/90 rounded-md px-3 py-0.5 text-[11px] font-mono text-sky-300/90 text-center border border-slate-700 truncate flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>https://preview.{selected.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">{viewMode === "mobile" ? "375px" : "100%"}</div>
          </div>

          {/* Preview Navigation Bar */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex items-center gap-2 overflow-x-auto shrink-0">
            <button
              onClick={() => setPreviewTab("hero")}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${previewTab === "hero" ? "bg-white text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Hero & CTAs
            </button>
            <button
              onClick={() => setPreviewTab("services")}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${previewTab === "services" ? "bg-white text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Services ({nichePreset?.services.length})
            </button>
            <button
              onClick={() => setPreviewTab("reviews")}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${previewTab === "reviews" ? "bg-white text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Reviews ({selected.reviewsCount ?? 334})
            </button>
            <button
              onClick={() => setPreviewTab("contact")}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${previewTab === "contact" ? "bg-white text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Location & Contact
            </button>
          </div>

          {/* Render Interactive Preview Screen */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-100/60 relative scrollbar-thin">
            <div
              className={`transition-all duration-300 ${
                viewMode === "mobile"
                  ? "max-w-[375px] mx-auto bg-white rounded-3xl border-4 border-slate-900 shadow-2xl overflow-hidden min-h-[500px]"
                  : "w-full bg-white rounded-xl border border-slate-200 shadow-sm"
              }`}
            >
              {renderLiveMockup(selected, nichePreset, previewTab, waNumber, cleanPhone)}
            </div>
          </div>
        </Card>
      </div>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {fullModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-sky-200"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold">
                    {nichePreset?.icon ? <nichePreset.icon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{selected.name} — Live Site Preview</h3>
                    <p className="text-[11px] text-sky-400 font-mono">https://preview.{selected.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => window.open(`https://wa.me/${waNumber}?text=Hi%20${encodeURIComponent(selected.name)}`, "_blank")} className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                    <MessageSquare className="h-3.5 w-3.5 mr-1" /> Test WhatsApp CTA
                  </Button>
                  <button onClick={() => setFullModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                <div className="max-w-4xl mx-auto space-y-6">
                  {renderLiveMockup(selected, nichePreset, "hero", waNumber, cleanPhone)}
                  {renderLiveMockup(selected, nichePreset, "services", waNumber, cleanPhone)}
                  {renderLiveMockup(selected, nichePreset, "reviews", waNumber, cleanPhone)}
                  {renderLiveMockup(selected, nichePreset, "contact", waNumber, cleanPhone)}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PhaseShell>
  );
}

/* ============================================================================
   LIVE MOCKUP RENDERER ENGINE
   ============================================================================ */
function renderLiveMockup(
  lead: RankedLead,
  preset: ReturnType<typeof getNichePreset> | null,
  tab: "hero" | "services" | "reviews" | "contact",
  waNumber: string,
  cleanPhone: string
) {
  if (!preset) return null;
  const IconComp = preset.icon;

  return (
    <div className="font-sans text-slate-900 p-5 space-y-6">
      {/* Site Top Banner Header */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-xl ${preset.colorTheme.iconBg} flex items-center justify-center ${preset.colorTheme.iconColor} font-bold shadow-xs`}>
            <IconComp className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-slate-900">{lead.name}</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{preset.nicheCategory} • {lead.city}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Open Today
          </span>
          <a
            href={`tel:${cleanPhone}`}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-900 text-white px-3 py-1 text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <Phone className="h-3 w-3 text-sky-400" /> Call
          </a>
        </div>
      </header>

      {/* TAB 1: HERO & OVERVIEW */}
      {(tab === "hero") && (
        <div className="space-y-5">
          {/* Hero Banner Box */}
          <div className={`rounded-2xl p-6 ${preset.colorTheme.heroBg} border border-sky-100 text-left relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

            {/* Rating pill */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-slate-800 shadow-2xs border border-sky-100 mb-3">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{lead.rating ?? 4.8}★ Google Rated</span>
              <span className="text-slate-400">({lead.reviewsCount ?? 334}+ reviews)</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {preset.heroTitle}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mt-2 max-w-lg font-sans">
              {preset.heroSub}
            </p>

            {/* CTAs */}
            <div className="mt-5 flex flex-wrap gap-2.5 items-center">
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I would like to book an appointment.`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {preset.ctaPrimary}
              </a>
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-4 py-2.5 border border-slate-200 shadow-2xs transition-all"
              >
                <Phone className="h-3.5 w-3.5 text-sky-600" />
                {preset.ctaSecondary}
              </a>
            </div>
          </div>

          {/* Trust Badges Strip */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {preset.trustBadges.map((badge, idx) => (
              <div key={idx} className="bg-white border border-sky-100 rounded-xl p-2.5 shadow-2xs flex flex-col items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-sky-600 mb-1" />
                <span className="text-[10.5px] font-bold text-slate-800 leading-tight">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: NICHE SERVICES GRID */}
      {(tab === "services") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkle className="h-4 w-4 text-sky-600" /> Key Niche Specialties & Services
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">{preset.services.length} Premium Services</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {preset.services.map((srv, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-sky-100 bg-white hover:border-sky-300 transition-all shadow-2xs group">
                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-600 font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-sky-700 transition-colors">{srv.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">{srv.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER REVIEWS */}
      {(tab === "reviews") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Patient & Customer Reviews
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">Google Verified</span>
          </div>

          <div className="space-y-2.5">
            {preset.reviews.map((rev, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-sky-100 bg-white shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-sky-100 text-sky-700 font-bold text-[10px] flex items-center justify-center uppercase">
                      {rev.author[0]}
                    </div>
                    <span className="font-bold text-xs text-slate-900">{rev.author}</span>
                  </div>
                  <div className="flex gap-0.5 text-amber-400 text-xs">
                    {"★".repeat(rev.rating)}
                  </div>
                </div>
                <p className="text-[11.5px] text-slate-600 italic font-sans leading-relaxed">"{rev.text}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LOCATION & CONTACT */}
      {(tab === "contact") && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-sky-600" /> Location & Contact Info
          </h3>

          <div className="p-4 rounded-xl border border-sky-100 bg-white shadow-2xs space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-slate-700">
              <MapPin className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900">{lead.name}</div>
                <div>{lead.address}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <Phone className="h-4 w-4 text-sky-600 shrink-0" />
              <a href={`tel:${cleanPhone}`} className="font-bold text-sky-700 hover:underline">{lead.phone || "+91 98986 66601"}</a>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <Clock className="h-4 w-4 text-sky-600 shrink-0" />
              <span>Monday – Saturday: 09:30 AM – 08:30 PM (Sun by Appointment)</span>
            </div>

            <div className="h-28 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-xs text-sky-700 font-semibold gap-1.5">
              <MapPin className="h-4 w-4 text-sky-600" />
              <span>[Interactive Google Maps Embed Preview]</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Action Button inside preview frame */}
      <div className="pt-2 flex justify-end">
        <a
          href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I found your business on Google.`)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-3.5 py-2 text-xs font-bold shadow-lg hover:bg-emerald-700 transition-all"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Chat on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}

/* ============================================================================
   NICHE PRESET DETECTION ENGINE
   ============================================================================ */
function getNichePreset(category: string, name: string) {
  const cat = `${category} ${name}`.toLowerCase();

  // 1. Dental Clinic / Dentist
  if (cat.includes("dent") || cat.includes("teeth") || cat.includes("orthodont")) {
    return {
      nicheCategory: "Dental Clinic",
      icon: Stethoscope,
      heroTitle: "Pain-Free Dental Care & Celebrity Smile Designs",
      heroSub: "Advanced laser dentistry, painless root canals, and invisible aligners. Trusted by over 5,000+ happy patients in your city.",
      trustBadges: ["Google 4.8★ Verified", "Certified Orthodontist", "0% EMI Available"],
      colorTheme: {
        heroBg: "bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50",
        iconBg: "bg-sky-100",
        iconColor: "text-sky-700"
      },
      ctaPrimary: "Book WhatsApp Appointment",
      ctaSecondary: "Call Dentist Direct",
      schemaType: "Dentist",
      services: [
        { title: "Painless Root Canal (Single Sitting)", desc: "Rotary endodontics with zero pain and instant relief." },
        { title: "Laser Teeth Whitening (Shade 3+ Cleaner)", desc: "Professional 45-min laser bleaching for bright smiles." },
        { title: "Clear Invisible Aligners & Braces", desc: "Custom computer-designed clear aligners for adults & kids." },
        { title: "Titanium Dental Implants", desc: "Permanent tooth replacement with lifetime warranty options." },
        { title: "Cosmetic Veneers & Smile Makeover", desc: "Porcelain veneers for perfectly shaped white teeth." },
        { title: "Pediatric & Family Dental Checkup", desc: "Gentle, stress-free dental care for children and seniors." }
      ],
      reviews: [
        { author: "Dr. Ananya Sharma", rating: 5, text: "Got my aligners done here. Super smooth process with zero discomfort. Highly recommend!" },
        { author: "Vikram Mehta", rating: 5, text: "Extremely clean clinic and doctor explains every procedure calmly. Painless root canal done." }
      ]
    };
  }

  // 2. Doctor / General Medical Clinic / Hospital
  if (cat.includes("doct") || cat.includes("clinic") || cat.includes("hospit") || cat.includes("health") || cat.includes("physician") || cat.includes("dermat") || cat.includes("eye")) {
    return {
      nicheCategory: "Medical Clinic",
      icon: Stethoscope,
      heroTitle: "Expert Compassionate Medical Consultation & Care",
      heroSub: "Comprehensive health checkups, specialist consultation, and diagnostic care with zero OPD waiting time.",
      trustBadges: ["NABH Accredited Clinic", "15+ Years Practice", "Same-Day Appointment"],
      colorTheme: {
        heroBg: "bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50",
        iconBg: "bg-teal-100",
        iconColor: "text-teal-700"
      },
      ctaPrimary: "Book Doctor Appointment",
      ctaSecondary: "Emergency Call",
      schemaType: "MedicalClinic",
      services: [
        { title: "Specialist OPD Consultation", desc: "Expert diagnosis and personalized treatment plans." },
        { title: "Complete Health Package & Diagnostics", desc: "Comprehensive blood tests, ECG, and preventive care." },
        { title: "Chronic Disease Management", desc: "Long-term care for Diabetes, BP, Thyroid & Cholesterol." },
        { title: "Pediatric & Vaccination Desk", desc: "Child immunizations, growth tracking, and wellness." },
        { title: "Skin & Dermatology Care", desc: "Acne, eczema, laser skin care, and allergy tests." },
        { title: "Home Visit & Teleconsultation", desc: "Video consultation and doctor home visits for seniors." }
      ],
      reviews: [
        { author: "Rajesh Kumar", rating: 5, text: "Doctor gave genuine advice without prescribing unnecessary tests. Very polite staff." },
        { author: "Pooja Malhotra", rating: 5, text: "WhatsApp booking saved us 2 hours in waiting room. Very efficient system!" }
      ]
    };
  }

  // 3. Restaurant / Cafe / Dining
  if (cat.includes("restau") || cat.includes("cafe") || cat.includes("food") || cat.includes("dini") || cat.includes("pizz") || cat.includes("baker") || cat.includes("biryan")) {
    return {
      nicheCategory: "Restaurant & Cafe",
      icon: Utensils,
      heroTitle: "Authentic Flavors, Chef Specials & Festive Dining",
      heroSub: "Enjoy hand-crafted delicacies made with fresh ingredients. Reserve your table or order express delivery via WhatsApp.",
      trustBadges: ["FSSAI Certified 5★", "Fresh Daily Produce", "Express WhatsApp Order"],
      colorTheme: {
        heroBg: "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-700"
      },
      ctaPrimary: "Reserve Table / Order",
      ctaSecondary: "View Digital Menu",
      schemaType: "Restaurant",
      services: [
        { title: "Signature Chef Delicacies", desc: "Curated gourmet appetizers, authentic gravies & breads." },
        { title: "Instant Table Reservation", desc: "Skip the queue! Book your favorite table online in 30 seconds." },
        { title: "Express WhatsApp Delivery", desc: "Hot food delivered directly to your doorstep in 30 mins." },
        { title: "Artisan Coffee & Mocktails", desc: "Freshly brewed espresso and handcrafted refreshing coolers." },
        { title: "Private Party & Birthday Catering", desc: "Custom buffet menus for corporate events and family gatherings." },
        { title: "Weekend Brunch Buffets", desc: "Unlimited multi-cuisine brunch spreads every Saturday & Sunday." }
      ],
      reviews: [
        { author: "Amit Singhania", rating: 5, text: "Phenomenal taste and hospitality! The chef specials are a must-try. Table booking was seamless." },
        { author: "Neha Roy", rating: 5, text: "Loved the ambiance and quick service. Ordered home delivery on WhatsApp and arrived hot!" }
      ]
    };
  }

  // 4. Real Estate / Property Dealer / Realtor
  if (cat.includes("prop") || cat.includes("real") || cat.includes("estate") || cat.includes("broker") || cat.includes("realt") || cat.includes("flat") || cat.includes("plot") || cat.includes("house")) {
    return {
      nicheCategory: "Real Estate Brokerage",
      icon: Building2,
      heroTitle: "Find Premium Verified Properties & Smart Investments",
      heroSub: "Buy, sell, or rent luxury apartments, villas, and commercial spaces with 100% verified documentation and zero hidden brokerage.",
      trustBadges: ["RERA Approved Advisor", "100% Verified Legal Titles", "0% Extra Hidden Fee"],
      colorTheme: {
        heroBg: "bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-50",
        iconBg: "bg-sky-100",
        iconColor: "text-sky-800"
      },
      ctaPrimary: "Schedule Site Visit",
      ctaSecondary: "WhatsApp Property Catalog",
      schemaType: "RealEstateAgent",
      services: [
        { title: "Luxury Residential Apartments & Villas", desc: "2, 3 & 4 BHK ready-to-move and under-construction flats." },
        { title: "Commercial Office & Retail Spaces", desc: "High ROI commercial shops, showrooms, and tech park offices." },
        { title: "Verified Gated Land & Plots", desc: "Clear title residential plots with immediate registry & handover." },
        { title: "Property Valuation & Legal Registry", desc: "End-to-end stamp duty, agreement drafting, and legal support." },
        { title: "Home Loan & EMI Assistance", desc: "Pre-approved housing loans from top banks at lowest interest rates." },
        { title: "3D Virtual Property Tours", desc: "Explore property layouts and walkthrough videos from home." }
      ],
      reviews: [
        { author: "Karan Patel", rating: 5, text: "Found a dream 3BHK flat in prime area within 10 days! Honest advice and transparent paperwork." },
        { author: "Sujata Bose", rating: 5, text: "Helped sell my property at market valuation quickly. Highly professional broker." }
      ]
    };
  }

  // 5. Salon / Beauty / Spa
  if (cat.includes("salon") || cat.includes("spa") || cat.includes("beaut") || cat.includes("hair") || cat.includes("makeup") || cat.includes("nail") || cat.includes("barber")) {
    return {
      nicheCategory: "Luxury Beauty & Salon",
      icon: Scissors,
      heroTitle: "Luxury Styling, Hair Care & Glowing Skin Treatments",
      heroSub: "Experience premium grooming, organic facials, and bridal makeovers by certified master stylists.",
      trustBadges: ["Imported Organic Products", "Certified Senior Stylists", "100% Sanitized Tools"],
      colorTheme: {
        heroBg: "bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50",
        iconBg: "bg-pink-100",
        iconColor: "text-pink-700"
      },
      ctaPrimary: "Book Salon Slot",
      ctaSecondary: "WhatsApp Rate List",
      schemaType: "BeautySalon",
      services: [
        { title: "Designer Haircut & Spa Treatment", desc: "Trendy cuts, Keratin, Smoothening & scalp nourishing spa." },
        { title: "Organic HydraFacial & Skin Glow", desc: "Deep pore cleansing, anti-tan facials & instant skin radiance." },
        { title: "Bridal & Party Makeup Packages", desc: "HD Airbrush makeup, hair styling & saree draping for events." },
        { title: "Gel Nail Art & Extensions", desc: "Long-lasting nail extensions, acrylic art, and gel polish." },
        { title: "Luxury Body Spa & Aromatherapy", desc: "Rejuvenating Swedish massage and stress relief therapies." },
        { title: "Gentlemen Grooming & Beard Spa", desc: "Precision hair trimming, beard styling & scalp treatment." }
      ],
      reviews: [
        { author: "Priya Varma", rating: 5, text: "The hair spa and Keratin treatment transformed my hair! Very polite staff and clean salon." },
        { author: "Rohan Das", rating: 5, text: "Best haircut in town. Booking appointment on WhatsApp saved me from waiting." }
      ]
    };
  }

  // 6. Gym / Fitness
  if (cat.includes("gym") || cat.includes("fit") || cat.includes("workout") || cat.includes("crossfit") || cat.includes("yoga")) {
    return {
      nicheCategory: "Fitness & Training Center",
      icon: Dumbbell,
      heroTitle: "Transform Your Fitness, Build Muscle & Burn Fat",
      heroSub: "Train with certified fitness coaches using state-of-the-art equipment, functional crossfit, and custom diet plans.",
      trustBadges: ["Certified Personal Trainers", "Imported Equipment", "Free 3-Day Trial Pass"],
      colorTheme: {
        heroBg: "bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100",
        iconBg: "bg-sky-200",
        iconColor: "text-sky-900"
      },
      ctaPrimary: "Claim Free 3-Day Pass",
      ctaSecondary: "Call Gym Manager",
      schemaType: "ExerciseGym",
      services: [
        { title: "Personal Strength & Bodybuilding", desc: "Dedicated 1-on-1 coaching for muscle building and strength." },
        { title: "Weight Loss & HIIT Fat Burn Bootcamp", desc: "High-intensity calorie burning group cardio & endurance." },
        { title: "Custom Nutrition & Meal Planning", desc: "Calorie-counted macro diet charts designed for your body type." },
        { title: "Yoga & Core Flex Classes", desc: "Mindful stretching, posture correction, and core stability." },
        { title: "Steam Bath & Recovery Zone", desc: "Post-workout muscle recovery, sauna, and relaxation." },
        { title: "Corporate Fitness Membership", desc: "Discounted group membership packages for companies." }
      ],
      reviews: [
        { author: "Manish Joshi", rating: 5, text: "Lost 14 kg in 4 months! Excellent equipment and trainers push you every single day." },
        { author: "Simran Kaur", rating: 5, text: "Super clean gym with female-friendly environment. Love the group HIIT classes!" }
      ]
    };
  }

  // 7. General Local Business Fallback
  return {
    nicheCategory: category || "Local Business",
    icon: Building2,
    heroTitle: "Top-Rated Local Service & Guaranteed Quality",
    heroSub: `Serving ${name} customers in ${category} with transparent pricing, certified experts, and 100% satisfaction guarantee.`,
    trustBadges: ["Google 4.8★ Verified", "Certified Professionals", "Fast Service"],
    colorTheme: {
      heroBg: "bg-gradient-to-br from-sky-50 via-indigo-50 to-slate-50",
      iconBg: "bg-sky-100",
      iconColor: "text-sky-700"
    },
    ctaPrimary: "Book on WhatsApp",
    ctaSecondary: "Call Direct",
    schemaType: "LocalBusiness",
    services: [
      { title: "Core Professional Service", desc: "High quality execution tailored to your specific requirements." },
      { title: "Instant WhatsApp Booking", desc: "Book appointments or request quotes in 30 seconds." },
      { title: "Transparent Upfront Pricing", desc: "No hidden charges or unexpected surprise bills." },
      { title: "Certified Specialist Team", desc: "Experienced staff committed to customer satisfaction." },
      { title: "Fast Emergency Support", desc: "Prompt assistance when you need urgent local service." },
      { title: "After-Service Warranty", desc: "Guaranteed peace of mind with verified support." }
    ],
    reviews: [
      { author: "Siddharth Gupta", rating: 5, text: "Outstanding service! Prompt response on WhatsApp and completed the job cleanly." },
      { author: "Ritu Verma", rating: 5, text: "Very reliable local business. Fair pricing and friendly staff." }
    ]
  };
}

/* ============================================================================
   PROMPT BUILDER WITH NICHE SPECIFICITY
   ============================================================================ */
function buildPrompt(
  l: RankedLead,
  platform: string,
  preset: ReturnType<typeof getNichePreset>
): string {
  const name = l.name;
  const niche = l.category;
  const phone = l.phone ?? "+91 98986 66601";
  const whatsapp = l.whatsapp ?? phone;
  const addr = l.address;
  const rating = l.rating ?? 4.8;
  const reviews = l.reviewsCount ?? 334;
  const gap = l.audit.biggestGap;
  const waClean = whatsapp.replace(/\D/g, "");

  return `You are building a high-converting, mobile-first local-business website for an Indian ${niche} named "${name}".

# BUSINESS PROFILE & DETAILS
- Business Name: ${name}
- Industry Niche: ${niche} (Category: ${preset.nicheCategory})
- Full Address: ${addr}
- City: ${l.city}
- Direct Phone: ${phone}
- WhatsApp Booking: ${whatsapp}
- Google Reputation: ${rating}★ Stars (${reviews} verified reviews)
- Primary Audit Gap to Fix: ${gap} (Est. lost revenue: ₹${(l.audit.estLostRevenuePerMonth || 45000).toLocaleString()}/month)

# NICHE HERO HEADLINE & VALUE PROPOSITION
- Main Headline: "${preset.heroTitle}"
- Subheadline: "${preset.heroSub}"
- Trust Badges: ${preset.trustBadges.join(" | ")}

# DESIGN & BRAND SYSTEM
- Mobile-First Architecture (90% of Indian users are on 375px mobile screens). Hero CTA visible above fold.
- Color Palette: Off-white base (#FAFAFA), Primary Deep Accent (#0284C7), WhatsApp CTA (#16A34A), Slate Typography (#0F172A).
- Typography: Inter or DM Sans font family. Clean hierarchy with large bold headlines.
- Trust Signals: Display Google Rating badge (${rating}★, ${reviews}+ reviews), "Years in Business" badge (${l.yearsInBusiness ?? 8}+ years), and verified local badges.
- Floating WhatsApp Widget: Sticky bottom-right chat button linking to https://wa.me/${waClean}?text=Hi%20${encodeURIComponent(name)},%20I%20would%20like%20to%20book%20a%20slot.
- Header Call Action: Click-to-call link formatted as tel:${phone.replace(/\s/g, "")}.

# HIGH-CONVERTING PAGE SECTIONS (In Exact Order)
1. Sticky Header Bar: Logo + ${name} + "Open Today" Badge + Click-to-Call Button.
2. Hero Section: Niche Headline + Subheadline + "${preset.ctaPrimary}" WhatsApp CTA + "${preset.ctaSecondary}" Phone CTA.
3. Trust Bar: Google Rating pill (${rating}★) + ${reviews}+ Reviews + Years in ${l.city.split(",")[0]}.
4. Niche Services Grid (6 Cards):
${preset.services.map((s, i) => `   ${i + 1}. ${s.title}: ${s.desc}`).join("\n")}
5. About & Credentials: Bio placeholder + credentials + why local customers choose ${name}.
6. Customer Reviews Carousel: ${preset.reviews.map((r) => `"${r.text}" — ${r.author} (${r.rating}★)`).join(" | ")}.
7. Local FAQ Accordion: 5 common customer questions (pricing, booking process, timing, payment options).
8. Location & Directions: Embed Google Map for ${addr} + business hours + directions CTA.
9. Footer: Full contact info, WhatsApp link, phone link, working hours, and social media links.

# TECHNICAL & SEO SCHEMA
- HTML Attribute: lang="en-IN"
- Meta Title: "${name} | Best ${niche} in ${l.city} | Book on WhatsApp"
- Meta Description: "${preset.heroSub} Located at ${addr}. Call ${phone} or book online."
- JSON-LD Structured Data: Schema.org @type "${preset.schemaType}" with name, address, telephone, aggregateRating (${rating}), and openingHours.
- Performance: Optimised image loading, zero layout shifts, lighthouse score > 90.

# COPY TONE & HINGLISH TRUST PHRASES
Warm, reassuring, professional. Include subtle Hinglish trust signals where appropriate ("Aapki zaroorat ke waqt aasan booking").

${
  platform === "lovable" || platform === "bolt"
    ? `OUTPUT FORMAT: Single React + Tailwind CSS landing page component. No backend. Use Unsplash placeholder images relevant to ${niche}.`
    : platform === "claude-code"
      ? "OUTPUT FORMAT: Next.js 15 App Router page with Tailwind CSS and shadcn components."
      : "OUTPUT FORMAT: Self-contained index.html file with Tailwind CSS via CDN."
}

Generate the complete production-ready code now.`;
}
