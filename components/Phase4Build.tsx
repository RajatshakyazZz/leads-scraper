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
  Sparkle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Award,
  Layers,
  Zap,
  TrendingUp
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
  const [previewTab, setPreviewTab] = useState<"all" | "hero" | "services" | "reviews" | "faq" | "contact">("all");
  const [fullModal, setFullModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

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
      toast.success(`Creative animated site ready for ${selected?.name}!`);
    }, 1200);
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
      subtitle="Pick a platform. We craft a battle-tested, niche-tailored prompt with business details, real images, and conversion sections."
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
              <span className="text-sky-700 font-semibold">{selected.rating ?? 4.8}★ ({selected.reviewsCount ?? 0} reviews)</span>
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
        <Card className="rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5 flex flex-col h-[740px]">
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

        {/* Right Card: High Quality Interactive Animated Preview */}
        <Card className="rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5 overflow-hidden flex flex-col h-[740px]">
          {/* Preview Toolbar Header */}
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 gap-3 border-b border-sky-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base tracking-tight font-bold text-slate-900">Live Website Preview</CardTitle>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> Realtime Animated Loop
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
                <Maximize2 className="h-3.5 w-3.5 mr-1" /> Fullscreen
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

          {/* Section Filter Bar */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            <button
              onClick={() => setPreviewTab("all")}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${previewTab === "all" ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}
            >
              ★ Full Page (All Sections)
            </button>
            <button
              onClick={() => setPreviewTab("hero")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${previewTab === "hero" ? "bg-white text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Hero
            </button>
            <button
              onClick={() => setPreviewTab("services")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${previewTab === "services" ? "bg-white text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Services ({nichePreset?.services.length})
            </button>
            <button
              onClick={() => setPreviewTab("reviews")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${previewTab === "reviews" ? "bg-white text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Loop Reviews
            </button>
            <button
              onClick={() => setPreviewTab("faq")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${previewTab === "faq" ? "bg-white text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              FAQs
            </button>
            <button
              onClick={() => setPreviewTab("contact")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${previewTab === "contact" ? "bg-white text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Location & Map
            </button>
          </div>

          {/* Render Interactive Scrollable Preview Screen */}
          <div
            data-lenis-prevent
            className="flex-1 overflow-y-auto p-4 bg-slate-100/70 relative scrollbar-thin overscroll-contain"
          >
            <div
              className={`transition-all duration-300 ${
                viewMode === "mobile"
                  ? "max-w-[375px] mx-auto bg-white rounded-3xl border-4 border-slate-900 shadow-2xl overflow-hidden min-h-[550px]"
                  : "w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              }`}
            >
              <LiveWebsiteRenderer
                lead={selected}
                preset={nichePreset}
                tab={previewTab}
                waNumber={waNumber}
                cleanPhone={cleanPhone}
                onOpenBooking={() => setShowBookingModal(true)}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Interactive Booking Modal Simulation */}
      <AnimatePresence>
        {showBookingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-sky-100 relative"
            >
              <button
                onClick={() => setShowBookingModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Instant Slot Booking</h4>
                  <p className="text-xs text-slate-500">{selected.name}</p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Full Name</label>
                  <input type="text" placeholder="e.g. Rahul Sharma" className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs focus:ring-1 focus:ring-sky-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone / WhatsApp Number</label>
                  <input type="tel" placeholder="+91 98765 43210" className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs focus:ring-1 focus:ring-sky-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Service</label>
                  <select className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs focus:ring-1 focus:ring-sky-500 outline-none bg-white">
                    {nichePreset?.services.map((s, i) => (
                      <option key={i} value={s.title}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => {
                      toast.success("Appointment request sent via WhatsApp!");
                      setShowBookingModal(false);
                      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${selected.name}, I would like to book a slot for consultation.`)}`, "_blank");
                    }}
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                  >
                    Confirm & Send to WhatsApp →
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {fullModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="bg-white rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-sky-200"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold">
                    {nichePreset?.icon ? <nichePreset.icon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{selected.name} — Full Creative Animated Preview</h3>
                    <p className="text-[11px] text-sky-400 font-mono">https://preview.{selected.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => window.open(`https://wa.me/${waNumber}?text=Hi%20${encodeURIComponent(selected.name)}`, "_blank")} className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                    <MessageSquare className="h-3.5 w-3.5 mr-1" /> Test WhatsApp CTA
                  </Button>
                  <button onClick={() => setFullModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 bg-slate-100 overscroll-contain">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                  <LiveWebsiteRenderer
                    lead={selected}
                    preset={nichePreset}
                    tab="all"
                    waNumber={waNumber}
                    cleanPhone={cleanPhone}
                    onOpenBooking={() => {
                      setFullModal(false);
                      setShowBookingModal(true);
                    }}
                  />
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
   LIVE WEBSITE FULL PAGE COMPONENT RENDERER WITH REALTIME ANIMATED LOOPS & IMAGES
   ============================================================================ */
function LiveWebsiteRenderer({
  lead,
  preset,
  tab,
  waNumber,
  cleanPhone,
  onOpenBooking
}: {
  lead: RankedLead;
  preset: ReturnType<typeof getNichePreset> | null;
  tab: "all" | "hero" | "services" | "reviews" | "faq" | "contact";
  waNumber: string;
  cleanPhone: string;
  onOpenBooking: () => void;
}) {
  if (!preset) return null;
  const IconComp = preset.icon;
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const showAll = tab === "all";

  return (
    <div className="font-sans text-slate-900 bg-white relative overflow-hidden">
      {/* 1. SITE HEADER BAR */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3 border-b border-slate-100 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className={`h-8.5 w-8.5 rounded-xl ${preset.colorTheme.iconBg} flex items-center justify-center ${preset.colorTheme.iconColor} font-bold shadow-2xs`}>
            <IconComp className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-slate-900 leading-none">{lead.name}</div>
            <div className="text-[9.5px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{preset.nicheCategory} • {lead.city}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Open Today
          </span>
          <a
            href={`tel:${cleanPhone}`}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Phone className="h-3 w-3 text-sky-400" /> Call
          </a>
        </div>
      </header>

      {/* CONTINUOUS REALTIME LOOP TICKER BAR */}
      <div className="bg-slate-900 text-white py-1.5 px-4 overflow-hidden relative border-b border-slate-800">
        <motion.div
          animate={{ x: [0, -600] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex items-center gap-8 whitespace-nowrap text-[10px] font-mono text-sky-300 uppercase tracking-widest"
        >
          <span>★ {lead.rating ?? 4.8} Google Rated ({lead.reviewsCount ?? 334}+ Reviews)</span>
          <span>• Verified {preset.nicheCategory} in {lead.city}</span>
          <span>• 100% Instant WhatsApp Slots</span>
          <span>• {lead.yearsInBusiness ?? 8}+ Years Trust</span>
          <span>★ {lead.rating ?? 4.8} Google Rated ({lead.reviewsCount ?? 334}+ Reviews)</span>
          <span>• Verified {preset.nicheCategory} in {lead.city}</span>
          <span>• 100% Instant WhatsApp Slots</span>
        </motion.div>
      </div>

      <div className="p-5 space-y-8">
        {/* 2. HERO BANNER & CTAs SECTION WITH NICHE IMAGE COVER */}
        {(showAll || tab === "hero") && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-sky-100 overflow-hidden shadow-md relative text-left group">
              {/* Niche Hero Image Background */}
              <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                <img
                  src={preset.heroImage}
                  alt={lead.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/30" />
              </div>

              {/* Overlay Content */}
              <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end text-white z-10">
                {/* Rating pill */}
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow-2xs border border-white/30 mb-2 w-fit">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{lead.rating ?? 4.8}★ Google Rated</span>
                  <span className="text-slate-200">({lead.reviewsCount ?? 334}+ reviews)</span>
                </div>

                <h2 className="text-xl sm:text-2.5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm">
                  {preset.heroTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mt-2 max-w-xl font-sans drop-shadow-xs">
                  {preset.heroSub}
                </p>

                {/* CTAs */}
                <div className="mt-4 flex flex-wrap gap-2.5 items-center">
                  <button
                    onClick={onOpenBooking}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {preset.ctaPrimary}
                  </button>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 backdrop-blur-md hover:bg-white text-slate-900 font-bold text-xs px-4 py-2.5 border border-white/50 shadow-2xs transition-all"
                  >
                    <Phone className="h-3.5 w-3.5 text-sky-600" />
                    {preset.ctaSecondary}
                  </a>
                </div>
              </div>
            </div>

            {/* Trust Badges Strip */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              {preset.trustBadges.map((badge, idx) => (
                <div key={idx} className="bg-white border border-sky-100 rounded-xl p-3 shadow-2xs flex flex-col items-center justify-center hover:border-sky-300 transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-sky-600 mb-1" />
                  <span className="text-[11px] font-bold text-slate-800 leading-tight">{badge}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. NICHE SPECIALTIES & SERVICES GRID WITH REALTIME IMAGES */}
        {(showAll || tab === "services") && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkle className="h-4 w-4 text-sky-600" /> Niche Services & Specialties
              </h3>
              <span className="text-[10px] text-slate-500 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">{preset.services.length} Premium Offerings</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3.5">
              {preset.services.map((srv, idx) => (
                <div key={idx} className="rounded-2xl border border-sky-100 bg-white hover:border-sky-400 transition-all duration-300 shadow-2xs hover:shadow-md overflow-hidden group">
                  <div className="h-32 w-full overflow-hidden relative">
                    <img
                      src={srv.image}
                      alt={srv.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute top-2.5 left-2.5 h-6 w-6 rounded-lg bg-white/90 backdrop-blur-md text-sky-700 font-bold flex items-center justify-center text-xs shadow-2xs">
                      {idx + 1}
                    </div>
                    <div className="absolute bottom-2 left-2.5 right-2.5 text-white font-bold text-xs truncate drop-shadow-sm">
                      {srv.title}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] text-slate-500 leading-relaxed">{srv.desc}</p>
                    <button
                      onClick={onOpenBooking}
                      className="mt-2.5 text-[11px] font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      Book This Service →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. ABOUT & CREDENTIALS CARD */}
        {showAll && (
          <section className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-sky-400" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">About {lead.name}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              With over <span className="font-bold text-white">{lead.yearsInBusiness ?? 8}+ years of dedicated practice</span> in {lead.city}, {lead.name} delivers modern, high-quality, patient-centric solutions designed for convenience and fast turnaround.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-bold pt-1">
              <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> 100% Satisfaction Guarantee</span>
              <span className="flex items-center gap-1 text-sky-300"><ShieldCheck className="h-3.5 w-3.5" /> Certified Specialist</span>
            </div>
          </section>
        )}

        {/* 5. REALTIME INFINITE ANIMATED LOOP FOR REVIEWS */}
        {(showAll || tab === "reviews") && (
          <section className="space-y-3 pt-2 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Verified Customer Reviews (Realtime Loop)
              </h3>
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{lead.rating ?? 4.8}★ Rating</span>
            </div>

            {/* REALTIME MARQUEE REVIEWS ANIMATION */}
            <div className="relative overflow-hidden py-1">
              <motion.div
                animate={{ x: [0, -800] }}
                transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
                className="flex items-center gap-4 whitespace-normal"
              >
                {[...preset.reviews, ...preset.reviews, ...preset.reviews].map((rev, idx) => (
                  <div key={idx} className="w-[280px] shrink-0 p-4 rounded-2xl border border-sky-100 bg-white shadow-2xs hover:border-sky-300 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center uppercase">
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
              </motion.div>
            </div>
          </section>
        )}

        {/* 6. INTERACTIVE FAQ ACCORDION SECTION */}
        {(showAll || tab === "faq") && (
          <section className="space-y-3 pt-2">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-sky-600" /> Frequently Asked Questions
              </h3>
            </div>

            <div className="space-y-2">
              {preset.faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="border border-sky-100 rounded-xl bg-white overflow-hidden shadow-2xs">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-3 text-left flex items-center justify-between font-bold text-xs text-slate-800 hover:bg-sky-50/50 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-sky-600 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 pt-0 text-[11.5px] text-slate-600 leading-relaxed font-sans border-t border-slate-100/60 bg-sky-50/30">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 7. LOCATION & CONTACT SECTION */}
        {(showAll || tab === "contact") && (
          <section className="space-y-3 pt-2">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <MapPin className="h-4 w-4 text-sky-600" /> Location & Contact Information
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
                <span>Monday – Saturday: 09:30 AM – 08:30 PM (Sunday by Appointment)</span>
              </div>

              <div className="h-36 rounded-xl bg-sky-50 border border-sky-100 flex flex-col items-center justify-center text-xs text-sky-700 font-semibold gap-1.5 p-3 text-center">
                <MapPin className="h-5 w-5 text-sky-600" />
                <span>[Interactive Google Maps Location Embed]</span>
                <span className="text-[10px] text-slate-500 font-normal">{lead.address}</span>
              </div>
            </div>
          </section>
        )}

        {/* 8. FOOTER */}
        {showAll && (
          <footer className="pt-6 pb-4 border-t border-slate-100 text-center space-y-2">
            <div className="font-bold text-xs text-slate-900">{lead.name}</div>
            <div className="text-[10.5px] text-slate-400 font-sans">© {new Date().getFullYear()} {lead.name}. All rights reserved. • High-Converting Local Site</div>
          </footer>
        )}
      </div>

      {/* Floating Sticky WhatsApp Button */}
      <div className="sticky bottom-4 right-4 flex justify-end px-4 pb-2 pointer-events-auto z-10">
        <button
          onClick={onOpenBooking}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold shadow-xl hover:bg-emerald-700 transition-all cursor-pointer"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Book Slot on WhatsApp</span>
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   NICHE PRESET DETECTION ENGINE WITH REALTIME IMAGES & CREATIVE COPY
   ============================================================================ */
function getNichePreset(category: string, name: string) {
  const cat = `${category} ${name}`.toLowerCase();

  // 1. Dental Clinic / Dentist
  if (cat.includes("dent") || cat.includes("teeth") || cat.includes("orthodont")) {
    return {
      nicheCategory: "Dental Clinic",
      icon: Stethoscope,
      heroImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
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
        { title: "Painless Root Canal (Single Sitting)", desc: "Rotary endodontics with zero pain and instant relief.", image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80" },
        { title: "Laser Teeth Whitening (Shade 3+ Cleaner)", desc: "Professional 45-min laser bleaching for bright smiles.", image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=400&q=80" },
        { title: "Clear Invisible Aligners & Braces", desc: "Custom computer-designed clear aligners for adults & kids.", image: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=400&q=80" },
        { title: "Titanium Dental Implants", desc: "Permanent tooth replacement with lifetime warranty options.", image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80" },
        { title: "Cosmetic Veneers & Smile Makeover", desc: "Porcelain veneers for perfectly shaped white teeth.", image: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=400&q=80" },
        { title: "Pediatric & Family Dental Checkup", desc: "Gentle, stress-free dental care for children and seniors.", image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80" }
      ],
      reviews: [
        { author: "Dr. Ananya Sharma", rating: 5, text: "Got my aligners done here. Super smooth process with zero discomfort. Highly recommend!" },
        { author: "Vikram Mehta", rating: 5, text: "Extremely clean clinic and doctor explains every procedure calmly. Painless root canal done." },
        { author: "Priya Malhotra", rating: 5, text: "The teeth whitening session gave amazing instant results for my wedding!" }
      ],
      faqs: [
        { q: "Is root canal treatment really painless here?", a: "Yes! We use advanced rotary endodontics and computerized local anesthesia so you feel zero pain throughout." },
        { q: "How long does teeth whitening last?", a: "With basic care, laser whitening results last 12 to 24 months. We also provide a complimentary touch-up kit." },
        { q: "Do you offer 0% EMI payment options?", a: "Yes, we support flexible 0% interest monthly installments for aligners, implants, and smile makeovers." },
        { q: "What are the clinic timings?", a: "We are open Monday to Saturday 9:30 AM to 8:30 PM. Sunday appointments are available on prior request." }
      ]
    };
  }

  // 2. Doctor / General Medical Clinic / Hospital
  if (cat.includes("doct") || cat.includes("clinic") || cat.includes("hospit") || cat.includes("health") || cat.includes("physician") || cat.includes("dermat") || cat.includes("eye")) {
    return {
      nicheCategory: "Medical Clinic",
      icon: Stethoscope,
      heroImage: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=800&q=80",
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
        { title: "Specialist OPD Consultation", desc: "Expert diagnosis and personalized treatment plans.", image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80" },
        { title: "Complete Health Package & Diagnostics", desc: "Comprehensive blood tests, ECG, and preventive care.", image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80" },
        { title: "Chronic Disease Management", desc: "Long-term care for Diabetes, BP, Thyroid & Cholesterol.", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80" },
        { title: "Pediatric & Vaccination Desk", desc: "Child immunizations, growth tracking, and wellness.", image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1cdb?auto=format&fit=crop&w=400&q=80" },
        { title: "Skin & Dermatology Care", desc: "Acne, eczema, laser skin care, and allergy tests.", image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=400&q=80" },
        { title: "Home Visit & Teleconsultation", desc: "Video consultation and doctor home visits for seniors.", image: "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=400&q=80" }
      ],
      reviews: [
        { author: "Rajesh Kumar", rating: 5, text: "Doctor gave genuine advice without prescribing unnecessary tests. Very polite staff." },
        { author: "Pooja Malhotra", rating: 5, text: "WhatsApp booking saved us 2 hours in waiting room. Very efficient system!" },
        { author: "Sunil Verma", rating: 5, text: "Great experience for my parents' routine health checkup." }
      ],
      faqs: [
        { q: "How do I book a same-day OPD slot?", a: "Click the WhatsApp button or call direct. Slots are confirmed instantly in under 1 minute." },
        { q: "Are home visits available for senior citizens?", a: "Yes, doctor visits and home blood sample collection can be scheduled for elderly patients." },
        { q: "Do you accept health insurance?", a: "We provide cashless assistance for empaneled insurance providers and detailed reimbursement bills." },
        { q: "What should I bring for my first consultation?", a: "Please carry any previous medical records, prescriptions, and a list of current medications." }
      ]
    };
  }

  // 3. Restaurant / Cafe / Dining
  if (cat.includes("restau") || cat.includes("cafe") || cat.includes("food") || cat.includes("dini") || cat.includes("pizz") || cat.includes("baker") || cat.includes("biryan")) {
    return {
      nicheCategory: "Restaurant & Cafe",
      icon: Utensils,
      heroImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
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
        { title: "Signature Chef Delicacies", desc: "Curated gourmet appetizers, authentic gravies & breads.", image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80" },
        { title: "Instant Table Reservation", desc: "Skip the queue! Book your favorite table online in 30 seconds.", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80" },
        { title: "Express WhatsApp Delivery", desc: "Hot food delivered directly to your doorstep in 30 mins.", image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=400&q=80" },
        { title: "Artisan Coffee & Mocktails", desc: "Freshly brewed espresso and handcrafted refreshing coolers.", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80" },
        { title: "Private Party & Birthday Catering", desc: "Custom buffet menus for corporate events and family gatherings.", image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=400&q=80" },
        { title: "Weekend Brunch Buffets", desc: "Unlimited multi-cuisine brunch spreads every Saturday & Sunday.", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80" }
      ],
      reviews: [
        { author: "Amit Singhania", rating: 5, text: "Phenomenal taste and hospitality! The chef specials are a must-try. Table booking was seamless." },
        { author: "Neha Roy", rating: 5, text: "Loved the ambiance and quick service. Ordered home delivery on WhatsApp and arrived hot!" },
        { author: "Rahul Kapoor", rating: 5, text: "Great food quality and clean hygiene standards." }
      ],
      faqs: [
        { q: "How far in advance should I reserve a table?", a: "We recommend reserving 2-4 hours prior for weekdays, and 1 day prior for weekend dinners." },
        { q: "Is home delivery available directly?", a: "Yes, order on WhatsApp to get direct restaurant pricing with zero third-party markups!" },
        { q: "Do you cater for private parties?", a: "Yes! We cater for birthdays, anniversaries, and corporate events up to 200 guests." },
        { q: "Is pure vegetarian / Jain food available?", a: "Yes, we have dedicated pure veg cookware and separate Jain food options." }
      ]
    };
  }

  // 4. Real Estate / Property Dealer / Realtor
  if (cat.includes("prop") || cat.includes("real") || cat.includes("estate") || cat.includes("broker") || cat.includes("realt") || cat.includes("flat") || cat.includes("plot") || cat.includes("house")) {
    return {
      nicheCategory: "Real Estate Brokerage",
      icon: Building2,
      heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
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
        { title: "Luxury Residential Apartments & Villas", desc: "2, 3 & 4 BHK ready-to-move and under-construction flats.", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80" },
        { title: "Commercial Office & Retail Spaces", desc: "High ROI commercial shops, showrooms, and tech park offices.", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80" },
        { title: "Verified Gated Land & Plots", desc: "Clear title residential plots with immediate registry & handover.", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80" },
        { title: "Property Valuation & Legal Registry", desc: "End-to-end stamp duty, agreement drafting, and legal support.", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80" },
        { title: "Home Loan & EMI Assistance", desc: "Pre-approved housing loans from top banks at lowest interest rates.", image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80" },
        { title: "3D Virtual Property Tours", desc: "Explore property layouts and walkthrough videos from home.", image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=400&q=80" }
      ],
      reviews: [
        { author: "Karan Patel", rating: 5, text: "Found a dream 3BHK flat in prime area within 10 days! Honest advice and transparent paperwork." },
        { author: "Sujata Bose", rating: 5, text: "Helped sell my property at market valuation quickly. Highly professional broker." },
        { author: "Vikram Rathi", rating: 5, text: "Smooth home loan processing and transparent site visits." }
      ],
      faqs: [
        { q: "Are all listed properties RERA registered?", a: "Yes, 100% of our residential and commercial projects are RERA registered with clear titles." },
        { q: "How do I schedule a site visit?", a: "Click 'Schedule Site Visit' or WhatsApp us. We arrange free cab pickup and drop for property visits." },
        { q: "Do you help with home loans?", a: "Yes, we have tie-ups with HDFC, SBI, ICICI, and Axis Bank for fast 48-hour loan approval." },
        { q: "What is your brokerage fee structure?", a: "We maintain complete transparency. Zero brokerage on new developer projects." }
      ]
    };
  }

  // 5. Salon / Beauty / Spa
  if (cat.includes("salon") || cat.includes("spa") || cat.includes("beaut") || cat.includes("hair") || cat.includes("makeup") || cat.includes("nail") || cat.includes("barber")) {
    return {
      nicheCategory: "Luxury Beauty & Salon",
      icon: Scissors,
      heroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
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
        { title: "Designer Haircut & Spa Treatment", desc: "Trendy cuts, Keratin, Smoothening & scalp nourishing spa.", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80" },
        { title: "Organic HydraFacial & Skin Glow", desc: "Deep pore cleansing, anti-tan facials & instant skin radiance.", image: "https://images.unsplash.com/photo-1512290900673-7002049c30f4?auto=format&fit=crop&w=400&q=80" },
        { title: "Bridal & Party Makeup Packages", desc: "HD Airbrush makeup, hair styling & saree draping for events.", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80" },
        { title: "Gel Nail Art & Extensions", desc: "Long-lasting nail extensions, acrylic art, and gel polish.", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=400&q=80" },
        { title: "Luxury Body Spa & Aromatherapy", desc: "Rejuvenating Swedish massage and stress relief therapies.", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80" },
        { title: "Gentlemen Grooming & Beard Spa", desc: "Precision hair trimming, beard styling & scalp treatment.", image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80" }
      ],
      reviews: [
        { author: "Priya Varma", rating: 5, text: "The hair spa and Keratin treatment transformed my hair! Very polite staff and clean salon." },
        { author: "Rohan Das", rating: 5, text: "Best haircut in town. Booking appointment on WhatsApp saved me from waiting." },
        { author: "Shweta Nair", rating: 5, text: "Amazing bridal makeup done for my wedding!" }
      ],
      faqs: [
        { q: "Is prior booking required?", a: "Prior slot booking via WhatsApp is recommended to skip weekend waiting times." },
        { q: "What brands do you use for hair & skin?", a: "We exclusively use imported dermatologist-tested organic brands like L'Oreal Professional, Schwarzkopf, and Cheryl's." },
        { q: "Do you offer bridal makeup packages?", a: "Yes, we provide HD Airbrush bridal packages including trial sessions, hair draping, and nail art." },
        { q: "What are your sanitation standards?", a: "All scissors, combs, and towels undergo UV sterilization after every client visit." }
      ]
    };
  }

  // 6. Gym / Fitness
  if (cat.includes("gym") || cat.includes("fit") || cat.includes("workout") || cat.includes("crossfit") || cat.includes("yoga")) {
    return {
      nicheCategory: "Fitness & Training Center",
      icon: Dumbbell,
      heroImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
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
        { title: "Personal Strength & Bodybuilding", desc: "Dedicated 1-on-1 coaching for muscle building and strength.", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80" },
        { title: "Weight Loss & HIIT Fat Burn Bootcamp", desc: "High-intensity calorie burning group cardio & endurance.", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80" },
        { title: "Custom Nutrition & Meal Planning", desc: "Calorie-counted macro diet charts designed for your body type.", image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80" },
        { title: "Yoga & Core Flex Classes", desc: "Mindful stretching, posture correction, and core stability.", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80" },
        { title: "Steam Bath & Recovery Zone", desc: "Post-workout muscle recovery, sauna, and relaxation.", image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=400&q=80" },
        { title: "Corporate Fitness Membership", desc: "Discounted group membership packages for companies.", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80" }
      ],
      reviews: [
        { author: "Manish Joshi", rating: 5, text: "Lost 14 kg in 4 months! Excellent equipment and trainers push you every single day." },
        { author: "Simran Kaur", rating: 5, text: "Super clean gym with female-friendly environment. Love the group HIIT classes!" },
        { author: "Aakash Jain", rating: 5, text: "Best gym infrastructure and friendly trainers." }
      ],
      faqs: [
        { q: "How do I claim my 3-day free trial pass?", a: "Simply click 'Claim Free Pass' to register via WhatsApp. Show your pass at reception!" },
        { q: "Are personal trainers included in membership?", a: "General floor trainers assist all members. 1-on-1 dedicated Personal Training packages are available separately." },
        { q: "What are gym operating hours?", a: "We open early at 5:30 AM to 10:30 PM (Monday to Saturday) and 7:00 AM to 1:00 PM on Sundays." },
        { q: "Is diet planning included?", a: "Yes, every quarterly and annual membership includes a personalized nutritionist consultation." }
      ]
    };
  }

  // 7. General Local Business Fallback
  return {
    nicheCategory: category || "Local Business",
    icon: Building2,
    heroImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
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
      { title: "Core Professional Service", desc: "High quality execution tailored to your specific requirements.", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80" },
      { title: "Instant WhatsApp Booking", desc: "Book appointments or request quotes in 30 seconds.", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80" },
      { title: "Transparent Upfront Pricing", desc: "No hidden charges or unexpected surprise bills.", image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80" },
      { title: "Certified Specialist Team", desc: "Experienced staff committed to customer satisfaction.", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80" },
      { title: "Fast Emergency Support", desc: "Prompt assistance when you need urgent local service.", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=80" },
      { title: "After-Service Warranty", desc: "Guaranteed peace of mind with verified support.", image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80" }
    ],
    reviews: [
      { author: "Siddharth Gupta", rating: 5, text: "Outstanding service! Prompt response on WhatsApp and completed the job cleanly." },
      { author: "Ritu Verma", rating: 5, text: "Very reliable local business. Fair pricing and friendly staff." },
      { author: "Deepak Sharma", rating: 5, text: "Professional staff and great value for money." }
    ],
    faqs: [
      { q: "How quickly can I book a service?", a: "Contact us via WhatsApp or phone for instant slot confirmation in under 2 minutes." },
      { q: "Are prices fixed or transparent?", a: "We provide clear upfront estimates before starting any work so there are zero hidden costs." },
      { q: "What payment methods do you accept?", a: "We accept UPI (GPay/PhonePe), Credit/Debit cards, Netbanking, and Cash." },
      { q: "Do you offer service warranty?", a: "Yes, all our services come with a verified customer satisfaction warranty." }
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
2. Hero Section: Niche Cover Image + Headline + Subheadline + "${preset.ctaPrimary}" WhatsApp CTA + "${preset.ctaSecondary}" Phone CTA.
3. Trust Bar: Realtime Ticker Badge (${rating}★, ${reviews}+ Reviews, Years in ${l.city.split(",")[0]}).
4. Niche Services Grid (6 Cards with High-Res Images):
${preset.services.map((s, i) => `   ${i + 1}. ${s.title}: ${s.desc} [Image: ${s.image}]`).join("\n")}
5. About & Credentials: Bio placeholder + credentials + why local customers choose ${name}.
6. Customer Reviews Carousel (Realtime Infinite Loop): ${preset.reviews.map((r) => `"${r.text}" — ${r.author} (${r.rating}★)`).join(" | ")}.
7. Local FAQ Accordion: 4 common customer questions (pricing, booking process, timing, payment options).
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
