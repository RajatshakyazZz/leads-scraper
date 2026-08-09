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
  Navigation,
  Heart,
  Globe,
  Share2,
  Link as LinkIcon
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
  const [restaurantStyle, setRestaurantStyle] = useState<"crav" | "madre" | "classic">("crav");
  const [gymStyle, setGymStyle] = useState<"phive" | "buckler" | "classic">("phive");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewTab, setPreviewTab] = useState<"all" | "hero" | "services" | "reviews" | "faq" | "contact">("all");
  const [fullModal, setFullModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Client Share Link state
  const [sharingLink, setSharingLink] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const isRestaurant = useMemo(() => {
    if (!selected) return false;
    const cat = `${selected.category} ${selected.name}`.toLowerCase();
    return (
      cat.includes("restau") ||
      cat.includes("cafe") ||
      cat.includes("burg") ||
      cat.includes("food") ||
      cat.includes("dini") ||
      cat.includes("pizz") ||
      cat.includes("baker") ||
      cat.includes("biryan") ||
      cat.includes("thali") ||
      cat.includes("veg")
    );
  }, [selected]);

  const isGym = useMemo(() => {
    if (!selected) return false;
    const cat = `${selected.category} ${selected.name}`.toLowerCase();
    return (
      cat.includes("gym") ||
      cat.includes("fitn") ||
      cat.includes("crossfit") ||
      cat.includes("workout") ||
      cat.includes("health club") ||
      cat.includes("training") ||
      cat.includes("pilates") ||
      cat.includes("physique") ||
      cat.includes("muscle") ||
      cat.includes("iron")
    );
  }, [selected]);

  const nichePreset = useMemo(() => (selected ? getNichePreset(selected.category, selected.name) : null), [selected]);
  const prompt = useMemo(() => (selected && nichePreset ? buildPrompt(selected, platform, nichePreset, restaurantStyle, gymStyle) : ""), [selected, platform, nichePreset, restaurantStyle, gymStyle]);

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

  async function generateShareableLink() {
    if (!selected) return;

    setSharingLink(true);
    try {
      const res = await fetch("/api/previews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lead: selected }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate preview link.");
      }

      const fullUrl = `${window.location.origin}${data.previewUrl}`;
      setShareUrl(fullUrl);
      navigator.clipboard.writeText(fullUrl);
      setShareModalOpen(true);
      toast.success("Live preview link created & copied to clipboard!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSharingLink(false);
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
      toast.success(`Niche theme site ready for ${selected?.name}!`);
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
      subtitle="Pick a platform. We craft a battle-tested, niche-tailored prompt with business details, real images, and custom color themes."
      onPrev={onPrev}
      onNext={onNext}
      nextLabel="Draft outreach"
    >
      {/* Selected Prospect Header Card */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap bg-[#111726]/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lime-400 font-bold shrink-0">
            {nichePreset?.icon ? <nichePreset.icon className="h-5 w-5 text-lime-400" /> : <Sparkles className="h-5 w-5 text-lime-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-sans font-black text-xl text-white font-serif">{selected.name}</div>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 border border-lime-500/30 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-lime-400 font-mono">
                {nichePreset?.nicheCategory ?? selected.category}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-sans flex items-center gap-2">
              <span>{selected.address}</span>
              <span>•</span>
              <span className="text-lime-400 font-bold font-mono">{selected.rating ?? 4.8}★ ({selected.reviewsCount ?? 0} reviews)</span>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={generateShareableLink}
            disabled={sharingLink}
            className="rounded-xl h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            {sharingLink ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Share2 className="h-3.5 w-3.5 mr-1.5" />}
            Share Client Preview
          </Button>

          <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
            <SelectTrigger className="w-[130px] rounded-xl border-slate-800 bg-slate-900 text-white text-xs h-9 font-bold focus:ring-1 focus:ring-lime-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-800 shadow-2xl bg-[#0F172A] text-white">
              {PLATFORMS.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs rounded-lg font-bold hover:bg-slate-800">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={openPlatform} className="rounded-xl h-9 px-3 border-slate-800 bg-slate-900 text-slate-300 text-xs font-extrabold hover:bg-slate-800 hover:text-white">
            <ExternalLink className="h-3.5 w-3.5 mr-1 text-slate-400" /> Open
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={savePrompt}
            disabled={saving || savedKey === `${selected.id}:${platform}`}
            className="rounded-xl h-9 px-3 border-slate-800 bg-slate-900 text-slate-300 text-xs font-extrabold hover:bg-slate-800 hover:text-white"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : savedKey === `${selected.id}:${platform}` ? <Check className="h-3.5 w-3.5 mr-1 text-lime-400" /> : <Save className="h-3.5 w-3.5 mr-1 text-slate-400" />}
            {savedKey === `${selected.id}:${platform}` ? "Saved" : "Save Prompt"}
          </Button>

          <Button size="sm" onClick={copyPrompt} className="rounded-xl h-9 px-4 bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-lime-500/20 cursor-pointer">
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Prompt
          </Button>
        </div>
      </div>

      {/* Main Grid: Prompt Code vs Live Preview */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Card: Tailored Niche Prompt (FULLY SCROLLABLE) */}
        <Card className="rounded-2xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md shadow-2xl flex flex-col h-[740px] overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between border-b border-slate-800 shrink-0">
            <div>
              <CardTitle className="text-base tracking-tight font-black text-white uppercase flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-lime-400" />
                Tailored AI Prompt ({PLATFORMS.find((p) => p.id === platform)?.label})
              </CardTitle>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5 font-mono">
                Niche: <span className="font-bold text-white">{nichePreset?.nicheCategory}</span> • {selected.city}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={copyPrompt} className="h-7 px-2 text-xs text-lime-400 hover:bg-slate-800 rounded-lg font-bold">
              <Copy className="h-3 w-3 mr-1" /> Copy
            </Button>
          </CardHeader>
          <CardContent data-lenis-prevent className="p-4 flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <pre className="text-[11.5px] leading-relaxed whitespace-pre-wrap font-mono bg-slate-950 text-slate-200 rounded-xl p-4 min-h-full border border-slate-800 shadow-inner select-text">
              {prompt}
            </pre>
          </CardContent>
        </Card>

        {/* Right Card: High Quality Interactive Animated Preview */}
        <Card className="rounded-2xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col h-[740px]">
          {/* Preview Toolbar Header */}
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 gap-3 border-b border-slate-800 bg-slate-900/80 shrink-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base tracking-tight font-black text-white uppercase">Live Website Preview</CardTitle>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-lime-500/30 px-2.5 py-0.5 text-[10px] font-extrabold text-lime-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-ping" /> Realtime Scraped Data
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={generateShareableLink}
                disabled={sharingLink}
                className="rounded-xl h-8 px-2.5 border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50"
                title="Share Client Link"
              >
                {sharingLink ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5 text-emerald-600" />}
              </Button>

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

              {isRestaurant && (
                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
                  <button
                    onClick={() => setRestaurantStyle("crav")}
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                      restaurantStyle === "crav" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🍔 CRAV
                  </button>
                  <button
                    onClick={() => setRestaurantStyle("madre")}
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                      restaurantStyle === "madre" ? "bg-[#F83E1C] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🌮 Madre
                  </button>
                  <button
                    onClick={() => setRestaurantStyle("classic")}
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                      restaurantStyle === "classic" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    👑 Heritage
                  </button>
                </div>
              )}

              {isGym && (
                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
                  <button
                    onClick={() => setGymStyle("phive")}
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                      gymStyle === "phive" ? "bg-[#ffe000] text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ⚡ Phive
                  </button>
                  <button
                    onClick={() => setGymStyle("buckler")}
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                      gymStyle === "buckler" ? "bg-[#cdc2b1] text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🦾 Buckler
                  </button>
                  <button
                    onClick={() => setGymStyle("classic")}
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                      gymStyle === "classic" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    👑 Heritage
                  </button>
                </div>
              )}

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
              Specialties ({nichePreset?.services.length})
            </button>
            <button
              onClick={() => setPreviewTab("reviews")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${previewTab === "reviews" ? "bg-white text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Reviews ({selected.reviewsCount ?? 0}+)
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
              Live Map
            </button>
          </div>

          {/* Render Interactive Scrollable Preview Screen */}
          <div
            data-lenis-prevent
            className="flex-1 overflow-y-auto p-4 bg-slate-900/90 relative scrollbar-thin overscroll-contain"
          >
            <div
              className={`transition-all duration-300 ${
                viewMode === "mobile"
                  ? "max-w-[375px] mx-auto bg-[#1a1a1a] rounded-3xl border-4 border-amber-500/40 shadow-2xl overflow-hidden min-h-[550px]"
                  : "w-full bg-[#1a1a1a] rounded-2xl border border-amber-500/30 shadow-sm overflow-hidden"
              }`}
            >
              {isRestaurant && restaurantStyle === "crav" && nichePreset ? (
                <CravArtisanWebsiteRenderer
                  lead={selected}
                  preset={nichePreset}
                  isMobile={viewMode === "mobile"}
                  waNumber={waNumber}
                  cleanPhone={cleanPhone}
                  onOpenBooking={() => setShowBookingModal(true)}
                />
              ) : isRestaurant && restaurantStyle === "madre" && nichePreset ? (
                <BurritoMadreWebsiteRenderer
                  lead={selected}
                  preset={nichePreset}
                  isMobile={viewMode === "mobile"}
                  waNumber={waNumber}
                  cleanPhone={cleanPhone}
                  onOpenBooking={() => setShowBookingModal(true)}
                />
              ) : isGym && gymStyle === "phive" && nichePreset ? (
                <PhiveGymWebsiteRenderer
                  lead={selected}
                  preset={nichePreset}
                  isMobile={viewMode === "mobile"}
                  waNumber={waNumber}
                  cleanPhone={cleanPhone}
                  onOpenBooking={() => setShowBookingModal(true)}
                />
              ) : isGym && gymStyle === "buckler" && nichePreset ? (
                <BucklerGymWebsiteRenderer
                  lead={selected}
                  preset={nichePreset}
                  isMobile={viewMode === "mobile"}
                  waNumber={waNumber}
                  cleanPhone={cleanPhone}
                  onOpenBooking={() => setShowBookingModal(true)}
                />
              ) : (
                <LiveWebsiteRenderer
                  lead={selected}
                  preset={nichePreset}
                  tab={previewTab}
                  isMobile={viewMode === "mobile"}
                  waNumber={waNumber}
                  cleanPhone={cleanPhone}
                  onOpenBooking={() => setShowBookingModal(true)}
                />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Share Client Preview Link Modal */}
      <AnimatePresence>
        {shareModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-sky-100 relative"
            >
              <button
                onClick={() => setShareModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Shareable Client Preview Link</h4>
                  <p className="text-xs text-slate-500 font-sans">Lifetime active link stored securely in database</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Live URL</div>
                  <div className="text-xs font-mono text-sky-700 font-bold break-all select-all">{shareUrl}</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Persistent Lifetime Access
                  </div>
                  <p className="text-[11.5px] leading-relaxed">
                    Your client <strong>({selected.name})</strong> can open this link anytime on mobile or desktop to view the complete live website preview with real-time Google map and WhatsApp booking!
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("Preview link copied!");
                    }}
                    className="flex-1 h-10 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Link
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => window.open(shareUrl, "_blank")}
                    className="h-10 rounded-xl border-slate-200 text-slate-700 font-bold text-xs px-4"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Test Link
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-slate-900 text-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-amber-500/40 relative"
            >
              <button
                onClick={() => setShowBookingModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-400 text-base">Make Table Reservation</h4>
                  <p className="text-xs text-slate-400">{selected.name}</p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Your Full Name</label>
                  <input type="text" placeholder="e.g. Rahul Sharma" className="w-full h-9 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Phone / WhatsApp Number</label>
                  <input type="tel" placeholder={selected.phone || "+91 95577 30531"} className="w-full h-9 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Select Specialty / Table</label>
                  <select className="w-full h-9 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none">
                    {nichePreset?.services.map((s, i) => (
                      <option key={i} value={s.title}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => {
                      toast.success("Reservation request sent via WhatsApp!");
                      setShowBookingModal(false);
                      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${selected.name}, I would like to reserve a table.`)}`, "_blank");
                    }}
                    className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
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
              className="bg-[#1a1a1a] rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-amber-500/40"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
                    {nichePreset?.icon ? <nichePreset.icon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{selected.name} — Full Royal Luxury Preview</h3>
                    <p className="text-[11px] text-amber-400 font-mono">https://preview.{selected.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={generateShareableLink} disabled={sharingLink} className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                    <Share2 className="h-3.5 w-3.5 mr-1" /> Share Client Link
                  </Button>
                  <button onClick={() => setFullModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 bg-slate-950 overscroll-contain">
                <div className="max-w-4xl mx-auto bg-[#1a1a1a] rounded-2xl shadow-2xl border border-amber-500/30 overflow-hidden">
                  {isRestaurant && restaurantStyle === "crav" && nichePreset ? (
                    <CravArtisanWebsiteRenderer
                      lead={selected}
                      preset={nichePreset}
                      isMobile={false}
                      waNumber={waNumber}
                      cleanPhone={cleanPhone}
                      onOpenBooking={() => setShowBookingModal(true)}
                    />
                  ) : isRestaurant && restaurantStyle === "madre" && nichePreset ? (
                    <BurritoMadreWebsiteRenderer
                      lead={selected}
                      preset={nichePreset}
                      isMobile={false}
                      waNumber={waNumber}
                      cleanPhone={cleanPhone}
                      onOpenBooking={() => setShowBookingModal(true)}
                    />
                  ) : isGym && gymStyle === "phive" && nichePreset ? (
                    <PhiveGymWebsiteRenderer
                      lead={selected}
                      preset={nichePreset}
                      isMobile={false}
                      waNumber={waNumber}
                      cleanPhone={cleanPhone}
                      onOpenBooking={() => setShowBookingModal(true)}
                    />
                  ) : isGym && gymStyle === "buckler" && nichePreset ? (
                    <BucklerGymWebsiteRenderer
                      lead={selected}
                      preset={nichePreset}
                      isMobile={false}
                      waNumber={waNumber}
                      cleanPhone={cleanPhone}
                      onOpenBooking={() => setShowBookingModal(true)}
                    />
                  ) : (
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
                  )}
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
   LIVE WEBSITE FULL PAGE COMPONENT RENDERER WITH SHRIPATI ROYAL GOLD LUXURY THEME
   ============================================================================ */
function LiveWebsiteRenderer({
  lead,
  preset,
  tab,
  isMobile,
  waNumber,
  cleanPhone,
  onOpenBooking
}: {
  lead: RankedLead;
  preset: ReturnType<typeof getNichePreset> | null;
  tab: "all" | "hero" | "services" | "reviews" | "faq" | "contact";
  isMobile?: boolean;
  waNumber: string;
  cleanPhone: string;
  onOpenBooking: () => void;
}) {
  if (!preset) return null;
  const IconComp = preset.icon;
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const showAll = tab === "all";
  const theme = preset.theme;

  return (
    <div className={`font-sans text-slate-100 ${theme.bodyBg} relative overflow-hidden`}>
      {/* 1. SITE HEADER BAR (SHRIPATI DARK ROYAL HEADER) */}
      <header className={`sticky top-0 z-20 ${theme.headerBg} backdrop-blur-md px-5 py-3 border-b ${theme.headerBorder} flex items-center justify-between shadow-lg`}>
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-xl ${theme.badgeBg} flex items-center justify-center ${theme.accentText} font-bold shadow-md border ${theme.cardBorder}`}>
            <IconComp className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white leading-none font-serif flex items-center gap-1.5">
              <span>{lead.name}</span>
            </div>
            <div className={`text-[9.5px] ${theme.accentText} font-bold uppercase tracking-wider mt-1`}>{preset.nicheCategory} • {lead.city}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-400 px-3 py-0.5 text-[10px] font-bold border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> Open Today
          </span>
          <a
            href={`tel:${cleanPhone}`}
            className={`inline-flex items-center gap-1.5 rounded-xl ${theme.ctaBtn} px-3 py-1.5 text-xs font-bold transition-all shadow-md`}
          >
            <Phone className="h-3 w-3 text-white" /> Call Direct
          </a>
        </div>
      </header>

      {/* CONTINUOUS REALTIME LOOP TICKER BAR */}
      <div className={`${theme.tickerBg} ${theme.tickerText} py-1.5 px-4 overflow-hidden relative border-b ${theme.headerBorder}`}>
        <motion.div
          animate={{ x: [0, -600] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex items-center gap-8 whitespace-nowrap text-[10px] font-mono uppercase tracking-widest"
        >
          <span>★ {lead.rating ?? 4.8} Google Rated ({lead.reviewsCount ?? 334}+ Reviews)</span>
          <span>• Verified {preset.nicheCategory} in {lead.city}</span>
          <span>• 100% Instant WhatsApp Reservations</span>
          <span>• {lead.yearsInBusiness ?? 8}+ Years Heritage Trust in {lead.city}</span>
          <span>★ {lead.rating ?? 4.8} Google Rated ({lead.reviewsCount ?? 334}+ Reviews)</span>
          <span>• Verified {preset.nicheCategory} in {lead.city}</span>
        </motion.div>
      </div>

      <div className="p-4 sm:p-5 space-y-6 sm:space-y-8">
        {/* 2. HERO BANNER & CTAs SECTION (SHRIPATI SLIDESHOW HERO COVER) */}
        {(showAll || tab === "hero") && (
          <section className="space-y-4">
            <div className={`rounded-2xl border ${theme.cardBorder} overflow-hidden shadow-2xl relative text-left group`}>
              {/* Niche Hero Image Background */}
              <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                <img
                  src={preset.heroImage}
                  alt={lead.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-black/40" />
              </div>

              {/* Overlay Content */}
              <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end text-white z-10">
                {/* Rating pill */}
                <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-bold text-amber-300 shadow-sm border border-amber-500/30 mb-2 w-fit">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{lead.rating ?? 4.8}★ Google Rated</span>
                  <span className="text-slate-300">({lead.reviewsCount ?? 334}+ reviews)</span>
                </div>

                <div className="text-[11px] text-amber-400 font-bold uppercase tracking-widest mb-1 font-serif">
                  Welcome To <span className="text-white font-extrabold">{lead.name}</span>
                </div>

                <h2 className={`font-extrabold text-white tracking-tight leading-tight drop-shadow-md font-serif ${isMobile ? "text-lg" : "text-xl sm:text-2.5xl"}`}>
                  {preset.heroTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2 max-w-xl font-sans drop-shadow-xs">
                  {preset.heroSub}
                </p>

                {/* CTAs */}
                <div className="mt-4 flex flex-wrap gap-2.5 items-center">
                  <button
                    onClick={onOpenBooking}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs px-4 py-2.5 shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {preset.ctaPrimary}
                  </button>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 border border-slate-700 shadow-md transition-all"
                  >
                    <Phone className="h-3.5 w-3.5 text-amber-400" />
                    {preset.ctaSecondary}
                  </a>
                </div>
              </div>
            </div>

            {/* Trust Badges Strip */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {preset.trustBadges.map((badge, idx) => (
                <div key={idx} className={`bg-[#222222] border ${theme.cardBorder} rounded-xl p-2.5 shadow-md flex flex-col items-center justify-center transition-all hover:border-amber-500/60`}>
                  <CheckCircle2 className={`h-4 w-4 ${theme.accentText} mb-1`} />
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 leading-tight">{badge}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. NICHE SPECIALTIES & SERVICES GRID WITH REALTIME IMAGES */}
        {(showAll || tab === "services") && (
          <section className="space-y-4 pt-2">
            <div className={`flex items-center justify-between border-b ${theme.headerBorder} pb-2`}>
              <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2 font-serif">
                <Sparkle className={`h-4 w-4 ${theme.accentText}`} /> Our Specialties & Menu
              </h3>
              <span className={`text-[10px] font-bold ${theme.badgeBg} px-2.5 py-0.5 rounded-full border ${theme.cardBorder}`}>{preset.services.length} Signature Offerings</span>
            </div>

            <div className={`grid gap-3.5 ${isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
              {preset.services.map((srv, idx) => (
                <div key={idx} className={`rounded-2xl border ${theme.cardBorder} bg-[#222222] transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden group`}>
                  <div className="h-36 w-full overflow-hidden relative">
                    <img
                      src={srv.image}
                      alt={srv.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                    <div className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg ${theme.badgeBg} ${theme.accentText} font-bold flex items-center justify-center text-[10px] shadow-md border ${theme.cardBorder}`}>
                      {(srv as { badge?: string }).badge || `Option #${idx + 1}`}
                    </div>
                    <div className="absolute bottom-2 left-2.5 right-2.5 text-white font-bold text-xs leading-tight drop-shadow-md font-serif">
                      {srv.title}
                    </div>
                  </div>
                  <div className="p-3.5">
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{srv.desc}</p>
                    <button
                      onClick={onOpenBooking}
                      className={`mt-2.5 text-[11px] font-bold ${theme.accentText} flex items-center gap-1 group-hover:translate-x-1 transition-transform`}
                    >
                      Book / Order Now →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. ABOUT & CREDENTIALS CARD */}
        {showAll && (
          <section className={`bg-[#222222] border ${theme.cardBorder} rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-xl`}>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider font-serif">About {lead.name}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Welcome to <span className="font-bold text-white">{lead.name}</span> — {lead.city}'s premier {preset.nicheCategory.toLowerCase()} destination. Rated <span className="font-bold text-amber-400">{lead.rating ?? 4.8}/5 stars</span> from over <span className="font-bold text-white">{lead.reviewsCount ?? 334}+ verified reviews</span>. Located at {lead.address}, we deliver uncompromised quality, authentic flavors, and exceptional hospitality.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-bold pt-1">
              <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> 100% Quality & Hygiene Guaranteed</span>
              <span className="flex items-center gap-1 text-amber-300"><ShieldCheck className="h-3.5 w-3.5" /> Certified Local Favorite</span>
            </div>
          </section>
        )}

        {/* 5. WHY GUESTS CHOOSE US SECTION */}
        {showAll && (
          <section className="space-y-3 pt-2">
            <div className={`border-b ${theme.headerBorder} pb-2`}>
              <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2 font-serif">
                <ShieldCheck className="h-4 w-4 text-amber-400" /> Why Guests Choose {lead.name}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className={`bg-[#222222] border ${theme.cardBorder} p-3.5 rounded-xl shadow-md space-y-1`}>
                <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-2">
                  <MapPin className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-xs text-white">Prime Location</h4>
                <p className="text-[10.5px] text-slate-400 leading-tight">Located at {lead.address} with quick access to landmarks.</p>
              </div>

              <div className={`bg-[#222222] border ${theme.cardBorder} p-3.5 rounded-xl shadow-md space-y-1`}>
                <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-xs text-white">100% Pure & Authentic</h4>
                <p className="text-[10.5px] text-slate-400 leading-tight">Dedicated hygienic kitchen with fresh ingredients daily.</p>
              </div>

              <div className={`bg-[#222222] border ${theme.cardBorder} p-3.5 rounded-xl shadow-md space-y-1`}>
                <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-2">
                  <Utensils className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-xs text-white">Multi-Cuisine Variety</h4>
                <p className="text-[10.5px] text-slate-400 leading-tight">North Indian, South Indian, Chinese & Signature Thalis.</p>
              </div>

              <div className={`bg-[#222222] border ${theme.cardBorder} p-3.5 rounded-xl shadow-md space-y-1`}>
                <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-2">
                  <Heart className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-xs text-white">Family Friendly AC</h4>
                <p className="text-[10.5px] text-slate-400 leading-tight">Spacious AC dining for families, parties & celebrations.</p>
              </div>
            </div>
          </section>
        )}

        {/* 6. REALTIME INFINITE ANIMATED LOOP FOR REVIEWS */}
        {(showAll || tab === "reviews") && (
          <section className="space-y-3 pt-2 overflow-hidden">
            <div className={`flex items-center justify-between border-b ${theme.headerBorder} pb-2`}>
              <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2 font-serif">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> What Guests Say ({lead.reviewsCount ?? 334}+ Reviews)
              </h3>
              <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">{lead.rating ?? 4.8}★ Rating</span>
            </div>

            <div className="relative overflow-hidden py-1">
              <motion.div
                animate={{ x: [0, -800] }}
                transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
                className="flex items-center gap-4 whitespace-normal"
              >
                {[...preset.reviews, ...preset.reviews, ...preset.reviews].map((rev, idx) => (
                  <div key={idx} className={`w-[280px] shrink-0 p-4 rounded-2xl border ${theme.cardBorder} bg-[#222222] shadow-md hover:border-amber-500/60 transition-all`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-7 w-7 rounded-full ${theme.badgeBg} ${theme.accentText} font-bold text-xs flex items-center justify-center uppercase border border-amber-500/30`}>
                          {rev.author[0]}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white font-serif">{rev.author}</div>
                          <div className="text-[9px] text-amber-400 font-sans">{rev.source || "Google Review"}</div>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-amber-400 text-xs">
                        {"★".repeat(rev.rating)}
                      </div>
                    </div>
                    <p className="text-[11.5px] text-slate-300 italic font-sans leading-relaxed">"{rev.text}"</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </section>
        )}

        {/* 7. INTERACTIVE FAQ ACCORDION SECTION */}
        {(showAll || tab === "faq") && (
          <section className="space-y-3 pt-2">
            <div className={`border-b ${theme.headerBorder} pb-2`}>
              <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2 font-serif">
                <Layers className={`h-4 w-4 ${theme.accentText}`} /> Frequently Asked Questions
              </h3>
            </div>

            <div className="space-y-2">
              {preset.faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className={`border ${theme.cardBorder} rounded-xl bg-[#222222] overflow-hidden shadow-md`}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-3 text-left flex items-center justify-between font-bold text-xs text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className={`h-4 w-4 ${theme.accentText} shrink-0`} /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className={`px-3 pb-3 pt-0 text-[11.5px] text-slate-300 leading-relaxed font-sans border-t ${theme.headerBorder} bg-slate-900/50`}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 8. REALTIME GOOGLE MAPS LOCATION EMBED SECTION */}
        {(showAll || tab === "contact") && (
          <section className="space-y-3 pt-2">
            <h3 className={`font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b ${theme.headerBorder} pb-2 font-serif`}>
              <MapPin className={`h-4 w-4 ${theme.accentText}`} /> Realtime Location & Google Maps
            </h3>

            <div className={`p-4 rounded-xl border ${theme.cardBorder} bg-[#222222] shadow-md space-y-3`}>
              <div className="flex items-start gap-2.5 text-xs text-slate-200">
                <MapPin className={`h-4 w-4 ${theme.accentText} shrink-0 mt-0.5`} />
                <div>
                  <div className="font-bold text-white font-serif">{lead.name}</div>
                  <div className="text-slate-300">{lead.address}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <Phone className={`h-4 w-4 ${theme.accentText} shrink-0`} />
                <a href={`tel:${cleanPhone}`} className={`font-bold ${theme.accentText} hover:underline`}>{lead.phone || "+91 95577 30531"}</a>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <Clock className={`h-4 w-4 ${theme.accentText} shrink-0`} />
                <span className="text-slate-300">Monday – Sunday: 07:00 AM – 12:00 AM (Breakfast, Lunch & Dinner)</span>
              </div>

              {/* REAL INTERACTIVE GOOGLE MAPS EMBED IFRAME */}
              <div className="h-44 sm:h-52 w-full rounded-2xl overflow-hidden border border-slate-700 shadow-inner relative bg-slate-900">
                <iframe
                  title={`${lead.name} Google Map`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(lead.name + " " + lead.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                />
              </div>

              <div className="flex justify-end pt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + " " + lead.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 text-xs font-bold ${theme.accentText} hover:underline`}
                >
                  <Navigation className="h-3.5 w-3.5" /> Get Driving Directions on Google Maps →
                </a>
              </div>
            </div>
          </section>
        )}

        {/* 9. FOOTER */}
        {showAll && (
          <footer className="pt-6 pb-4 border-t border-slate-800 text-center space-y-2">
            <div className="font-bold text-xs text-amber-400 font-serif">{lead.name}</div>
            <div className="text-[10.5px] text-slate-400 font-sans">© {new Date().getFullYear()} {lead.name}. All rights reserved. • Heritage Dining & Premium Local Site</div>
          </footer>
        )}
      </div>

      {/* MOBILE BOTTOM CTA BAR */}
      <div className="sticky bottom-0 inset-x-0 bg-stone-950 border-t border-amber-900/60 p-2.5 flex items-center justify-around z-20 shadow-2xl">
        <a href={`tel:${cleanPhone}`} className="flex flex-col items-center gap-0.5 text-slate-300 hover:text-amber-400 transition-colors">
          <Phone className="h-4 w-4 text-amber-400" />
          <span className="text-[10px] font-bold">Call</span>
        </a>
        <button onClick={onOpenBooking} className="flex flex-col items-center gap-0.5 text-slate-300 hover:text-amber-400 transition-colors">
          <MessageSquare className="h-4 w-4 text-emerald-400" />
          <span className="text-[10px] font-bold">WhatsApp</span>
        </button>
        <button onClick={onOpenBooking} className="flex flex-col items-center gap-0.5 text-slate-300 hover:text-amber-400 transition-colors">
          <Calendar className="h-4 w-4 text-amber-400" />
          <span className="text-[10px] font-bold">Reserve</span>
        </button>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + " " + lead.address)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-0.5 text-slate-300 hover:text-amber-400 transition-colors">
          <Navigation className="h-4 w-4 text-sky-400" />
          <span className="text-[10px] font-bold">Directions</span>
        </a>
      </div>
    </div>
  );
}

/* ============================================================================
   NICHE PRESET DETECTION ENGINE WITH ROYAL LUXURY RESTAURANT & NICHE THEMES
   ============================================================================ */
function getNichePreset(category: string, name: string) {
  const cat = `${category} ${name}`.toLowerCase();

  // 1. Restaurant / Cafe / Dining / Fast Food
  if (cat.includes("restau") || cat.includes("cafe") || cat.includes("burg") || cat.includes("food") || cat.includes("dini") || cat.includes("pizz") || cat.includes("baker") || cat.includes("biryan") || cat.includes("thali") || cat.includes("veg") || cat.includes("nawaab")) {
    return {
      nicheCategory: "Artisan Dining & Smashed Kitchen",
      icon: Utensils,
      heroImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
      heroTitle: "Artisan Smashed Delicacies, Bold Flavors & Zero Guilt",
      heroSub: "Smashed fresh on the flat-top to lock in ultimate juiciness under a caramelized crust. Crafted fresh with 100% organic ingredients.",
      trustBadges: ["100% Organic Ingredients", "FSSAI Certified 5★", "Instant WhatsApp Order"],
      theme: {
        bodyBg: "bg-[#0F070A]",
        headerBg: "bg-[#1C0A10]/95 text-white",
        headerBorder: "border-red-500/40",
        cardBorder: "border-red-500/30",
        badgeBg: "bg-red-500/20 text-red-400",
        accentText: "text-amber-400",
        ctaBtn: "bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-black shadow-lg shadow-red-500/20",
        tickerBg: "bg-[#4C0016]",
        tickerText: "text-amber-300 font-mono font-bold"
      },
      ctaPrimary: "Order / Reserve Table",
      ctaSecondary: "View Artisan Menu",
      schemaType: "Restaurant",
      services: [
        { title: "Signature Artisan Double Smashed Burger", desc: "Dual prime patties smashed hot on the flat-top, melted cheddar, grilled onions & signature chili honey glaze.", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80", badge: "Chef's Special ★" },
        { title: "Fully Loaded Cheesy Bacon & Mushroom Smash", desc: "Crispy caramelized patty topped with extra melted cheese, sautéed mushrooms & smoked pepper relish.", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80", badge: "Most Loved" },
        { title: "Crispy Golden Fries & Spicy Dip Platter", desc: "Hand-cut skin-on fries tossed in peri-peri spices, served with truffle mayo & house dip.", image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80", badge: "Hot & Crispy" },
        { title: "Signature Royal Maharaja Veg Thali", desc: "A royal platter featuring Dal Makhani, Shahi Paneer, Mix Veg, Pulao, Raita, Butter Naan & Sweet.", image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80", badge: "Pure Veg Classic" },
        { title: "Paneer Teen Zayka Tandoori Tikka", desc: "Tri-color marinated paneer grilled in tandoor with three signature aromatic spice marinades.", image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=400&q=80", badge: "Tandoori Special" },
        { title: "Craft Thick Shakes & Fresh Desserts", desc: "Belgian Chocolate, Mango Alphonso & Berry Blast shakes topped with fresh cream & cherries.", image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80", badge: "Sweet Treats" }
      ],
      reviews: [
        { author: "Rajesh Kumar", rating: 5, text: "The double smashed burger was out of this world! Crunchy caramelized crust with juicy flavor in every bite.", source: "Local Guide · Google Review" },
        { author: "Priya Sharma", rating: 5, text: "Best food experience in town! Super clean kitchen, fast WhatsApp table reservation, and incredible taste.", source: "TripAdvisor Review" },
        { author: "Michael Thompson", rating: 5, text: "As a food blogger, I've tried burgers worldwide. This smashed kitchen stands right up with top global spots!", source: "Food Critic · Google Review" }
      ],
      faqs: [
        { q: "What makes your smashed kitchen unique?", a: "We smash prime patties hot on the flat-top at 400°F to create a caramelized crispy edge while sealing in 100% natural juices." },
        { q: "What are your operating hours?", a: "We are open daily from 11:00 AM to 12:00 AM midnight." },
        { q: "Do you offer pure vegetarian & Jain options?", a: "Yes! We have a dedicated 100% pure vegetarian section prepared in a separate clean kitchen station." },
        { q: "How do I reserve a table or order takeaway?", a: "Click 'Order / Reserve Table' to connect directly on WhatsApp with instant confirmation!" }
      ]
    };
  }

  // 2. Dental Clinic / Dentist (Cyan & Medical Teal Theme)
  if (cat.includes("dent") || cat.includes("teeth") || cat.includes("orthodont")) {
    return {
      nicheCategory: "Dental Clinic",
      icon: Stethoscope,
      heroImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
      heroTitle: "Pain-Free Dental Care & Celebrity Smile Designs",
      heroSub: "Advanced laser dentistry, painless root canals, and invisible aligners. Trusted by over 5,000+ happy patients in your city.",
      trustBadges: ["Google 4.8★ Verified", "Certified Orthodontist", "0% EMI Available"],
      theme: {
        bodyBg: "bg-cyan-50/30",
        headerBg: "bg-white/95",
        headerBorder: "border-cyan-100",
        cardBorder: "border-cyan-200",
        badgeBg: "bg-cyan-50",
        accentText: "text-cyan-700",
        ctaBtn: "bg-cyan-600 hover:bg-cyan-700 text-white",
        tickerBg: "bg-cyan-950",
        tickerText: "text-cyan-300"
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
        { author: "Dr. Ananya Sharma", rating: 5, text: "Got my aligners done here. Super smooth process with zero discomfort. Highly recommend!", source: "Google Review" },
        { author: "Vikram Mehta", rating: 5, text: "Extremely clean clinic and doctor explains every procedure calmly. Painless root canal done.", source: "Google Review" },
        { author: "Priya Malhotra", rating: 5, text: "The teeth whitening session gave amazing instant results for my wedding!", source: "Practo Review" }
      ],
      faqs: [
        { q: "Is root canal treatment really painless here?", a: "Yes! We use advanced rotary endodontics and computerized local anesthesia so you feel zero pain throughout." },
        { q: "How long does teeth whitening last?", a: "With basic care, laser whitening results last 12 to 24 months. We also provide a complimentary touch-up kit." },
        { q: "Do you offer 0% EMI payment options?", a: "Yes, we support flexible 0% interest monthly installments for aligners, implants, and smile makeovers." },
        { q: "What are the clinic timings?", a: "We are open Monday to Saturday 9:30 AM to 8:30 PM. Sunday appointments are available on prior request." }
      ]
    };
  }

  // 3. Doctor / General Medical Clinic / Hospital (Emerald & Healing Teal Theme)
  if (cat.includes("doct") || cat.includes("clinic") || cat.includes("hospit") || cat.includes("health") || cat.includes("physician") || cat.includes("dermat") || cat.includes("eye")) {
    return {
      nicheCategory: "Medical Clinic",
      icon: Stethoscope,
      heroImage: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=800&q=80",
      heroTitle: "Expert Compassionate Medical Consultation & Care",
      heroSub: "Comprehensive health checkups, specialist consultation, and diagnostic care with zero OPD waiting time.",
      trustBadges: ["NABH Accredited Clinic", "15+ Years Practice", "Same-Day Appointment"],
      theme: {
        bodyBg: "bg-emerald-50/30",
        headerBg: "bg-white/95",
        headerBorder: "border-emerald-100",
        cardBorder: "border-emerald-200",
        badgeBg: "bg-emerald-50",
        accentText: "text-emerald-700",
        ctaBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
        tickerBg: "bg-emerald-950",
        tickerText: "text-emerald-300"
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
        { author: "Rajesh Kumar", rating: 5, text: "Doctor gave genuine advice without prescribing unnecessary tests. Very polite staff.", source: "Google Review" },
        { author: "Pooja Malhotra", rating: 5, text: "WhatsApp booking saved us 2 hours in waiting room. Very efficient system!", source: "Google Review" },
        { author: "Sunil Verma", rating: 5, text: "Great experience for my parents' routine health checkup.", source: "Practo Review" }
      ],
      faqs: [
        { q: "How do I book a same-day OPD slot?", a: "Click the WhatsApp button or call direct. Slots are confirmed instantly in under 1 minute." },
        { q: "Are home visits available for senior citizens?", a: "Yes, doctor visits and home blood sample collection can be scheduled for elderly patients." },
        { q: "Do you accept health insurance?", a: "We provide cashless assistance for empaneled insurance providers and detailed reimbursement bills." },
        { q: "What should I bring for my first consultation?", a: "Please carry any previous medical records, prescriptions, and a list of current medications." }
      ]
    };
  }

  // 4. Real Estate / Property Dealer / Realtor (Luxury Navy & Gold Theme)
  if (cat.includes("prop") || cat.includes("real") || cat.includes("estate") || cat.includes("broker") || cat.includes("realt") || cat.includes("flat") || cat.includes("plot") || cat.includes("house")) {
    return {
      nicheCategory: "Real Estate Brokerage",
      icon: Building2,
      heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      heroTitle: "Find Premium Verified Properties & Smart Investments",
      heroSub: "Buy, sell, or rent luxury apartments, villas, and commercial spaces with 100% verified documentation and zero hidden brokerage.",
      trustBadges: ["RERA Approved Advisor", "100% Verified Legal Titles", "0% Extra Hidden Fee"],
      theme: {
        bodyBg: "bg-indigo-50/30",
        headerBg: "bg-white/95",
        headerBorder: "border-indigo-100",
        cardBorder: "border-indigo-200",
        badgeBg: "bg-indigo-50",
        accentText: "text-indigo-800",
        ctaBtn: "bg-indigo-700 hover:bg-indigo-800 text-white",
        tickerBg: "bg-slate-950",
        tickerText: "text-amber-300"
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
        { author: "Karan Patel", rating: 5, text: "Found a dream 3BHK flat in prime area within 10 days! Honest advice and transparent paperwork.", source: "Verified Buyer" },
        { author: "Sujata Bose", rating: 5, text: "Helped sell my property at market valuation quickly. Highly professional broker.", source: "Property Owner" },
        { author: "Vikram Rathi", rating: 5, text: "Smooth home loan processing and transparent site visits.", source: "Google Review" }
      ],
      faqs: [
        { q: "Are all listed properties RERA registered?", a: "Yes, 100% of our residential and commercial projects are RERA registered with clear titles." },
        { q: "How do I schedule a site visit?", a: "Click 'Schedule Site Visit' or WhatsApp us. We arrange free cab pickup and drop for property visits." },
        { q: "Do you help with home loans?", a: "Yes, we have tie-ups with HDFC, SBI, ICICI, and Axis Bank for fast 48-hour loan approval." },
        { q: "What is your brokerage fee structure?", a: "We maintain complete transparency. Zero brokerage on new developer projects." }
      ]
    };
  }

  // 5. Salon / Beauty / Spa (Elegant Rose & Blush Pink Theme)
  if (cat.includes("salon") || cat.includes("spa") || cat.includes("beaut") || cat.includes("hair") || cat.includes("makeup") || cat.includes("nail") || cat.includes("barber")) {
    return {
      nicheCategory: "Luxury Beauty & Salon",
      icon: Scissors,
      heroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
      heroTitle: "Luxury Styling, Hair Care & Glowing Skin Treatments",
      heroSub: "Experience premium grooming, organic facials, and bridal makeovers by certified master stylists.",
      trustBadges: ["Imported Organic Products", "Certified Senior Stylists", "100% Sanitized Tools"],
      theme: {
        bodyBg: "bg-rose-50/30",
        headerBg: "bg-white/95",
        headerBorder: "border-rose-100",
        cardBorder: "border-rose-200",
        badgeBg: "bg-rose-50",
        accentText: "text-rose-700",
        ctaBtn: "bg-rose-600 hover:bg-rose-700 text-white",
        tickerBg: "bg-rose-950",
        tickerText: "text-rose-300"
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
        { author: "Priya Varma", rating: 5, text: "The hair spa and Keratin treatment transformed my hair! Very polite staff and clean salon.", source: "Google Review" },
        { author: "Rohan Das", rating: 5, text: "Best haircut in town. Booking appointment on WhatsApp saved me from waiting.", source: "Google Review" },
        { author: "Shweta Nair", rating: 5, text: "Amazing bridal makeup done for my wedding!", source: "Bridal Review" }
      ],
      faqs: [
        { q: "Is prior booking required?", a: "Prior slot booking via WhatsApp is recommended to skip weekend waiting times." },
        { q: "What brands do you use for hair & skin?", a: "We exclusively use imported dermatologist-tested organic brands like L'Oreal Professional, Schwarzkopf, and Cheryl's." },
        { q: "Do you offer bridal makeup packages?", a: "Yes, we provide HD Airbrush bridal packages including trial sessions, hair draping, and nail art." },
        { q: "What are your sanitation standards?", a: "All scissors, combs, and towels undergo UV sterilization after every client visit." }
      ]
    };
  }

  // 6. Gym / Fitness (Vibrant Red & Cyber Dark Theme)
  if (cat.includes("gym") || cat.includes("fit") || cat.includes("workout") || cat.includes("crossfit") || cat.includes("yoga")) {
    return {
      nicheCategory: "Fitness & Training Center",
      icon: Dumbbell,
      heroImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
      heroTitle: "Transform Your Fitness, Build Muscle & Burn Fat",
      heroSub: "Train with certified fitness coaches using state-of-the-art equipment, functional crossfit, and custom diet plans.",
      trustBadges: ["Certified Personal Trainers", "Imported Equipment", "Free 3-Day Trial Pass"],
      theme: {
        bodyBg: "bg-red-50/30",
        headerBg: "bg-white/95",
        headerBorder: "border-red-100",
        cardBorder: "border-red-200",
        badgeBg: "bg-red-50",
        accentText: "text-red-700",
        ctaBtn: "bg-red-600 hover:bg-red-700 text-white",
        tickerBg: "bg-slate-950",
        tickerText: "text-red-400"
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
        { author: "Manish Joshi", rating: 5, text: "Lost 14 kg in 4 months! Excellent equipment and trainers push you every single day.", source: "Member Review" },
        { author: "Simran Kaur", rating: 5, text: "Super clean gym with female-friendly environment. Love the group HIIT classes!", source: "Member Review" },
        { author: "Aakash Jain", rating: 5, text: "Best gym infrastructure and friendly trainers.", source: "Google Review" }
      ],
      faqs: [
        { q: "How do I claim my 3-day free trial pass?", a: "Simply click 'Claim Free Pass' to register via WhatsApp. Show your pass at reception!" },
        { q: "Are personal trainers included in membership?", a: "General floor trainers assist all members. 1-on-1 dedicated Personal Training packages are available separately." },
        { q: "What are gym operating hours?", a: "We open early at 5:30 AM to 10:30 PM (Monday to Saturday) and 7:00 AM to 1:00 PM on Sundays." },
        { q: "Is diet planning included?", a: "Yes, every quarterly and annual membership includes a personalized nutritionist consultation." }
      ]
    };
  }

  // 7. General Local Business Fallback (Violet & Deep Indigo Theme)
  return {
    nicheCategory: category || "Local Business",
    icon: Building2,
    heroImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    heroTitle: "Top-Rated Local Service & Guaranteed Quality",
    heroSub: `Serving ${name} customers in ${category} with transparent pricing, certified experts, and 100% satisfaction guarantee.`,
    trustBadges: ["Google 4.8★ Verified", "Certified Professionals", "Fast Service"],
    theme: {
      bodyBg: "bg-violet-50/30",
      headerBg: "bg-white/95",
      headerBorder: "border-violet-100",
      cardBorder: "border-violet-200",
      badgeBg: "bg-violet-50",
      accentText: "text-violet-700",
      ctaBtn: "bg-violet-600 hover:bg-violet-700 text-white",
      tickerBg: "bg-violet-950",
      tickerText: "text-violet-300"
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
      { author: "Siddharth Gupta", rating: 5, text: "Outstanding service! Prompt response on WhatsApp and completed the job cleanly.", source: "Google Review" },
      { author: "Ritu Verma", rating: 5, text: "Very reliable local business. Fair pricing and friendly staff.", source: "Google Review" },
      { author: "Deepak Sharma", rating: 5, text: "Professional staff and great value for money.", source: "Verified Customer" }
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
   PROMPT BUILDER WITH RICH SPECIFICITY & HIGH-CONVERTING SCHEMA
   ============================================================================ */
function buildPrompt(
  l: RankedLead,
  platform: string,
  preset: ReturnType<typeof getNichePreset>,
  style: "crav" | "madre" | "classic" = "crav",
  gymStyle: "phive" | "buckler" | "classic" = "phive"
): string {
  const name = l.name;
  const niche = l.category;
  const phone = l.phone ?? "+91 95577 30531";
  const whatsapp = l.whatsapp ?? phone;
  const addr = l.address;
  const rating = l.rating ?? 4.8;
  const reviews = l.reviewsCount ?? 334;
  const gap = l.audit.biggestGap;
  const waClean = whatsapp.replace(/\D/g, "");

  const isRest = `${niche} ${name}`.toLowerCase().match(/restau|cafe|burg|food|dini|pizz|baker|biryan|thali|veg/);
  const isGym = `${niche} ${name}`.toLowerCase().match(/gym|fitn|crossfit|workout|health club|training|pilates|physique|muscle|iron/);

  if (isGym && gymStyle === "buckler") {
    return `You are crafting a world-class, ultra-luxury, commercial Buckler Fitness Gym Ecosystem landing page for "${name}", located in ${l.city}.

# CLIENT BUSINESS PROFILE
- Business Name: ${name}
- Industry Niche: ${niche} (Commercial Gym & Fitness Ecosystem)
- Address: ${addr}
- City: ${l.city}
- Direct Phone: ${phone}
- WhatsApp Catalog & Equipment Portal: ${whatsapp}
- Google Reputation: ${rating}★ Stars (${reviews}+ Verified Reviews)
- Audit Gap Solved: ${gap} (Est. Revenue Impact: ₹${(l.audit.estLostRevenuePerMonth || 45000).toLocaleString()}/month)

# BUCKLER GYM DESIGN SYSTEM (EXACT SOURCE CODE THEME)
- Color Palette:
  - Dark Charcoal / Espresso Background: #1a1918 / #121110
  - Luxury Gold & Bronze Accent: #cdc2b1 / #D4AF37
  - Crisp Off-White: #f8f8f8 / #ffffff
  - Pure Black Contrast: #000000
- Typography: Clean, modern sans-serif display headers with bold all-caps tags ("NOVO Catálogo 2025!", "BUCKLER 360", "NOSSAS SÉRIES", "NOSSAS MÁQUISNAS").
- Micro-Animations & Interactions: 3D card tilt & flip hover effects, infinite horizontal partner gym ticker ("BEYOND THE MACHINES"), interactive category filter tabs, continuous right-to-left verified member reviews marquee loop.

# HIGH-CONVERTING PAGE SECTIONS (BUCKLER FITNESS ECOSYSTEM LAYOUT)
1. Top Sticky Nav Bar (#121110 Dark Charcoal):
   - Gold Brand Badge "🦾 ${name.toUpperCase()}".
   - Status Badge: "⚡ REALLEADER USA PARTNER • ${l.city.toUpperCase()}".
   - Quick Action Buttons: Direct Call Button "📞 ${phone}" + WhatsApp Catalog Button.
2. Hero Section (#121110 Dark Charcoal):
   - Tagline Pill: "NOVO | Buckler Commercial Gym & Fitness Ecosystem 2025".
   - Display XL Headline: "TORNE SUA ACADEMIA INCOMPARÁVEL IN ${l.city.toUpperCase()}".
   - Subtitle: "Somos um ecossistema completo de soluções fitness de alta qualidade para ${name} em ${l.city}. Oferecemos equipamentos de alto padrão e suporte de montagem do zero."
   - Reputation Pill: "★ ${rating} Google Rated (${reviews}+ Verified Reviews) • ${l.city}".
   - Center Commercial Gym Showcase Video/Banner Container with "SOLICITAR ORÇAMENTO →" CTA overlay.
   - Dual CTAs: "📞 CALL DIRECT: ${phone}" and "💬 WHATSAPP CATALOG & PRICES".
3. Section 2 - Client Partner Logos Ticker (#121110 Dark Charcoal):
   - Continuous horizontal scrolling ticker of top partner logos ("BEYOND THE MACHINES • WORLD GYM • BODYTECH • IRONWORKS PRIME • FÁBRICA DE MONSTROS • WELLNESS CLUB").
4. Section 3 - BUCKLER 360 Ecosystem (#1a1918 Background):
   - Headline: "UMA EXPERIÊNCIA COMPLETA".
   - 5 Interactive Feature Pillar Cards: BUCKLER MACHINES, BUCKLER CARE, BUCKLER GAAS, BUCKLER TRACKING, BUCKLER CHECK-UP.
5. Section 4 - NOSSAS SÉRIES (01-04 High-Tech Equipment Series Showcase):
   - 01 SÉRIE CARDIO (Touch Screen Treadmills, Ellipticals, Rowers, Airbikes)
   - 02 SÉRIE DUET (Dual-function space-saving pin loaded strength machines)
   - 03 SÉRIE PRIME (Biomechanical plate loaded strength series with gold accents)
   - 04 SÉRIE INFINITE (Super Power Cages, Olympic Bench Racks & Urethane Plates)
6. Section 5 - NOSSAS MÁQUINAS (Filterable Product Catalog Grid):
   - Interactive Category Tabs: "Todos", "Cardio", "Pin Loaded", "Plate Loaded", "Benches & Racks", "Cable Cross".
   - Commercial Equipment Cards with Unsplash images, tag, category, and "SOLICITAR COTAÇÃO NO WHATSAPP →" button.
7. Section 6 - Verified Member Reviews Marquee Loop (#121110 Dark):
   - Continuous horizontal scrolling marquee loop (motion.div animate={{ x: [0, -1400] }}).
   - Review Cards from local gym owners & athletes praising equipment biomechanics, durability, and WhatsApp quick setup.
8. Section 7 - Dark Charcoal Footer & Live Map (#121110):
   - Embedded Google Maps Iframe for "${name}, ${addr}, ${l.city}".
   - Direct Call & WhatsApp Action Buttons.

${
  platform === "lovable" || platform === "bolt"
    ? `OUTPUT FORMAT: Single React + Tailwind CSS landing page component with full smooth interactivity. Use Unsplash photo URLs.`
    : platform === "claude-code"
      ? "OUTPUT FORMAT: Next.js 15 App Router page with Tailwind CSS and shadcn components."
      : "OUTPUT FORMAT: Self-contained index.html file with inline CSS and JS for slideshow."
}

Generate the complete production-ready code now.`;
  }

  if (isGym && gymStyle === "phive") {
    return `You are crafting a world-class, high-energy, ultra-bold Phive Fitness & Wellness Gym landing page for "${name}", located in ${l.city}.

# CLIENT BUSINESS PROFILE
- Business Name: ${name}
- Industry Niche: ${niche} (Fitness & Wellness Club)
- Address: ${addr}
- City: ${l.city}
- Direct Phone: ${phone}
- WhatsApp Membership / Free Pass: ${whatsapp}
- Google Reputation: ${rating}★ Stars (${reviews}+ Verified Reviews)
- Audit Gap Solved: ${gap} (Est. Revenue Impact: ₹${(l.audit.estLostRevenuePerMonth || 45000).toLocaleString()}/month)

# PHIVE GYM DESIGN SYSTEM (EXACT SOURCE CODE THEME)
- Color Palette:
  - Electric Yellow: #ffe000 / #ffd904
  - Dark Espresso Black: #161003 / #0f0b02
  - Light Yellow Accent: #fff4a6
  - Pure White: #ffffff
- Typography: Ultra-bold condensed uppercase headers ("PP Formula" / "Acid Grotesk" style) with handwritten brush script overlays (~ Push Your Limits ~).
- Micro-Animations: Continuous horizontal rolling headers, infinite right-to-left member review marquee loop, circular social media cutouts, 3D weight plate badges.

# HIGH-CONVERTING PAGE SECTIONS (PHIVE FITNESS LAYOUT)
1. Top Sticky Nav Bar (#161003 Dark Espresso):
   - Electric Yellow Brand Badge "⚡ ${name.toUpperCase()}".
   - Live Status Badge: "⚡ OPEN TODAY • ${l.city}".
   - Action Buttons: Direct Call Button "📞 ${phone}" + WhatsApp Pass Button.
2. Hero Section (#161003 Dark Espresso):
   - Continuous Rolling Ribbon Ticker: "${name.toUpperCase()} • PREMIUM FITNESS & WELLNESS • ${l.city.toUpperCase()}".
   - Reputation Pill: "★ ${rating} Google Rated (${reviews}+ Reviews) • ${l.city}".
   - Giant Header: "${name.toUpperCase()}".
   - Subtitle: "IT'S NOT JUST FITNESS. IT'S LIVING FULLY IN ${l.city.toUpperCase()}!".
   - Center Gym Video/Image Banner with overlay button "CLAIM FREE DAY PASS →".
   - Dual Call to Action Buttons: "📞 CALL DIRECT: ${phone}" and "💬 INSTANT WHATSAPP MEMBERSHIP".
3. Scraped Business Data Bar (#0f0b02 Dark Background):
   - Grid showing Address (${addr}), Direct Phone (${phone}), WhatsApp Status, and Rating (${rating}★, ${reviews}+ reviews).
4. Section 2 - "ACTIVATE YOUR SENSES / PUSH YOUR LIMITS" Banner (#ffe000 Electric Yellow Badge):
   - Stacked Title: "ACTIVATE YOUR SENSES" with brush overlay "~ Push Your Limits ~".
   - Subheadline detailing strength arenas, heated pool, sauna & pilates in ${l.city}.
   - CTA Button: "BOOK YOUR CLUB TOUR: ${phone}".
5. Section 3 - "WHAT YOU CAN FIND AT CLUBS" & Giant "FITNESS" Graphic:
   - Header table with 5 amenities: Heated Indoor Swimming Pool, Sauna & Jacuzzi, Weight & Cardio Room, Private Pilates Studio, Group HIIT Classes.
   - Giant "FITNESS" graphic on Electric Yellow background with 3D 25kg Olympic Weight Plate overlay.
6. Section 4 - 6 High-Impact Gym Facilities Grid:
   - Heavy Weightlifting & Powerlifting Zone
   - Heated Indoor Hydrotherapy Pool
   - Sauna, Steam & Turkish Bath Recovery
   - Private Reformer Pilates & Yoga Studio
   - High-Intensity Functional HIIT & Boxing
   - 1-on-1 Certified Personal Training
7. Section 5 - "#JOIN THE CLUBS / FOLLOW US" Banner (#ffe000 Yellow Background):
   - Black Badge: "#JOIN THE ${name.toUpperCase()} CLUBS" with overlay "~ Follow Us ~".
   - Button: "EXPLORE MEMBERSHIP PLANS →".
8. Section 6 - Circular Socials & Community Grid (#161003 Dark Espresso):
   - Headline: "KEEP UP WITH ALL THE LATEST ON OUR SOCIALS!".
   - 4 Circular Cutout Cards: IG (Yoga), FB (Hydro Pool), YT (Bench Press), TK (Personal Trainers).
9. Section 7 - Verified Indian Member Reviews Marquee Loop (#0f0b02 Dark):
   - Continuous horizontal scrolling marquee loop (motion.div animate={{ x: [0, -1400] }}).
   - Review Cards from verified local members (Aarav Mehta, Neha Sharma, Rohan Verma, Pooja Hegde, Karan Malhotra, Simran Kaur).
10. Section 8 - Dark Espresso Footer & Live Map (#161003):
   - Embedded Google Maps Iframe: Location map for "${name}, ${addr}, ${l.city}".
   - Direct Call & WhatsApp Action Buttons.

${
  platform === "lovable" || platform === "bolt"
    ? `OUTPUT FORMAT: Single React + Tailwind CSS landing page component with full smooth interactivity. Use Unsplash photo URLs.`
    : platform === "claude-code"
      ? "OUTPUT FORMAT: Next.js 15 App Router page with Tailwind CSS and shadcn components."
      : "OUTPUT FORMAT: Self-contained index.html file with inline CSS and JS for slideshow."
}

Generate the complete production-ready code now.`;
  }

  if (isRest && style === "crav") {
    return `You are crafting a world-class, high-energy, ultra-bold Artisan Smashed Burger & Dining landing page for "${name}", located in ${l.city}.

# CLIENT BUSINESS PROFILE
- Business Name: ${name}
- Industry Niche: ${niche} (Artisan Dining & Smashed Kitchen)
- Address: ${addr}
- City: ${l.city}
- Direct Phone: ${phone}
- WhatsApp Reservation / Ordering: ${whatsapp}
- Google Reputation: ${rating}★ Stars (${reviews}+ Verified Reviews)
- Audit Gap Solved: ${gap} (Est. Revenue Impact: ₹${(l.audit.estLostRevenuePerMonth || 45000).toLocaleString()}/month)

# ARTISAN DESIGN SYSTEM (EXACT CRAV SOURCE CODE THEME)
- Display Fonts: Display Headers in Google Font "Modak" (bubble retro thick serif) with white/red text-stroke (-webkit-text-stroke: 3px #ffffff / #4C0016). Subtitles & Quotes in Google Font "Mouse Memoirs".
- Color Palette:
  - Cream Beige: #F5E3CD
  - Crimson Red: #EF1624 / #f91814
  - Mustard Yellow: #FFC614
  - Dark Burgundy: #4C0016
- Section Dividers: SVG Jelly Wave Dividers between all sections (<path fill="#EF1624" d="M1536,0 H-1 V135 S184.32,65 460.8,155..." />).
- Micro-Animations: Tilted floating badge stickers (-12deg / 15deg), hero dish image with animated cartoon eye badges (<div className="w-12 h-12 bg-white rounded-full"><div className="w-5 h-5 bg-black animate-bounce" /></div>), floating ingredient cards, and infinite marquee loop.

# HIGH-CONVERTING PAGE SECTIONS (CRAV ARTISAN LAYOUT)
1. Top Sticky Nav Bar: Brand Logo "${name.split(" ")[0]}" in giant Modak font + "ORDER NOW" Red Pill Button + "MENU ≡" Outline Button.
2. Hero Section (#F5E3CD Cream):
   - Tilted Badges: "SMASHED FRESH" (-12deg) & "BOLD FLAVOR" (15deg) in Mustard Yellow #FFC614.
   - Giant Header: "THE BURGER" in Red #EF1624 with white text-stroke.
   - Center Hero Image: Artisan Smashed Double Patty with cartoon eye overlays.
   - Giant Mustard Footer Text: "${name.toUpperCase()}" in #FFC614 with dark stroke.
   - Side Callouts: "Smashed hot on the flat top, our prime patties lock in ultimate juiciness..." & "Topped with melted cheddar and signature chili honey glaze in ${l.city}."
3. Section 2 - Top Classic (#EF1624 Red Background):
   - Tilted Pill: "TOP CLASSIC ★"
   - Stacked Title: "JUICY CHEESY FULLY LOADED"
   - Red Blob CTA Button: "ORDER NOW →"
   - 3 Tilted Cards (-6deg, 0deg, 6deg): Double Smashed Patty, Cheesy Loaded Smash, Peri Peri Golden Fries.
4. Section 3 - Food That Feels Good (#f91814 Crimson Background):
   - Tilted Pill: "EXPERIENCE"
   - Giant Title: "FOOD THAT FEELS GOOD"
   - Dish image surrounded by floating stats: "450 kcal High Protein Fresh Ingredients" & "100% Organic Zero Guilt True Taste".
5. Section 4 - Pure Quality Ingredients (#F5E3CD Cream Background):
   - Tilted Pill: "PURE QUALITY"
   - Giant Title: "EVERY LAYER PACKED WITH SIGNATURE FLAVOR"
   - 4 Floating Ingredient Cards: Garden Lettuce 🥬, Vine Tomatoes 🍅, Melted Cheddar 🧀, Prime Patty 🥩.
6. Section 5 - Indian Guest Reviews Marquee Loop (#4C0016 Dark Burgundy):
   - Continuous horizontal scrolling marquee loop (motion.div animate={{ x: [0, -1400] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }}).
   - Review Cards in #F5E3CD with #FFC614 border:
     * Rajesh Sharma (Delhi • Local Guide 5★)
     * Ananya Verma (Mumbai • Food Blogger 5★)
     * Vikramaditya Singh (Jaipur • Gourmet Diner 5★)
     * Priya Patel (Ahmedabad • Verified Guest 5★)
     * Kabir Mehta (Bengaluru • Tech Lead 5★)
     * Sneha Kulkarni (Pune • Foodie 5★)
7. Section 6 - Take Away (#FFC614 Mustard Yellow Background):
   - Giant Title: "QUALITY THAT TRAVELS WITH YOU"
   - 5 Location Takeaway Cards: Berlin, London, New York, Sydney, Tokyo (Express Takeaway Zones in ${l.city}).
8. Section 7 - Footer & Live Map (#4C0016 Burgundy):
   - Section Title: "FEEL THE CHANGE"
   - WhatsApp Order Button: https://wa.me/${waClean}?text=Hi%20${encodeURIComponent(name)},%20I%20want%20to%20order%20or%20reserve%20a%20table.
   - Embedded Google Maps Iframe: Location map for "${name}, ${addr}, ${l.city}".

${
  platform === "lovable" || platform === "bolt"
    ? `OUTPUT FORMAT: Single React + Tailwind CSS landing page component with full smooth interactivity. Use Unsplash photo URLs.`
    : platform === "claude-code"
      ? "OUTPUT FORMAT: Next.js 15 App Router page with Tailwind CSS and shadcn components."
      : "OUTPUT FORMAT: Self-contained index.html file with inline CSS and JS for slideshow."
}

Generate the complete production-ready code now.`;
  }

  if (isRest && style === "madre") {
    return `You are crafting a world-class, ultra-bold, high-energy Tex-Mex & Street Food landing page for "${name}", located in ${l.city}.

# CLIENT BUSINESS PROFILE
- Business Name: ${name}
- Industry Niche: ${niche} (Tex-Mex Street Food & Cantina)
- Address: ${addr}
- City: ${l.city}
- Direct Phone: ${phone}
- WhatsApp Reservation / Ordering: ${whatsapp}
- Google Reputation: ${rating}★ Stars (${reviews}+ Verified Reviews)
- Audit Gap Solved: ${gap} (Est. Revenue Impact: ₹${(l.audit.estLostRevenuePerMonth || 45000).toLocaleString()}/month)

# BURRITO MADRE BRAND & DESIGN SYSTEM (EXACT SOURCE CODE THEME)
- Color Tokens:
  - Cream Beige Background: #FAE8DF
  - Electric Orange / Burrito Red Accent: #F83E1C
  - Cantina Emerald Green: #053626 / #034630
  - Tortilla Gold / Warm Mustard: #FFC042
  - Dark Cacao Brown: #5F0E00
- Typography System:
  - Display Headers in Google Font "Modak" / "Fredoka" (bold retro uppercase display font)
  - Subtitles & Body in Google Font "Figtree"
- Pop-Art Graphics & Characters: Anime/pop-art comic character illustrations with sunglasses, headphones, luchador masks, and roses pointing at the user.
- Floating badges: "ROLL WITH THE REAL", "REAL DEAL TEX-MEX", "FSSAI Certified", "Fast WhatsApp Pickup".

# HIGH-CONVERTING PAGE SECTIONS (BURRITO MADRE LAYOUT)
1. Top Sticky Nav Bar (#FAE8DF Cream):
   - Circular Green Ray Logo with Taco icon + "${name.toUpperCase()}" display title.
   - Contact Action Buttons: Direct Call Button "📞 ${phone}" (tel:${phone.replace(/\s/g, "")}) + WhatsApp Button "💬 WHATSAPP ORDER".
2. Hero Section (#FFC042 Tortilla Gold Background):
   - Google Rating Pill: "★ ${rating} Google Rated (${reviews}+ Reviews) • ${l.city}".
   - Giant Header: "WELCOME TO ${name.toUpperCase()}".
   - Subtitle: "ROLL WITH THE REAL • 100% Authentic Tex-Mex Fiesta Kitchen in ${l.city}!".
   - Center Pop-Art Showcase Card: "REAL DEAL TEX-MEX" - Gold-wrapped burritos, queso nachos & craft salsa.
   - Dual Call to Action Buttons: "📞 CALL DIRECT: ${phone}" and "💬 INSTANT WHATSAPP ORDER".
3. Scraped Business Data Bar (#053626 Cantina Emerald Background):
   - Grid showing Address (${addr}), Phone (${phone}), WhatsApp Pickup Status, and Rating (${rating}★, ${reviews}+ reviews).
4. 8-Item Tex-Mex Street Food Menu Showcase Grid (#FAE8DF Cream):
   - Section Title: "BURRITO MADRE MENU ★ CRAFT TEX-MEX FIESTA".
   - 8 High-Res Product Cards with instant "ORDER ON WHATSAPP →" pre-filled buttons:
     1. Classic Burrito Supreme (Gold foil-wrapped tortilla filled with seasoned steak & rice)
     2. Burrito Grande Loaded (Double stacked jumbo burrito packed with carnitas & guacamole)
     3. Chips & Housemade Salsa Verde (Crispy corn tortilla chips with green salsa)
     4. Madre Fiesta Combo Meal (Street tacos, cinnamon churros, nachos & craft horchata)
     5. Loaded Queso Nachos (Smothered in liquid cheddar & pickled jalapeños)
     6. Grilled Cheese Quesadilla (Flour tortilla with melted Jack cheese & grilled chicken)
     7. Fresh Fiesta Salad Bowl (Crisp romaine, black beans, avocado & cojita cheese)
     8. Street Taco Trio (Three soft corn tortillas with slow-roasted barbacoa & cilantro)
5. "ROLL WITH THE REAL" Banner Section (#F83E1C Electric Orange Background):
   - Giant Typography: "ROLL WITH THE REAL AT ${name.toUpperCase()}".
   - Subheadline: "No shortcuts, no fake flavors — only fresh ingredients crafted daily in ${l.city}!".
   - Action Button: "ORDER / RESERVE TABLE →".
6. Loyalty Rewards Section (#FAE8DF Cream):
   - Headline: "PROVE HOW LOYAL YOU ARE AT ${name.toUpperCase()}".
   - Subheadline: "Earn points on every order and unlock free burritos & loaded nachos!".
   - CTA Button: "CALL FOR LOYALTY PERKS: ${phone}".
7. Dark Emerald Footer & Real-Time Map (#053626 Emerald Green):
   - Giant Orange Logo Footer: "${name.toUpperCase()}".
   - Embedded Google Maps Iframe: Location for "${name}, ${addr}, ${l.city}".
   - Direct Call & WhatsApp Action Buttons.

${
  platform === "lovable" || platform === "bolt"
    ? `OUTPUT FORMAT: Single React + Tailwind CSS landing page component with full smooth interactivity. Use Unsplash photo URLs.`
    : platform === "claude-code"
      ? "OUTPUT FORMAT: Next.js 15 App Router page with Tailwind CSS and shadcn components."
      : "OUTPUT FORMAT: Self-contained index.html file with inline CSS and JS for slideshow."
}

Generate the complete production-ready code now.`;
  }

  return `You are crafting a world-class, ultra-high converting, mobile-first website for an Indian ${niche} named "${name}" located in ${l.city}.

# SCRAPED BUSINESS DATA & PROFILE
- Business Name: ${name}
- Industry Niche: ${niche} (Category: ${preset.nicheCategory})
- Full Address: ${addr}
- City: ${l.city}
- Direct Phone: ${phone}
- WhatsApp Reservation / Ordering: ${whatsapp}
- Google Reputation: ${rating}★ Stars (${reviews} verified reviews)
- Primary Audit Gap Fixed: ${gap} (Est. revenue saved: ₹${(l.audit.estLostRevenuePerMonth || 45000).toLocaleString()}/month)

# HERO & VALUE PROPOSITION
- Main Headline: "${preset.heroTitle}"
- Subheadline: "${preset.heroSub}"
- Trust Badges: ${preset.trustBadges.join(" | ")}

# DESIGN & BRAND SYSTEM (HIGH QUALITY HIGH CONVERTING)
- Architecture: 100% Mobile-First (90% traffic on 375px mobile screens). Sticky action bar & CTAs visible above fold.
- Color Palette: Standalone Niche Theme (${preset.theme.accentText}), High-contrast CTAs, Rich Luxury Accents, Dark Hero Overlays.
- Typography: Playfair Display for royal/serif headers + Poppins / Inter for body text.
- Trust Signals: Rating pill (${rating}★, ${reviews}+ reviews), "Years in Business" badge (${l.yearsInBusiness ?? 8}+ years), Google Verified badges.
- Realtime Sticky WhatsApp Button: Floating bottom-right chat bubble linking to https://wa.me/${waClean}?text=Hi%20${encodeURIComponent(name)},%20I%20would%20like%20to%20make%20a%20reservation.
- Click-to-Call Header Action: tel:${phone.replace(/\s/g, "")}

# HIGH-CONVERTING PAGE SECTIONS (In Sequential Order)
1. Sticky Header Bar: Brand Logo + ${name} + "Open Today" Live Pulse Badge + "Call Direct" Button.
2. Hero Slideshow / Cover Banner: Niche Hero Cover Image + Headline + "${preset.ctaPrimary}" WhatsApp CTA + "${preset.ctaSecondary}" Phone CTA.
3. Continuous Realtime Marquee Ticker Bar: ${rating}★ Rated (${reviews}+ Reviews) | Verified ${preset.nicheCategory} in ${l.city} | 100% Quality Guarantee.
4. Niche Specialties & Signature Items Grid (6 Cards with High-Res Unsplash Photography):
${preset.services.map((s, i) => `   ${i + 1}. [${(s as { badge?: string }).badge || "Featured"} ] ${s.title}: ${s.desc} (Image: ${s.image})`).join("\n")}
5. Customer Reviews Carousel (Realtime Infinite Loop):
${preset.reviews.map((r) => `   - "${r.text}" — ${r.author} (${r.source})`).join("\n")}
6. Why Guests Choose Us (4 Features Grid): Prime Location near landmarks | 100% Fresh & Authentic Kitchen | Multi-Cuisine | Family Friendly AC Dining.
7. Interactive FAQ Accordion: 4 key questions regarding timings (07:00 AM - 12:00 AM), pure veg / Jain options, reservations, and location.
8. Realtime Google Maps Embed: Live interactive map iframe for "${name} ${addr}" + Driving directions link.
9. Sticky Mobile CTA Bar: Call | WhatsApp | Reserve | Directions.
10. Footer: Contact Info, Hours, Social Media links, Quick Links, and Legal Copyright.

# SEO META TAGS & RICH SCHEMA SNIPPETS
- HTML Lang: en-IN
- Title: "${name} | Best ${niche} in ${l.city} | Book Table / Order Online"
- Meta Description: "Experience royal dining at ${name}. ${preset.heroSub} Located at ${addr}. Call ${phone} or book on WhatsApp."
- Keywords: "${name}, best ${niche} in ${l.city}, ${l.city} top restaurant, family dining ${l.city}, thali in ${l.city}"
- JSON-LD Structured Data:
  - Schema @type "${preset.schemaType}" & "LocalBusiness"
  - Schema @type "AggregateRating" (ratingValue: "${rating}", reviewCount: "${reviews}")
  - Schema @type "FAQPage" with 4 mainEntity questions & answers
  - Schema @type "PostalAddress" & "GeoCoordinates"

# COPY TONE
Warm, welcoming, royal, and trustworthy.

${
  platform === "lovable" || platform === "bolt"
    ? `OUTPUT FORMAT: Single React + Tailwind CSS landing page component with full smooth interactivity. Use Unsplash photo URLs.`
    : platform === "claude-code"
      ? "OUTPUT FORMAT: Next.js 15 App Router page with Tailwind CSS and shadcn components."
      : "OUTPUT FORMAT: Self-contained index.html file with inline CSS and JS for slideshow."
}

Generate the complete production-ready code now.`;
}

/* ============================================================================
   CRAV ARTISAN SMASHED BURGER & RESTAURANT WEBSITE RENDERER (EXACT SOURCE CODE STYLE)
   ============================================================================ */
function CravArtisanWebsiteRenderer({
  lead,
  preset,
  isMobile,
  waNumber,
  cleanPhone,
  onOpenBooking
}: {
  lead: RankedLead;
  preset: ReturnType<typeof getNichePreset>;
  isMobile?: boolean;
  waNumber: string;
  cleanPhone: string;
  onOpenBooking: () => void;
}) {
  const brandName = lead.name.toUpperCase();
  const phoneDisplay = lead.phone || "+91 95577 30531";

  const recipes = [
    { title: "Signature Artisan Double Smashed Patty", desc: "Dual prime patties smashed hot at 400°F on flat-top, melted cheddar & chili honey glaze.", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80", tag: "Best Seller ★" },
    { title: "Fully Loaded Cheesy Bacon & Mushroom Smash", desc: "Crispy caramelized patty topped with extra melted cheese & smoked pepper relish.", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80", tag: "Chef's Special" },
    { title: "Crispy Peri-Peri Golden Fries & Truffle Mayo", desc: "Hand-cut skin-on fries tossed in peri-peri spices, served with in-house truffle dip.", image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80", badge: "Hot & Crispy" },
    { title: "Royal Shahi Paneer & Butter Garlic Naan", desc: "Rich cashew cream gravy cooked with royal spices, served with hot tandoori naan.", image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80", tag: "Pure Veg Classic" },
    { title: "Paneer Teen Zayka Tandoori Tikka Platter", desc: "Tri-color marinated paneer grilled in tandoor with three signature aromatic marinades.", image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=400&q=80", tag: "Tandoori Special" },
    { title: "Belgian Chocolate & Alphonso Mango Thick Shake", desc: "Craft thick shake topped with real Alphonso mango pulp, fresh cream & cherries.", image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80", tag: "Sweet Treats" }
  ];

  return (
    <div className="bg-[#F5E3CD] text-[#4C0016] font-sans relative overflow-x-hidden selection:bg-[#EF1624] selection:text-white">
      {/* 1. TOP NAVBAR (BEIGE & RED WITH PROMINENT BUSINESS DETAILS & BUTTONS) */}
      <nav className="w-full flex flex-wrap items-center justify-between px-4 sm:px-10 py-3.5 bg-[#F5E3CD] sticky top-0 z-40 border-b border-[#4C0016]/15 shadow-md gap-3">
        <a href="#hero" className="font-modak text-2xl sm:text-4xl text-[#EF1624] text-stroke-180 hover:scale-105 transition-transform tracking-wider uppercase truncate">
          {lead.name}
        </a>
        <div className="flex items-center gap-2 sm:gap-3 font-mouse-memoirs">
          <a
            href={`tel:${cleanPhone}`}
            className="flex items-center gap-1.5 bg-[#4C0016] text-[#FFC614] px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-base font-bold uppercase hover:bg-black transition-colors shadow-sm"
          >
            <Phone className="h-3.5 w-3.5" /> <span>{phoneDisplay}</span>
          </a>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to place an order.`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-[#EF1624] text-white px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-base font-bold uppercase hover:bg-black transition-colors shadow-sm"
          >
            <MessageSquare className="h-3.5 w-3.5" /> <span>WhatsApp Order</span>
          </a>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section id="hero" className="relative min-h-[90vh] flex flex-col justify-between items-center pt-6 sm:pt-10 pb-8 px-4 text-center overflow-hidden">
        <div className="w-full max-w-6xl mx-auto relative z-10 flex flex-col items-center">
          {/* Rating Pill */}
          <div className="inline-flex items-center gap-1.5 bg-[#4C0016] text-[#FFC614] px-4 py-1.5 rounded-full font-modak text-sm sm:text-lg mb-3 shadow-md border border-[#FFC614]">
            <span>★ {lead.rating ?? 4.8} Google Rated</span>
            <span className="text-white">({lead.reviewsCount ?? 334}+ Reviews)</span>
            <span className="text-[#FFC614]">• {lead.city}</span>
          </div>

          <motion.div
            initial={{ scale: 0.8, rotate: -12 }}
            animate={{ scale: 1, rotate: -12 }}
            className="absolute -top-4 sm:top-4 left-2 sm:left-12 bg-[#FFC614] text-[#4C0016] font-modak text-xl sm:text-4xl px-3 sm:px-6 py-1 rounded-2xl border-2 border-[#4C0016] shadow-lg transform -rotate-12 z-20"
          >
            SMASHED FRESH
          </motion.div>

          <motion.div
            initial={{ scale: 0.8, rotate: 15 }}
            animate={{ scale: 1, rotate: 15 }}
            className="absolute -top-4 sm:top-4 right-2 sm:right-12 bg-[#FFC614] text-[#4C0016] font-modak text-xl sm:text-4xl px-3 sm:px-6 py-1 rounded-2xl border-2 border-[#4C0016] shadow-lg transform rotate-15 z-20"
          >
            BOLD FLAVOR
          </motion.div>

          {/* Prominent Full Business Name Header */}
          <h1 className="font-modak text-4xl sm:text-[7vw] text-[#EF1624] text-stroke-180 leading-none tracking-tight uppercase drop-shadow-md my-2">
            {brandName}
          </h1>

          {/* Center Hero Image with Animated Cartoon Eyes */}
          <div className="relative my-3 sm:my-5 w-64 h-64 sm:w-88 sm:h-88 mx-auto group">
            <img
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
              alt={lead.name}
              className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500 rounded-full"
            />
            {/* Cartoon Eyes Animation Overlay */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-full border-2 border-[#4C0016] flex items-center justify-center shadow-md animate-bounce">
                <div className="w-3 h-3 sm:w-5 sm:h-5 bg-black rounded-full" />
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-full border-2 border-[#4C0016] flex items-center justify-center shadow-md animate-bounce delay-100">
                <div className="w-3 h-3 sm:w-5 sm:h-5 bg-black rounded-full" />
              </div>
            </div>
          </div>

          {/* Hero Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center gap-2 bg-[#4C0016] hover:bg-black text-[#FFC614] font-modak text-lg sm:text-2xl px-6 py-2.5 rounded-full border-2 border-[#FFC614] shadow-xl transition-all cursor-pointer"
            >
              <Phone className="h-4 w-4" /> CALL DIRECT: {phoneDisplay}
            </a>
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to order or reserve a table.`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#EF1624] hover:bg-black text-white font-modak text-lg sm:text-2xl px-6 py-2.5 rounded-full border-2 border-white shadow-xl transition-all cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" /> INSTANT WHATSAPP ORDER
            </a>
          </div>
        </div>

        {/* Hero Bottom Side Descriptions */}
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-xs sm:text-xl font-mouse-memoirs text-[#4C0016] tracking-wide">
          <p className="text-left max-sm:text-center font-bold">
            Smashed hot on the flat top, our prime patties lock in ultimate juiciness under a caramelized crust.
          </p>
          <p className="text-right max-sm:text-center font-bold">
            Topped with melted cheddar and our signature chili honey glaze crafted in {lead.city}.
          </p>
        </div>
      </section>

      {/* SCRAPED CLIENT DETAILS BADGE CARD BAR */}
      <section className="bg-[#4C0016] text-[#F5E3CD] py-6 px-4 sm:px-10 border-y-4 border-[#FFC614]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mouse-memoirs">
          <div className="bg-[#F5E3CD]/10 p-3 rounded-2xl border border-[#FFC614]/40">
            <span className="text-[#FFC614] font-bold text-xs uppercase block">📍 Location & Address</span>
            <span className="text-white text-sm sm:text-base font-bold truncate block">{lead.address || lead.city}</span>
          </div>
          <div className="bg-[#F5E3CD]/10 p-3 rounded-2xl border border-[#FFC614]/40">
            <span className="text-[#FFC614] font-bold text-xs uppercase block">📞 Call Direct</span>
            <span className="text-white text-sm sm:text-base font-bold truncate block">{phoneDisplay}</span>
          </div>
          <div className="bg-[#F5E3CD]/10 p-3 rounded-2xl border border-[#FFC614]/40">
            <span className="text-[#FFC614] font-bold text-xs uppercase block">💬 WhatsApp Ordering</span>
            <span className="text-white text-sm sm:text-base font-bold truncate block">Available 24/7</span>
          </div>
          <div className="bg-[#F5E3CD]/10 p-3 rounded-2xl border border-[#FFC614]/40">
            <span className="text-[#FFC614] font-bold text-xs uppercase block">⭐ Rating & Reviews</span>
            <span className="text-white text-sm sm:text-base font-bold truncate block">{lead.rating ?? 4.8}★ ({lead.reviewsCount ?? 334}+ Reviews)</span>
          </div>
        </div>
      </section>

      {/* JELLY WAVE DIVIDER 1 */}
      <div className="w-full overflow-hidden leading-none z-20 relative">
        <svg className="w-full h-16 sm:h-28" viewBox="0 0 1536 300" fill="none" preserveAspectRatio="none">
          <path d="M1536,0 H-1 V135 S184.32,65 460.8,155 S860.16,105 1121.28,137 S1413.12,105 1536,105 V0" fill="#EF1624" />
        </svg>
      </div>

      {/* 3. SECTION 2: DIVERSE SIGNATURE RECIPES SHOWCASE (RED BACKGROUND #EF1624) */}
      <section className="bg-[#EF1624] text-white py-12 px-4 sm:px-10 text-center relative overflow-hidden">
        <div className="inline-block bg-[#FFC614] text-[#4C0016] font-modak text-lg sm:text-2xl px-5 py-1 rounded-full border-2 border-white transform -rotate-5 mb-3 shadow-lg">
          SIGNATURE RECIPES & SPECIALTIES ★
        </div>

        <h2 className="font-modak text-4xl sm:text-8xl text-white text-stroke-red leading-none mb-3 uppercase">
          JUICY CHEESY FULLY LOADED
        </h2>

        <p className="max-w-2xl mx-auto font-mouse-memoirs text-xl sm:text-3xl text-[#F5E3CD] leading-snug mb-8">
          {lead.name} is back and bolder than ever. Honoring our rich culinary roots, we bring you signature recipes — hot, fresh & fully loaded in {lead.city}!
        </p>

        {/* 6 Diverse Recipe Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {recipes.map((rec, idx) => (
            <div
              key={idx}
              className="bg-[#F5E3CD] p-4 rounded-3xl border-4 border-[#4C0016] shadow-xl flex flex-col justify-between transform hover:scale-105 transition-transform duration-300"
            >
              <div>
                <div className="relative overflow-hidden rounded-2xl mb-3 h-48 sm:h-52">
                  <img src={rec.image} alt={rec.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-[#EF1624] text-white font-modak text-xs px-3 py-1 rounded-full shadow-md">
                    {rec.tag || rec.badge}
                  </span>
                </div>
                <h3 className="font-modak text-xl text-[#EF1624] uppercase mb-1">{rec.title}</h3>
                <p className="font-mouse-memoirs text-base text-[#4C0016] mb-3 leading-tight">{rec.desc}</p>
              </div>

              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to order ${rec.title}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-[#FFC614] hover:bg-[#4C0016] hover:text-white text-[#4C0016] font-modak text-lg rounded-2xl border-2 border-[#4C0016] transition-colors uppercase cursor-pointer block"
              >
                ORDER THIS RECIPE →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* JELLY WAVE DIVIDER 2 */}
      <div className="w-full overflow-hidden leading-none z-20 relative">
        <svg className="w-full h-16 sm:h-28" viewBox="0 0 1536 300" fill="none" preserveAspectRatio="none">
          <path d="M1536,0 H-1 V135 S184.32,65 460.8,155 S860.16,105 1121.28,137 S1413.12,105 1536,105 V0" fill="#f91814" />
        </svg>
      </div>

      {/* 4. SECTION 3: FOOD THAT FEELS GOOD (#f91814 Crimson Red Background) */}
      <section className="bg-[#f91814] text-white py-14 px-4 sm:px-10 text-center relative overflow-hidden">
        <div className="inline-block bg-[#FFC614] text-[#4C0016] font-modak text-lg sm:text-2xl px-5 py-1 rounded-full border-2 border-white transform -rotate-8 mb-4 shadow-lg">
          EXPERIENCE
        </div>

        <h2 className="font-modak text-4xl sm:text-8xl text-[#F5E3CD] text-stroke-dark leading-none uppercase mb-6">
          FOOD THAT FEELS GOOD
        </h2>

        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 my-8">
          <div className="bg-[#4C0016]/40 backdrop-blur-md p-4 rounded-2xl border-2 border-[#FFC614] text-left sm:w-64">
            <span className="font-modak text-2xl text-[#FFC614] block">450 kcal</span>
            <span className="font-mouse-memoirs text-lg text-white">High Protein • 100% Fresh Organic Ingredients</span>
          </div>

          <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto">
            <img
              src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80"
              alt="Artisan Smashed Dish"
              className="w-full h-full object-cover rounded-full border-4 border-[#FFC614] shadow-2xl"
            />
          </div>

          <div className="bg-[#4C0016]/40 backdrop-blur-md p-4 rounded-2xl border-2 border-[#FFC614] text-right sm:w-64">
            <span className="font-modak text-2xl text-[#FFC614] block">100% ORGANIC</span>
            <span className="font-mouse-memoirs text-lg text-white">Zero Guilt • True Artisanal Taste</span>
          </div>
        </div>
      </section>

      {/* JELLY WAVE DIVIDER 3 */}
      <div className="w-full overflow-hidden leading-none z-20 relative">
        <svg className="w-full h-16 sm:h-28" viewBox="0 0 1536 300" fill="none" preserveAspectRatio="none">
          <path d="M1536,0 H-1 V135 S184.32,65 460.8,155 S860.16,105 1121.28,137 S1413.12,105 1536,105 V0" fill="#F5E3CD" />
        </svg>
      </div>

      {/* 5. SECTION 4: PURE QUALITY & INGREDIENTS (#F5E3CD Cream Background) */}
      <section className="bg-[#F5E3CD] text-[#4C0016] py-14 px-4 sm:px-10 text-center relative overflow-hidden">
        <div className="inline-block bg-[#EF1624] text-white font-modak text-lg sm:text-2xl px-5 py-1 rounded-full border-2 border-[#4C0016] transform -rotate-6 mb-4 shadow-lg">
          PURE QUALITY
        </div>

        <h2 className="font-modak text-4xl sm:text-7xl text-[#EF1624] text-stroke-180 leading-tight uppercase max-w-4xl mx-auto mb-10">
          EVERY LAYER PACKED WITH SIGNATURE FLAVOR
        </h2>

        {/* 4 Floating Ingredient Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border-2 border-[#4C0016] shadow-md flex flex-col items-center hover:scale-105 transition-transform">
            <span className="text-4xl mb-2">🥬</span>
            <h4 className="font-modak text-lg text-[#EF1624]">Garden Lettuce</h4>
            <p className="font-mouse-memoirs text-xs sm:text-sm text-[#4C0016]">Crispy & Farm Fresh</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border-2 border-[#4C0016] shadow-md flex flex-col items-center hover:scale-105 transition-transform">
            <span className="text-4xl mb-2">🍅</span>
            <h4 className="font-modak text-lg text-[#EF1624]">Vine Tomatoes</h4>
            <p className="font-mouse-memoirs text-xs sm:text-sm text-[#4C0016]">Sun-Ripened Sweetness</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border-2 border-[#4C0016] shadow-md flex flex-col items-center hover:scale-105 transition-transform">
            <span className="text-4xl mb-2">🧀</span>
            <h4 className="font-modak text-lg text-[#EF1624]">Melted Cheddar</h4>
            <p className="font-mouse-memoirs text-xs sm:text-sm text-[#4C0016]">Rich Aged Cheese</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border-2 border-[#4C0016] shadow-md flex flex-col items-center hover:scale-105 transition-transform">
            <span className="text-4xl mb-2">🥩</span>
            <h4 className="font-modak text-lg text-[#EF1624]">Prime Patty</h4>
            <p className="font-mouse-memoirs text-xs sm:text-sm text-[#4C0016]">Smashed Flat-Top 400°F</p>
          </div>
        </div>
      </section>

      {/* JELLY WAVE DIVIDER 4 */}
      <div className="w-full overflow-hidden leading-none z-20 relative">
        <svg className="w-full h-16 sm:h-28" viewBox="0 0 1536 300" fill="none" preserveAspectRatio="none">
          <path d="M1536,0 H-1 V135 S184.32,65 460.8,155 S860.16,105 1121.28,137 S1413.12,105 1536,105 V0" fill="#4C0016" />
        </svg>
      </div>

      {/* 5.5. INDIAN CUSTOMER REVIEWS MARQUEE LOOP */}
      <section className="bg-[#4C0016] text-[#F5E3CD] py-12 overflow-hidden relative border-y-4 border-[#FFC614]">
        <div className="text-center mb-6">
          <div className="inline-block bg-[#EF1624] text-white font-modak text-lg sm:text-2xl px-5 py-1 rounded-full border-2 border-white transform -rotate-3 shadow-lg">
            WHAT FOODIES SAY ★
          </div>
          <h3 className="font-modak text-4xl sm:text-7xl text-[#FFC614] text-stroke-dark uppercase mt-2">
            GUEST REVIEWS & LOVE
          </h3>
        </div>

        {/* Infinite Horizontal Marquee Track */}
        <div className="flex overflow-hidden relative py-4">
          <motion.div
            animate={{ x: [0, -1400] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex gap-6 whitespace-normal shrink-0"
          >
            {[
              { author: "Rajesh Sharma", location: "Delhi • Local Guide", text: "The double smashed burger is out of this world! Melted cheddar and crispy caramelized edges in every bite. 5★ rating!", rating: "★★★★★" },
              { author: "Ananya Verma", location: "Mumbai • Food Blogger", text: "Best smashed kitchen experience! Super fast WhatsApp booking, clean standards, and unbelievable taste.", rating: "★★★★★" },
              { author: "Vikramaditya Singh", location: "Jaipur • Gourmet Diner", text: "Authentic artisanal flavor! We ordered for a family party and everyone was blown away. 100% recommended!", rating: "★★★★★" },
              { author: "Priya Patel", location: "Ahmedabad • Verified Guest", text: "So juicy, crispy & fresh! Love the peri-peri loaded fries and craft Belgian chocolate shake!", rating: "★★★★★" },
              { author: "Kabir Mehta", location: "Bengaluru • Tech Lead", text: "World class smashed patties! Easily beats top global burger spots. Will visit again every weekend!", rating: "★★★★★" },
              { author: "Sneha Kulkarni", location: "Pune • Foodie", text: "Super fast table reservation and top-notch organic ingredients. 5 Stars without doubt!", rating: "★★★★★" },
              { author: "Rajesh Sharma", location: "Delhi • Local Guide", text: "The double smashed burger is out of this world! Melted cheddar and crispy caramelized edges in every bite. 5★ rating!", rating: "★★★★★" },
              { author: "Ananya Verma", location: "Mumbai • Food Blogger", text: "Best smashed kitchen experience! Super fast WhatsApp booking, clean standards, and unbelievable taste.", rating: "★★★★★" },
              { author: "Vikramaditya Singh", location: "Jaipur • Gourmet Diner", text: "Authentic artisanal flavor! We ordered for a family party and everyone was blown away. 100% recommended!", rating: "★★★★★" },
              { author: "Priya Patel", location: "Ahmedabad • Verified Guest", text: "So juicy, crispy & fresh! Love the peri-peri loaded fries and craft Belgian chocolate shake!", rating: "★★★★★" },
              { author: "Kabir Mehta", location: "Bengaluru • Tech Lead", text: "World class smashed patties! Easily beats top global burger spots. Will visit again every weekend!", rating: "★★★★★" },
              { author: "Sneha Kulkarni", location: "Pune • Foodie", text: "Super fast table reservation and top-notch organic ingredients. 5 Stars without doubt!", rating: "★★★★★" }
            ].map((rev, idx) => (
              <div
                key={idx}
                className="bg-[#F5E3CD] text-[#4C0016] p-5 rounded-3xl border-4 border-[#FFC614] shadow-2xl w-80 sm:w-96 shrink-0 transform hover:scale-105 transition-transform"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-modak text-xl text-[#EF1624]">{rev.author}</span>
                  <span className="text-amber-600 font-bold text-sm tracking-widest">{rev.rating}</span>
                </div>
                <div className="font-mouse-memoirs text-xs text-[#EF1624] font-bold mb-2 uppercase tracking-wide">
                  {rev.location}
                </div>
                <p className="font-mouse-memoirs text-base text-[#4C0016] leading-snug">
                  "{rev.text}"
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* JELLY WAVE DIVIDER 5 */}
      <div className="w-full overflow-hidden leading-none z-20 relative">
        <svg className="w-full h-16 sm:h-28" viewBox="0 0 1536 300" fill="none" preserveAspectRatio="none">
          <path d="M1536,0 H-1 V135 S184.32,65 460.8,155 S860.16,105 1121.28,137 S1413.12,105 1536,105 V0" fill="#FFC614" />
        </svg>
      </div>

      {/* 6. SECTION 5: TAKE AWAY (#FFC614 Mustard Yellow Background) */}
      <section className="bg-[#FFC614] text-[#4C0016] py-14 px-4 sm:px-10 text-center relative overflow-hidden">
        <div className="inline-block bg-[#EF1624] text-white font-modak text-lg sm:text-2xl px-5 py-1 rounded-full border-2 border-white transform -rotate-7 mb-4 shadow-lg">
          TAKE AWAY
        </div>

        <h2 className="font-modak text-4xl sm:text-8xl text-white text-stroke-mustard leading-none uppercase mb-4">
          QUALITY THAT TRAVELS WITH YOU
        </h2>

        <p className="font-mouse-memoirs text-xl sm:text-3xl text-[#4C0016] max-w-2xl mx-auto mb-10">
          Freshly packed smash burgers ready to go wherever you crave. From our flat-top to any corner of {lead.city}!
        </p>

        {/* 5 Location / Takeaway Cards */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 max-w-5xl mx-auto">
          {["CENTRAL EXPRESS", "WEST WING", "AIRPORT DRIVE", "STATION ROAD", "HERITAGE HUB"].map((loc, idx) => (
            <div
              key={idx}
              className="bg-white/90 p-4 rounded-3xl border-3 border-[#4C0016] shadow-lg flex flex-col items-center w-40 sm:w-48 hover:scale-105 transition-transform"
            >
              <h4 className="font-modak text-lg text-[#EF1624] uppercase">{loc}</h4>
              <p className="font-mouse-memoirs text-xs text-[#4C0016]">{lead.city} Outlet</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FOOTER & EMBEDDED GOOGLE MAP WITH DIRECT CONTACT ACTIONS */}
      <footer className="bg-[#4C0016] text-[#F5E3CD] py-12 px-4 sm:px-10 text-center relative">
        <h2 className="font-modak text-4xl sm:text-8xl text-[#FFC614] text-stroke-dark uppercase mb-3">
          {brandName}
        </h2>
        <p className="font-mouse-memoirs text-xl sm:text-2xl max-w-xl mx-auto mb-6">
          Smashed for the bold, built for the hungry. Visit us at {lead.address || lead.city}!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <a
            href={`tel:${cleanPhone}`}
            className="bg-[#FFC614] hover:bg-white text-[#4C0016] font-modak text-xl sm:text-3xl px-8 py-3 rounded-full border-2 border-white shadow-xl transition-all cursor-pointer"
          >
            📞 CALL: {phoneDisplay}
          </a>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to order or reserve a table.`)}`}
            target="_blank"
            rel="noreferrer"
            className="bg-[#EF1624] hover:bg-white text-white hover:text-[#EF1624] font-modak text-xl sm:text-3xl px-8 py-3 rounded-full border-2 border-white shadow-xl transition-all cursor-pointer"
          >
            💬 WHATSAPP ORDER →
          </a>
        </div>

        {/* Embedded Google Map */}
        <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden border-4 border-[#FFC614] shadow-2xl mb-8">
          <iframe
            title={`Map for ${lead.name}`}
            width="100%"
            height="260"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps?q=${encodeURIComponent(`${lead.name}, ${lead.address || ""}, ${lead.city}`)}&output=embed`}
          />
        </div>

        <div className="border-t border-[#F5E3CD]/20 pt-6 font-mouse-memoirs text-sm sm:text-base opacity-80">
          © 2026 {lead.name} • {lead.city} • All rights reserved • Powered by ClientForge Live Preview Engine
        </div>
      </footer>
    </div>
  );
}

/* ============================================================================
   BURRITO MADRE / TEX-MEX STREET FOOD WEBSITE RENDERER
   ============================================================================ */
function BurritoMadreWebsiteRenderer({
  lead,
  preset,
  isMobile,
  waNumber,
  cleanPhone,
  onOpenBooking
}: {
  lead: RankedLead;
  preset: ReturnType<typeof getNichePreset>;
  isMobile?: boolean;
  waNumber: string;
  cleanPhone: string;
  onOpenBooking: () => void;
}) {
  const brandName = lead.name.toUpperCase();
  const phoneDisplay = lead.phone || "+91 95577 30531";

  const texMexMenu = [
    { title: "BURRITO SUPREME", desc: "Golden foil-wrapped tortilla filled with seasoned rice, beans, grilled steak & melted queso.", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=400&q=80", badge: "POPULAR" },
    { title: "BURRITO GRANDE", desc: "Double stacked jumbo burrito packed with carnitas, fresh guacamole & pico de gallo.", image: "https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?auto=format&fit=crop&w=400&q=80", badge: "BIG BITE" },
    { title: "CHIPS & SALSA VERDE", desc: "Crispy house-made corn tortilla chips served with fresh tomatillo salsa & guacamole.", image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=400&q=80", badge: "FRESH DIP" },
    { title: "MADRE FIESTA COMBO MEAL", desc: "Street tacos, crispy cinnamon churros, loaded nachos & ice-cold horchata.", image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=400&q=80", badge: "BEST VALUE" },
    { title: "LOADED QUESO NACHOS", desc: "Warm tortilla chips smothered in liquid cheddar, pickled jalapeños, sour cream & salsa.", image: "https://images.unsplash.com/photo-1582169296194-e4d644c48063?auto=format&fit=crop&w=400&q=80", badge: "CHEESY" },
    { title: "GRILLED CHEESE QUESADILLA", desc: "Large flour tortilla folded with melted Monterey Jack cheese, grilled chicken & pico.", image: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=400&q=80", badge: "HOT MELT" },
    { title: "FRESH FIESTA SALAD BOWL", desc: "Crisp romaine, black beans, sweet corn, sliced avocado, cojita cheese & cilantro lime dressing.", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80", badge: "HEALTHY" },
    { title: "STREET TACO TRIO", desc: "Three soft corn tortillas with slow-roasted barbacoa, diced onions, fresh cilantro & lime.", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80", badge: "STREET STYLE" }
  ];

  return (
    <div className="bg-[#FAE8DF] text-[#5F0E00] font-sans relative overflow-x-hidden selection:bg-[#F83E1C] selection:text-white">
      {/* 1. TOP NAVBAR */}
      <nav className="w-full flex flex-wrap items-center justify-between px-4 sm:px-10 py-3.5 bg-[#FAE8DF] sticky top-0 z-40 border-b border-[#5F0E00]/15 shadow-sm gap-3">
        <a href="#hero" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#053626] text-[#FFC042] flex items-center justify-center font-bold text-lg shadow-md border-2 border-[#F83E1C]">
            🌮
          </div>
          <span className="font-modak text-xl sm:text-3xl text-[#F83E1C] uppercase tracking-wide truncate">
            {lead.name}
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-3 font-sans">
          <a
            href={`tel:${cleanPhone}`}
            className="flex items-center gap-1.5 bg-[#053626] text-[#FFC042] px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-extrabold uppercase hover:bg-black transition-colors shadow-sm"
          >
            <Phone className="h-3.5 w-3.5" /> <span>{phoneDisplay}</span>
          </a>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to order Burrito Madre.`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-[#F83E1C] text-white px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-extrabold uppercase hover:bg-black transition-colors shadow-sm"
          >
            <MessageSquare className="h-3.5 w-3.5" /> <span>WhatsApp Order</span>
          </a>
        </div>
      </nav>

      {/* 2. HERO SECTION WITH POP-ART GRAPHIC BANNER */}
      <section id="hero" className="relative bg-[#FFC042] pt-8 sm:pt-12 pb-12 px-4 text-center border-b-4 border-[#5F0E00] overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col items-center relative z-10">
          {/* Reputation Pill */}
          <div className="inline-flex items-center gap-2 bg-[#053626] text-[#FFC042] px-4 py-1.5 rounded-full text-xs sm:text-base mb-4 shadow-lg border border-[#F83E1C]">
            <span className="font-bold">★ {lead.rating ?? 4.8} Google Rated</span>
            <span className="text-white">({lead.reviewsCount ?? 334}+ Reviews)</span>
            <span className="text-[#FFC042]">• {lead.city}</span>
          </div>

          <h1 className="font-modak text-4xl sm:text-7xl text-[#F83E1C] uppercase tracking-wide leading-tight drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] my-3">
            WELCOME TO {brandName}
          </h1>

          <p className="font-sans text-lg sm:text-2xl text-[#5F0E00] font-bold max-w-2xl mx-auto my-3">
            ROLL WITH THE REAL • 100% Authentic Tex-Mex Fiesta Kitchen in {lead.city}!
          </p>

          {/* Center Pop-Art Illustration Showcase */}
          <div className="relative my-6 w-full max-w-2xl bg-[#FAE8DF] p-6 rounded-3xl border-4 border-[#5F0E00] shadow-2xl overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#F83E1C] text-white flex items-center justify-center text-3xl font-extrabold shadow-md border-2 border-[#053626]">
                🌮
              </div>
              <div className="text-left">
                <h4 className="font-modak text-xl text-[#053626] uppercase tracking-wide">REAL DEAL TEX-MEX</h4>
                <p className="text-xs text-[#5F0E00] font-bold">Gold-Wrapped Burritos, Queso Nachos & Craft Salsa</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="bg-[#053626] text-[#FFC042] text-xs font-extrabold px-3 py-1.5 rounded-xl uppercase shadow-sm">
                FSSAI Certified
              </span>
              <span className="bg-[#F83E1C] text-white text-xs font-extrabold px-3 py-1.5 rounded-xl uppercase shadow-sm">
                Fast WhatsApp Pickup
              </span>
            </div>
          </div>

          {/* Action Call / WhatsApp Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center gap-2 bg-[#053626] hover:bg-black text-[#FFC042] font-modak text-base sm:text-xl px-6 py-3 rounded-full border-2 border-[#FFC042] shadow-xl transition-all tracking-wide"
            >
              <Phone className="h-4 w-4" /> CALL DIRECT: {phoneDisplay}
            </a>
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to order Burrito Madre.`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#F83E1C] hover:bg-black text-white font-modak text-base sm:text-xl px-6 py-3 rounded-full border-2 border-white shadow-xl transition-all tracking-wide"
            >
              <MessageSquare className="h-4 w-4" /> INSTANT WHATSAPP ORDER
            </a>
          </div>
        </div>
      </section>

      {/* 3. SCRAPED BUSINESS DATA BAR (#053626 Cantina Emerald) */}
      <section className="bg-[#053626] text-[#FAE8DF] py-6 px-4 sm:px-10 border-b-4 border-[#FFC042]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-sans">
          <div className="bg-[#FAE8DF]/10 p-3 rounded-2xl border border-[#FFC042]/30">
            <span className="text-[#FFC042] font-bold text-xs uppercase block">📍 Address & City</span>
            <span className="text-white text-sm sm:text-base font-extrabold truncate block">{lead.address || lead.city}</span>
          </div>
          <div className="bg-[#FAE8DF]/10 p-3 rounded-2xl border border-[#FFC042]/30">
            <span className="text-[#FFC042] font-bold text-xs uppercase block">📞 Phone Line</span>
            <span className="text-white text-sm sm:text-base font-extrabold truncate block">{phoneDisplay}</span>
          </div>
          <div className="bg-[#FAE8DF]/10 p-3 rounded-2xl border border-[#FFC042]/30">
            <span className="text-[#FFC042] font-bold text-xs uppercase block">💬 WhatsApp Express</span>
            <span className="text-white text-sm sm:text-base font-extrabold truncate block">Instant Order & Pickup</span>
          </div>
          <div className="bg-[#FAE8DF]/10 p-3 rounded-2xl border border-[#FFC042]/30">
            <span className="text-[#FFC042] font-bold text-xs uppercase block">⭐ Reputation</span>
            <span className="text-white text-sm sm:text-base font-extrabold truncate block">{lead.rating ?? 4.8}★ ({lead.reviewsCount ?? 334}+ Reviews)</span>
          </div>
        </div>
      </section>

      {/* 4. 8-ITEM TEX-MEX STREET FOOD MENU SHOWCASE GRID */}
      <section className="py-14 px-4 sm:px-10 bg-[#FAE8DF]">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <span className="bg-[#F83E1C] text-white font-modak text-xs sm:text-sm px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
            BURRITO MADRE MENU ★
          </span>
          <h2 className="font-modak text-4xl sm:text-6xl text-[#5F0E00] uppercase mt-3 tracking-wide drop-shadow-xs">
            CRAFT TEX-MEX FIESTA
          </h2>
          <p className="text-base sm:text-xl text-[#5F0E00] font-bold max-w-xl mx-auto mt-2">
            Freshly prepared in {lead.city} using 100% natural ingredients, gold-wrapped burritos & artisanal salsas!
          </p>
        </div>

        {/* 8 Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {texMexMenu.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-3xl border-3 border-[#5F0E00] shadow-lg flex flex-col justify-between hover:scale-105 transition-transform duration-300"
            >
              <div>
                <div className="relative overflow-hidden rounded-2xl mb-3 h-44">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-[#F83E1C] text-white font-modak text-[11px] px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-modak text-lg text-[#F83E1C] uppercase tracking-wide mb-1">{item.title}</h3>
                <p className="text-xs text-[#5F0E00] font-semibold leading-relaxed mb-3">{item.desc}</p>
              </div>

              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to order ${item.title}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-[#FFC042] hover:bg-[#053626] hover:text-white text-[#053626] font-modak text-sm tracking-wide rounded-2xl border-2 border-[#053626] transition-colors uppercase text-center block"
              >
                ORDER ON WHATSAPP →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 5. "ROLL WITH THE REAL" BANNER SECTION */}
      <section className="bg-[#F83E1C] text-white py-14 px-4 sm:px-10 text-center relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-modak text-4xl sm:text-8xl text-white uppercase leading-none tracking-wide drop-shadow-[0_6px_12px_rgba(0,0,0,0.3)] mb-4">
            ROLL WITH THE REAL
          </h2>
          <p className="text-lg sm:text-3xl font-extrabold text-[#FFC042] max-w-2xl mx-auto mb-8">
            Experience the real taste at {lead.name}. No shortcuts, no fake flavors — only fresh ingredients crafted daily in {lead.city}!
          </p>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to reserve a table.`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-[#053626] hover:bg-white hover:text-[#053626] text-[#FFC042] font-modak text-xl sm:text-3xl px-10 py-4 rounded-full border-4 border-white shadow-2xl transition-all uppercase cursor-pointer tracking-wide"
          >
            ORDER / RESERVE TABLE →
          </a>
        </div>
      </section>

      {/* 6. INDIAN GUEST REVIEWS MARQUEE LOOP (RIGHT TO LEFT) */}
      <section className="bg-[#053626] py-14 border-t-4 border-[#FFC042] overflow-hidden relative">
        <div className="text-center mb-8 px-4">
          <span className="bg-[#F83E1C] text-white font-modak text-xs sm:text-sm px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
            REAL REVIEWS FROM GUESTS ★
          </span>
          <h2 className="font-modak text-3xl sm:text-6xl text-[#FFC042] uppercase mt-2 tracking-wide drop-shadow-md">
            WHAT OUR FOODIES SAY IN {lead.city.toUpperCase()}
          </h2>
        </div>

        {/* Continuous Horizontal Marquee Loop (Right to Left) */}
        <div className="flex overflow-hidden">
          <motion.div
            animate={{ x: [0, -1400] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex gap-6 shrink-0"
          >
            {[
              { author: "Rajesh Sharma", location: "Delhi • Local Guide", text: "The Burrito Supreme is incredible! Loaded with juicy steak & melted queso. 5★ Tex-Mex in India!", rating: "★★★★★" },
              { author: "Ananya Verma", location: "Mumbai • Food Blogger", text: "Best loaded queso nachos & street tacos! Fast WhatsApp ordering and super fresh ingredients.", rating: "★★★★★" },
              { author: "Vikramaditya Singh", location: "Jaipur • Gourmet Diner", text: "Gold-wrapped burritos packed with flavor! We ordered for our family party and loved every bite.", rating: "★★★★★" },
              { author: "Priya Patel", location: "Ahmedabad • Verified Guest", text: "Crispy chips, fresh salsa verde & amazing quesadillas. 100% authentic fiesta vibes!", rating: "★★★★★" },
              { author: "Kabir Mehta", location: "Bengaluru • Tech Lead", text: "Loved the street taco trio and horchata shake! Easily the best Tex-Mex joint in town.", rating: "★★★★★" },
              { author: "Sneha Kulkarni", location: "Pune • Foodie", text: "Super fast delivery, hot & fresh burritos! Will definitely order again every weekend!", rating: "★★★★★" },
              { author: "Rajesh Sharma", location: "Delhi • Local Guide", text: "The Burrito Supreme is incredible! Loaded with juicy steak & melted queso. 5★ Tex-Mex in India!", rating: "★★★★★" },
              { author: "Ananya Verma", location: "Mumbai • Food Blogger", text: "Best loaded queso nachos & street tacos! Fast WhatsApp ordering and super fresh ingredients.", rating: "★★★★★" },
              { author: "Vikramaditya Singh", location: "Jaipur • Gourmet Diner", text: "Gold-wrapped burritos packed with flavor! We ordered for our family party and loved every bite.", rating: "★★★★★" },
              { author: "Priya Patel", location: "Ahmedabad • Verified Guest", text: "Crispy chips, fresh salsa verde & amazing quesadillas. 100% authentic fiesta vibes!", rating: "★★★★★" },
              { author: "Kabir Mehta", location: "Bengaluru • Tech Lead", text: "Loved the street taco trio and horchata shake! Easily the best Tex-Mex joint in town.", rating: "★★★★★" },
              { author: "Sneha Kulkarni", location: "Pune • Foodie", text: "Super fast delivery, hot & fresh burritos! Will definitely order again every weekend!", rating: "★★★★★" }
            ].map((rev, idx) => (
              <div
                key={idx}
                className="bg-[#FAE8DF] text-[#5F0E00] p-5 rounded-3xl border-4 border-[#FFC042] shadow-2xl w-80 sm:w-96 shrink-0 transform hover:scale-105 transition-transform"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-modak text-xl text-[#F83E1C] tracking-wide">{rev.author}</span>
                  <span className="text-[#F83E1C] font-bold text-sm tracking-widest">{rev.rating}</span>
                </div>
                <div className="text-xs text-[#053626] font-bold mb-2 uppercase tracking-wide">
                  {rev.location}
                </div>
                <p className="text-sm text-[#5F0E00] leading-snug font-semibold">
                  "{rev.text}"
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 7. LOYALTY SECTION ("PROVE HOW LOYAL YOU ARE") */}
      <section className="bg-[#FAE8DF] py-14 px-4 sm:px-10 text-center border-t-4 border-[#5F0E00]">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl border-4 border-[#053626] shadow-2xl">
          <span className="bg-[#053626] text-[#FFC042] font-modak text-xs px-4 py-1 rounded-full uppercase tracking-wide">
            MADRE REWARDS & LOYALTY ★
          </span>
          <h3 className="font-modak text-3xl sm:text-6xl text-[#F83E1C] uppercase my-3 tracking-wide drop-shadow-xs">
            PROVE HOW LOYAL YOU ARE
          </h3>
          <p className="text-sm sm:text-lg text-[#5F0E00] font-bold mb-6">
            Earn points on every order at {lead.name} and unlock free burritos, loaded nachos & craft beverages!
          </p>
          <a
            href={`tel:${cleanPhone}`}
            className="inline-block bg-[#F83E1C] text-white font-modak text-lg sm:text-2xl px-8 py-3 rounded-full border-2 border-[#5F0E00] shadow-md hover:bg-black transition-colors uppercase tracking-wide"
          >
            CALL FOR LOYALTY PERKS: {phoneDisplay}
          </a>
        </div>
      </section>

      {/* 8. DARK EMERALD FOOTER & EMBEDDED GOOGLE MAP */}
      <footer className="bg-[#053626] text-[#FAE8DF] py-12 px-4 sm:px-10 text-center relative">
        <h2 className="font-modak text-4xl sm:text-7xl text-[#FFC042] uppercase mb-3 tracking-wide drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
          {brandName}
        </h2>
        <p className="text-base sm:text-xl text-[#FAE8DF] font-bold max-w-xl mx-auto mb-6">
          Serving hot authentic Tex-Mex street food in {lead.city}. Visit us at {lead.address || lead.city}!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <a
            href={`tel:${cleanPhone}`}
            className="bg-[#FFC042] hover:bg-white text-[#053626] font-modak text-xl sm:text-3xl px-8 py-3 rounded-full border-2 border-white shadow-xl transition-all cursor-pointer tracking-wide"
          >
            📞 CALL: {phoneDisplay}
          </a>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to order Burrito Madre.`)}`}
            target="_blank"
            rel="noreferrer"
            className="bg-[#F83E1C] hover:bg-white text-white hover:text-[#F83E1C] font-modak text-xl sm:text-3xl px-8 py-3 rounded-full border-2 border-white shadow-xl transition-all cursor-pointer tracking-wide"
          >
            💬 WHATSAPP ORDER →
          </a>
        </div>

        {/* Embedded Google Map */}
        <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden border-4 border-[#FFC042] shadow-2xl mb-8">
          <iframe
            title={`Map for ${lead.name}`}
            width="100%"
            height="260"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps?q=${encodeURIComponent(`${lead.name}, ${lead.address || ""}, ${lead.city}`)}&output=embed`}
          />
        </div>

        <div className="border-t border-[#FAE8DF]/20 pt-6 text-xs sm:text-sm font-semibold opacity-80">
          © 2026 {lead.name} • {lead.city} • All rights reserved • Powered by ClientForge Live Preview Engine
        </div>
      </footer>
    </div>
  );
}

/* ============================================================================
   PHIVE ULTRA-FITNESS & GYM WEBSITE RENDERER
   ============================================================================ */
function PhiveGymWebsiteRenderer({
  lead,
  preset,
  isMobile,
  waNumber,
  cleanPhone,
  onOpenBooking
}: {
  lead: RankedLead;
  preset: ReturnType<typeof getNichePreset>;
  isMobile?: boolean;
  waNumber: string;
  cleanPhone: string;
  onOpenBooking: () => void;
}) {
  const brandName = lead.name.toUpperCase();
  const phoneDisplay = lead.phone || "+91 95577 30531";

  const gymClasses = [
    {
      title: "HEAVY WEIGHTLIFTING & POWER ZONE",
      desc: "Olympic barbells, prime squat racks, dumbbells up to 50kg, and dedicated deadlift platforms.",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=80",
      tag: "STRENGTH"
    },
    {
      title: "HEATED INDOOR HYDROTHERAPY POOL",
      desc: "Temperature-controlled 25m indoor pool for lap swimming, aqua aerobics & post-workout recovery.",
      image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=500&q=80",
      tag: "AQUATICS"
    },
    {
      title: "SAUNA, STEAM & TURKISH BATH RECOVERY",
      desc: "Swedish cedar sauna, eucalyptus steam bath, cold plunge tubs & hydro massage relaxation suites.",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=500&q=80",
      tag: "RECOVERY"
    },
    {
      title: "PRIVATE REFORMER PILATES STUDIO",
      desc: "Core stabilization, posture alignment, and full-body toning with certified master instructors.",
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=500&q=80",
      tag: "PILATES"
    },
    {
      title: "HIGH-INTENSITY FUNCTIONAL HIIT & BOXING",
      desc: "Heavy bag cardio boxing, kettlebell circuits, air bikes, and high-energy group endurance classes.",
      image: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=500&q=80",
      tag: "CARDIO HIIT"
    },
    {
      title: "1-ON-1 CERTIFIED PERSONAL TRAINING",
      desc: "Customized transformation blueprints, InBody composition analysis, and elite coaching.",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=500&q=80",
      tag: "VIP COACHING"
    }
  ];

  return (
    <div className="bg-[#161003] text-white font-sans relative overflow-x-hidden selection:bg-[#ffe000] selection:text-[#161003]">
      {/* 1. TOP NAVBAR */}
      <nav className="w-full flex flex-wrap items-center justify-between px-4 sm:px-10 py-3 bg-[#161003] sticky top-0 z-40 border-b border-[#ffe000]/20 shadow-md gap-3">
        <a href="#hero" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ffe000] text-[#161003] flex items-center justify-center font-black text-xl shadow-md border border-white">
            ⚡
          </div>
          <span className="font-extrabold text-xl sm:text-3xl text-[#ffe000] tracking-tighter uppercase truncate font-serif">
            {lead.name}
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-3 font-sans">
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#ffe000]/10 text-[#ffe000] px-3 py-1 rounded-full text-xs font-extrabold border border-[#ffe000]/30">
            <span className="h-2 w-2 rounded-full bg-[#ffe000] animate-pulse" /> OPEN TODAY • {lead.city}
          </span>
          <a
            href={`tel:${cleanPhone}`}
            className="flex items-center gap-1.5 bg-[#ffe000] text-[#161003] px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black uppercase hover:bg-white transition-colors shadow-md"
          >
            <Phone className="h-3.5 w-3.5" /> <span>{phoneDisplay}</span>
          </a>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to enquire about gym membership.`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-emerald-500 text-slate-950 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black uppercase hover:bg-emerald-400 transition-colors shadow-md"
          >
            <MessageSquare className="h-3.5 w-3.5" /> <span>WhatsApp Pass</span>
          </a>
        </div>
      </nav>

      {/* 2. HERO SECTION WITH CONTINUOUS ROLLING TICKER & MEDIA SHOWCASE */}
      <section id="hero" className="relative bg-[#161003] pt-6 sm:pt-10 pb-12 px-4 text-center overflow-hidden border-b-4 border-[#ffe000]">
        {/* Continuous Rolling Header Ticker (Phive Ribbon Style) */}
        <div className="bg-[#ffe000] text-[#161003] py-2 overflow-hidden mb-6 border-y-2 border-black">
          <motion.div
            animate={{ x: [0, -1200] }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            className="flex gap-8 whitespace-nowrap text-xl sm:text-3xl font-black uppercase tracking-tighter"
          >
            <span>⚡ {brandName} PORTO & LISBOA VIBES IN {lead.city.toUpperCase()} ⚡</span>
            <span>IT'S NOT JUST FITNESS. IT'S LIVING FULLY ⚡</span>
            <span>★ {lead.rating ?? 4.9} GOOGLE RATED ({lead.reviewsCount ?? 420}+ REVIEWS) ⚡</span>
            <span>⚡ {brandName} PORTO & LISBOA VIBES IN {lead.city.toUpperCase()} ⚡</span>
            <span>IT'S NOT JUST FITNESS. IT'S LIVING FULLY ⚡</span>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col items-center relative z-10">
          {/* Rating Pill */}
          <div className="inline-flex items-center gap-2 bg-[#ffe000]/15 text-[#ffe000] px-4 py-1.5 rounded-full text-xs sm:text-base mb-4 shadow-lg border border-[#ffe000]/40">
            <span className="font-bold">★ {lead.rating ?? 4.9} Google Rated</span>
            <span className="text-white">({lead.reviewsCount ?? 420}+ Reviews)</span>
            <span className="text-[#ffe000]">• {lead.city}</span>
          </div>

          <h1 className="font-black text-4xl sm:text-8xl text-[#ffe000] uppercase tracking-tighter leading-none mb-4 drop-shadow-[0_4px_10px_rgba(255,224,0,0.25)]">
            {brandName}
          </h1>

          <p className="font-sans text-lg sm:text-3xl text-slate-200 font-extrabold max-w-3xl mx-auto mb-8 leading-tight">
            IT'S NOT JUST FITNESS. IT'S LIVING FULLY IN {lead.city.toUpperCase()}!
          </p>

          {/* Center High-Impact Gym Media Showcase */}
          <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden border-4 border-[#ffe000] shadow-2xl group mb-8">
            <div className="relative h-72 sm:h-[450px] w-full">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80"
                alt={lead.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161003] via-[#161003]/40 to-transparent" />
            </div>

            {/* Floating Overlays */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
              <div className="text-left max-sm:text-center">
                <span className="bg-[#ffe000] text-[#161003] font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block shadow-md">
                  CLUB HIGHLIGHT ★
                </span>
                <h3 className="font-black text-2xl sm:text-4xl text-white uppercase tracking-tight">
                  DISCOVER {brandName}
                </h3>
                <p className="text-xs sm:text-base text-slate-300 font-semibold">
                  Strength Zones • Heated Hydrotherapy Pool • Sauna & Steam • Reformer Pilates
                </p>
              </div>

              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to claim a free 1-day gym pass.`)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#ffe000] hover:bg-white text-[#161003] font-black text-sm sm:text-lg px-6 py-3 rounded-full border-2 border-white shadow-xl transition-all uppercase whitespace-nowrap cursor-pointer"
              >
                CLAIM FREE DAY PASS →
              </a>
            </div>
          </div>

          {/* Action Call / WhatsApp Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center gap-2 bg-[#ffe000] hover:bg-white text-[#161003] font-black text-base sm:text-xl px-7 py-3 rounded-full border-2 border-white shadow-xl transition-all cursor-pointer uppercase"
            >
              <Phone className="h-4 w-4" /> CALL DIRECT: {phoneDisplay}
            </a>
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to join the gym.`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base sm:text-xl px-7 py-3 rounded-full border-2 border-white shadow-xl transition-all cursor-pointer uppercase"
            >
              <MessageSquare className="h-4 w-4" /> INSTANT WHATSAPP MEMBERSHIP
            </a>
          </div>
        </div>
      </section>

      {/* 3. SCRAPED BUSINESS DATA BAR */}
      <section className="bg-[#0f0b02] text-slate-200 py-6 px-4 sm:px-10 border-b-4 border-[#ffe000]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-sans">
          <div className="bg-[#ffe000]/10 p-3 rounded-2xl border border-[#ffe000]/30">
            <span className="text-[#ffe000] font-bold text-xs uppercase block">📍 Address & Location</span>
            <span className="text-white text-sm sm:text-base font-extrabold truncate block">{lead.address || lead.city}</span>
          </div>
          <div className="bg-[#ffe000]/10 p-3 rounded-2xl border border-[#ffe000]/30">
            <span className="text-[#ffe000] font-bold text-xs uppercase block">📞 Phone Helpline</span>
            <span className="text-white text-sm sm:text-base font-extrabold truncate block">{phoneDisplay}</span>
          </div>
          <div className="bg-[#ffe000]/10 p-3 rounded-2xl border border-[#ffe000]/30">
            <span className="text-[#ffe000] font-bold text-xs uppercase block">💬 WhatsApp Express</span>
            <span className="text-white text-sm sm:text-base font-extrabold truncate block">Instant Pass & Booking</span>
          </div>
          <div className="bg-[#ffe000]/10 p-3 rounded-2xl border border-[#ffe000]/30">
            <span className="text-[#ffe000] font-bold text-xs uppercase block">⭐ Member Reputation</span>
            <span className="text-white text-sm sm:text-base font-extrabold truncate block">{lead.rating ?? 4.9}★ ({lead.reviewsCount ?? 420}+ Reviews)</span>
          </div>
        </div>
      </section>

      {/* 4. SECTION 2: "ACTIVATE YOUR SENSES / PUSH YOUR LIMITS" BADGE BANNER */}
      <section className="py-14 px-4 sm:px-10 bg-[#161003] text-center border-b-4 border-[#ffe000]">
        <div className="max-w-4xl mx-auto relative bg-[#ffe000] text-[#161003] p-8 sm:p-12 rounded-3xl border-4 border-white shadow-2xl overflow-hidden">
          <span className="bg-[#161003] text-[#ffe000] font-extrabold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md mb-4 inline-block">
            PHILOSOPHY & ENERGY ★
          </span>

          {/* Stacked Headline with Brush Script Overlay */}
          <div className="relative my-4">
            <h2 className="font-black text-4xl sm:text-7xl uppercase tracking-tighter leading-none text-[#161003]">
              ACTIVATE YOUR SENSES
            </h2>
            <div className="font-serif italic text-2xl sm:text-5xl text-white font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] -mt-2 sm:-mt-4 transform -rotate-3">
              ~ Push Your Limits ~
            </div>
          </div>

          <p className="text-base sm:text-2xl font-extrabold text-[#161003] max-w-2xl mx-auto my-6 leading-snug">
            Welcome to {lead.name}. We combine state-of-the-art strength arenas, heated hydrotherapy pools, luxury saunas, and personal training under one roof in {lead.city}!
          </p>

          <a
            href={`tel:${cleanPhone}`}
            className="inline-block bg-[#161003] hover:bg-white text-[#ffe000] hover:text-[#161003] font-black text-base sm:text-2xl px-8 py-3.5 rounded-full border-2 border-black shadow-xl transition-all uppercase cursor-pointer"
          >
            BOOK YOUR CLUB TOUR: {phoneDisplay}
          </a>
        </div>
      </section>

      {/* 5. SECTION 3: "WHAT YOU CAN FIND AT CLUBS" & GIANT "FITNESS" GRAPHIC */}
      <section className="py-14 px-4 sm:px-10 bg-[#0f0b02]">
        <div className="max-w-6xl mx-auto text-center mb-8">
          <div className="inline-block bg-[#161003] text-[#ffe000] border-2 border-[#ffe000] p-4 rounded-2xl shadow-xl w-full max-w-3xl mb-8">
            <h3 className="font-black text-sm sm:text-xl uppercase tracking-wider text-[#ffe000] mb-3">
              WHAT YOU CAN FIND AT {brandName} CLUBS
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs sm:text-sm font-bold text-white uppercase">
              <div className="p-2 bg-[#ffe000]/10 rounded-xl border border-[#ffe000]/20">
                🏊 HEATED INDOOR POOL
              </div>
              <div className="p-2 bg-[#ffe000]/10 rounded-xl border border-[#ffe000]/20">
                🧖 SAUNA & JACUZZI
              </div>
              <div className="p-2 bg-[#ffe000]/10 rounded-xl border border-[#ffe000]/20">
                🏋️ WEIGHT & CARDIO
              </div>
              <div className="p-2 bg-[#ffe000]/10 rounded-xl border border-[#ffe000]/20">
                🧘 PRIVATE PILATES
              </div>
              <div className="p-2 bg-[#ffe000]/10 rounded-xl border border-[#ffe000]/20">
                🥊 GROUP HIIT CLASSES
              </div>
            </div>
          </div>
        </div>

        {/* Giant FITNESS Graphic Container (#ffe000 Electric Yellow) */}
        <div className="max-w-6xl mx-auto bg-[#ffe000] p-8 sm:p-14 rounded-3xl border-4 border-white shadow-2xl relative text-center overflow-hidden">
          <h2 className="font-black text-6xl sm:text-[11vw] text-[#161003] tracking-tighter leading-none uppercase mb-2 drop-shadow-md">
            FITNESS
          </h2>

          {/* Floating 3D Weight Plate Graphic Badge Overlay */}
          <div className="inline-flex items-center gap-3 bg-[#161003] text-[#ffe000] px-6 py-3 rounded-2xl border-2 border-white shadow-2xl transform -rotate-3 mb-4">
            <span className="text-2xl">🏋️‍♂️</span>
            <span className="font-black text-sm sm:text-xl uppercase tracking-wider">
              25 KG PHIVE PRO PLATE • OLYMPIC GRADE
            </span>
          </div>

          <p className="text-lg sm:text-3xl text-[#161003] font-black max-w-3xl mx-auto my-4">
            UNLEASH YOUR ULTIMATE POTENTIAL WITH WORLD-CLASS EQUIPMENT IN {lead.city.toUpperCase()}
          </p>
        </div>
      </section>

      {/* 6. SECTION 4: 6 HIGH-IMPACT GYM FACILITIES & CLASSES GRID */}
      <section className="py-14 px-4 sm:px-10 bg-[#161003]">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <span className="bg-[#ffe000] text-[#161003] font-black text-xs sm:text-sm px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
            PREMIUM FACILITIES & SPECIALTIES ★
          </span>
          <h2 className="font-black text-4xl sm:text-6xl text-[#ffe000] uppercase mt-3 tracking-tight">
            ENGINEERED FOR PEAK PERFORMANCE
          </h2>
          <p className="text-base sm:text-xl text-slate-300 font-bold max-w-xl mx-auto mt-2">
            Explore our world-class workout zones and recovery suites in {lead.city}!
          </p>
        </div>

        {/* 6 Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {gymClasses.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#0f0b02] p-4 rounded-3xl border-3 border-[#ffe000]/40 shadow-xl flex flex-col justify-between hover:scale-105 transition-transform duration-300"
            >
              <div>
                <div className="relative overflow-hidden rounded-2xl mb-3 h-48">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-[#ffe000] text-[#161003] font-black text-[11px] px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                    {item.tag}
                  </span>
                </div>
                <h3 className="font-black text-lg text-[#ffe000] uppercase tracking-wide mb-1 leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-300 font-semibold leading-relaxed mb-4">{item.desc}</p>
              </div>

              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to join ${item.title}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-[#ffe000] hover:bg-white text-[#161003] font-black text-sm tracking-wider rounded-2xl transition-colors uppercase text-center block"
              >
                ENQUIRE ON WHATSAPP →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 7. SECTION 5: "#JOIN THE CLUBS / FOLLOW US" BADGE BANNER */}
      <section className="bg-[#ffe000] text-[#161003] py-14 px-4 sm:px-10 text-center relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#161003] text-[#ffe000] p-8 sm:p-12 rounded-3xl border-4 border-white shadow-2xl inline-block max-w-3xl">
            <h2 className="font-black text-4xl sm:text-7xl uppercase leading-none tracking-tighter mb-2">
              #JOIN THE {brandName} CLUBS
            </h2>
            <div className="font-serif italic text-2xl sm:text-5xl text-white font-bold mb-6">
              ~ Follow Us ~
            </div>
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to join the club membership.`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-[#ffe000] hover:bg-white text-[#161003] font-black text-lg sm:text-2xl px-10 py-3.5 rounded-full border-2 border-white shadow-2xl transition-all uppercase cursor-pointer"
            >
              EXPLORE MEMBERSHIP PLANS →
            </a>
          </div>
        </div>
      </section>

      {/* 8. SECTION 6: CIRCULAR SOCIALS & COMMUNITY GRID */}
      <section className="bg-[#161003] text-white py-14 px-4 sm:px-10 text-center">
        <div className="max-w-6xl mx-auto">
          <span className="bg-[#ffe000] text-[#161003] font-black text-xs sm:text-sm px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md mb-3 inline-block">
            COMMUNITY & SOCIALS ★
          </span>
          <h2 className="font-black text-3xl sm:text-6xl text-[#ffe000] uppercase tracking-tight mb-10">
            KEEP UP WITH ALL THE LATEST ON OUR SOCIALS!
          </h2>

          {/* 4 Circular Cutout Photo Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-5xl mx-auto mb-10">
            <div className="flex flex-col items-center">
              <div className="w-36 h-36 sm:w-52 sm:h-52 rounded-full overflow-hidden border-4 border-[#ffe000] shadow-2xl relative mb-3 group">
                <img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80" alt="Yoga IG" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                <span className="absolute inset-0 flex items-center justify-center font-black text-4xl text-white drop-shadow-lg">IG</span>
              </div>
              <span className="font-black text-sm text-[#ffe000]">INSTAGRAM REELS</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-36 h-36 sm:w-52 sm:h-52 rounded-full overflow-hidden border-4 border-[#ffe000] shadow-2xl relative mb-3 group">
                <img src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=400&q=80" alt="Pool FB" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                <span className="absolute inset-0 flex items-center justify-center font-black text-4xl text-white drop-shadow-lg">FB</span>
              </div>
              <span className="font-black text-sm text-[#ffe000]">FACEBOOK COMMUNITY</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-36 h-36 sm:w-52 sm:h-52 rounded-full overflow-hidden border-4 border-[#ffe000] shadow-2xl relative mb-3 group">
                <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80" alt="Bench YT" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                <span className="absolute inset-0 flex items-center justify-center font-black text-4xl text-white drop-shadow-lg">YT</span>
              </div>
              <span className="font-black text-sm text-[#ffe000]">YOUTUBE WORKOUTS</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-36 h-36 sm:w-52 sm:h-52 rounded-full overflow-hidden border-4 border-[#ffe000] shadow-2xl relative mb-3 group">
                <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80" alt="Coach TK" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                <span className="absolute inset-0 flex items-center justify-center font-black text-4xl text-white drop-shadow-lg">TK</span>
              </div>
              <span className="font-black text-sm text-[#ffe000]">TIKTOK COACH TIPS</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. SECTION 7: VERIFIED INDIAN MEMBER REVIEWS MARQUEE LOOP (RIGHT TO LEFT) */}
      <section className="bg-[#0f0b02] py-14 border-t-4 border-[#ffe000] overflow-hidden relative">
        <div className="text-center mb-8 px-4">
          <span className="bg-[#ffe000] text-[#161003] font-black text-xs sm:text-sm px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
            REAL MEMBER REVIEWS ★
          </span>
          <h2 className="font-black text-3xl sm:text-6xl text-[#ffe000] uppercase mt-2 tracking-tight">
            WHAT OUR MEMBERS SAY IN {lead.city.toUpperCase()}
          </h2>
        </div>

        {/* Continuous Horizontal Marquee Loop (Right to Left) */}
        <div className="flex overflow-hidden">
          <motion.div
            animate={{ x: [0, -1400] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex gap-6 shrink-0"
          >
            {[
              { author: "Aarav Mehta", location: "Delhi • Local Guide", text: "The weightlifting arena and sauna are top notch! Lost 12kg in 3 months.", rating: "★★★★★" },
              { author: "Neha Sharma", location: "Mumbai • Fitness Enthusiast", text: "Best reformer pilates and heated pool in town. Cleanliness is 10/10!", rating: "★★★★★" },
              { author: "Rohan Verma", location: "Jaipur • CrossFit Athlete", text: "World-class equipment, supportive trainers, and super easy WhatsApp membership registration.", rating: "★★★★★" },
              { author: "Pooja Hegde", location: "Ahmedabad • Verified Member", text: "Love the personal training sessions and steam bath after leg day. Highly recommended!", rating: "★★★★★" },
              { author: "Karan Malhotra", location: "Bengaluru • Powerlifter", text: "Heavy dumbbells up to 50kg, rogue racks, and great community vibe. 5 Stars!", rating: "★★★★★" },
              { author: "Simran Kaur", location: "Pune • Wellness Blogger", text: "The group HIIT and jacuzzi facilities are fantastic. Best gym in town!", rating: "★★★★★" },
              { author: "Aarav Mehta", location: "Delhi • Local Guide", text: "The weightlifting arena and sauna are top notch! Lost 12kg in 3 months.", rating: "★★★★★" },
              { author: "Neha Sharma", location: "Mumbai • Fitness Enthusiast", text: "Best reformer pilates and heated pool in town. Cleanliness is 10/10!", rating: "★★★★★" },
              { author: "Rohan Verma", location: "Jaipur • CrossFit Athlete", text: "World-class equipment, supportive trainers, and super easy WhatsApp membership registration.", rating: "★★★★★" },
              { author: "Pooja Hegde", location: "Ahmedabad • Verified Member", text: "Love the personal training sessions and steam bath after leg day. Highly recommended!", rating: "★★★★★" },
              { author: "Karan Malhotra", location: "Bengaluru • Powerlifter", text: "Heavy dumbbells up to 50kg, rogue racks, and great community vibe. 5 Stars!", rating: "★★★★★" },
              { author: "Simran Kaur", location: "Pune • Wellness Blogger", text: "The group HIIT and jacuzzi facilities are fantastic. Best gym in town!", rating: "★★★★★" }
            ].map((rev, idx) => (
              <div
                key={idx}
                className="bg-[#161003] text-white p-5 rounded-3xl border-4 border-[#ffe000] shadow-2xl w-80 sm:w-96 shrink-0 transform hover:scale-105 transition-transform"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xl text-[#ffe000] tracking-tight">{rev.author}</span>
                  <span className="text-[#ffe000] font-bold text-sm tracking-widest">{rev.rating}</span>
                </div>
                <div className="text-xs text-amber-400 font-bold mb-2 uppercase tracking-wider">
                  {rev.location}
                </div>
                <p className="text-sm text-slate-200 leading-snug font-semibold">
                  "{rev.text}"
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 10. DARK ESPRESSO FOOTER & EMBEDDED GOOGLE MAP */}
      <footer className="bg-[#161003] text-white py-12 px-4 sm:px-10 text-center relative border-t-4 border-[#ffe000]">
        <h2 className="font-black text-4xl sm:text-7xl text-[#ffe000] uppercase mb-3 tracking-tighter drop-shadow-md">
          {brandName}
        </h2>
        <p className="text-base sm:text-xl text-slate-300 font-bold max-w-xl mx-auto mb-6">
          Premium Fitness, Hydrotherapy Pool & Wellness Club in {lead.city}. Visit us at {lead.address || lead.city}!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <a
            href={`tel:${cleanPhone}`}
            className="bg-[#ffe000] hover:bg-white text-[#161003] font-black text-xl sm:text-3xl px-8 py-3 rounded-full border-2 border-white shadow-xl transition-all cursor-pointer uppercase"
          >
            📞 CALL: {phoneDisplay}
          </a>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to join the gym.`)}`}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xl sm:text-3xl px-8 py-3 rounded-full border-2 border-white shadow-xl transition-all cursor-pointer uppercase"
          >
            💬 WHATSAPP MEMBERSHIP →
          </a>
        </div>

        {/* Embedded Google Map */}
        <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden border-4 border-[#ffe000] shadow-2xl mb-8">
          <iframe
            title={`Map for ${lead.name}`}
            width="100%"
            height="260"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps?q=${encodeURIComponent(`${lead.name}, ${lead.address || ""}, ${lead.city}`)}&output=embed`}
          />
        </div>

        <div className="border-t border-slate-800 pt-6 text-xs sm:text-sm font-semibold opacity-80">
          © 2026 {lead.name} • {lead.city} • All rights reserved • Powered by ClientForge Live Preview Engine
        </div>
      </footer>
    </div>
  );
}

/* ============================================================================
   BUCKLER ULTRA-LUXURY COMMERCIAL GYM WEBSITE RENDERER
   ============================================================================ */
function BucklerGymWebsiteRenderer({
  lead,
  preset,
  isMobile,
  waNumber,
  cleanPhone,
  onOpenBooking
}: {
  lead: RankedLead;
  preset: ReturnType<typeof getNichePreset>;
  isMobile?: boolean;
  waNumber: string;
  cleanPhone: string;
  onOpenBooking: () => void;
}) {
  const brandName = lead.name.toUpperCase();
  const phoneDisplay = lead.phone || "+91 95577 30531";
  const [activeTab, setActiveTab] = useState("Todos");

  const equipmentList = [
    {
      title: "Commercial Touch Screen Treadmill & Cardio",
      category: "Cardio",
      image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=600&q=80",
      tag: "SÉRIE CARDIO"
    },
    {
      title: "Pin Loaded Dual Chest & Shoulder Press",
      category: "Pin Loaded",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
      tag: "SÉRIE DUET"
    },
    {
      title: "Plate Loaded 45° Leg Press & Hack Squat",
      category: "Plate Loaded",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80",
      tag: "SÉRIE PRIME"
    },
    {
      title: "Full Power Cage & Functional Cross Cable Rig",
      category: "Cable Cross",
      image: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=600&q=80",
      tag: "SÉRIE INFINITE"
    },
    {
      title: "Adjustable Incline Benches & Dumbbell Racks",
      category: "Benches & Racks",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      tag: "PRIME BENCHES"
    },
    {
      title: "Urethane CPU Barbells & Olympic Bumper Plates",
      category: "Plate Loaded",
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
      tag: "TITANIUM GOLD"
    }
  ];

  const filteredEquipment = activeTab === "Todos"
    ? equipmentList
    : equipmentList.filter(item => item.category === activeTab);

  return (
    <div className="bg-[#1a1918] text-[#f8f8f8] font-sans relative overflow-x-hidden selection:bg-[#cdc2b1] selection:text-[#1a1918]">
      {/* 1. TOP NAVBAR */}
      <nav className="w-full flex flex-wrap items-center justify-between px-4 sm:px-10 py-3 bg-[#121110] sticky top-0 z-40 border-b border-[#cdc2b1]/20 shadow-xl gap-3">
        <a href="#hero" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#cdc2b1] text-[#1a1918] flex items-center justify-center font-black text-xl shadow-md border border-white">
            🦾
          </div>
          <span className="font-extrabold text-xl sm:text-3xl text-white tracking-tight uppercase truncate font-serif">
            {lead.name}
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-4 font-sans text-xs">
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#cdc2b1]/10 text-[#cdc2b1] px-3.5 py-1 rounded-full text-xs font-bold border border-[#cdc2b1]/30">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> REALLEADER USA PARTNER • {lead.city.toUpperCase()}
          </span>
          <a
            href={`tel:${cleanPhone}`}
            className="flex items-center gap-1.5 bg-[#cdc2b1] text-[#1a1918] px-4 py-2 rounded-full text-xs font-black uppercase hover:bg-white transition-colors shadow-md"
          >
            <Phone className="h-3.5 w-3.5" /> <span>{phoneDisplay}</span>
          </a>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to request the 2025 Buckler Gym Equipment Catalog.`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-emerald-500 text-slate-950 px-4 py-2 rounded-full text-xs font-black uppercase hover:bg-emerald-400 transition-colors shadow-md"
          >
            <MessageSquare className="h-3.5 w-3.5" /> <span>WhatsApp Catalog</span>
          </a>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section id="hero" className="relative bg-[#121110] pt-8 sm:pt-14 pb-16 px-4 text-center border-b-4 border-[#cdc2b1]/30 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col items-center relative z-10">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2.5 bg-[#cdc2b1]/15 text-[#cdc2b1] px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-6 border border-[#cdc2b1]/30 shadow-lg">
            <span className="bg-[#cdc2b1] text-[#1a1918] font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">NOVO</span>
            <span>Buckler Commercial Gym & Fitness Ecosystem 2025</span>
          </div>

          {/* Display XL Headline */}
          <h1 className="font-black text-4xl sm:text-8xl text-white uppercase tracking-tighter leading-none mb-6 drop-shadow-lg">
            TORNE SUA ACADEMIA <span className="text-[#cdc2b1] underline decoration-[#cdc2b1]/40 decoration-4">INCOMPARÁVEL</span>
          </h1>

          <p className="font-sans text-base sm:text-2xl text-slate-300 font-medium max-w-3xl mx-auto mb-8 leading-relaxed">
            Somos um ecossistema completo de soluções fitness de alta qualidade para <span className="text-[#cdc2b1] font-bold">{lead.name}</span> em {lead.city}. Oferecemos equipamentos de alto padrão e suporte de montagem do zero.
          </p>

          {/* Rating Badge */}
          <div className="inline-flex items-center gap-2 bg-[#1a1918] text-white px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold border border-[#cdc2b1]/30 mb-8 shadow-md">
            <span className="text-amber-400">★ {lead.rating ?? 4.9} Google Rated</span>
            <span className="text-slate-400">({lead.reviewsCount ?? 420}+ Verified Reviews)</span>
            <span className="text-[#cdc2b1]">• {lead.city}</span>
          </div>

          {/* Hero Video/Image Container */}
          <div className="relative w-full max-w-5xl rounded-3xl overflow-hidden border-4 border-[#cdc2b1]/40 shadow-2xl group mb-10">
            <div className="relative h-72 sm:h-[480px] w-full">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80"
                alt={lead.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121110] via-[#121110]/40 to-transparent" />
            </div>

            {/* Overlays */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
              <div className="text-left max-sm:text-center">
                <span className="bg-[#cdc2b1] text-[#1a1918] font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                  PARCEIRO EXCLUSIVO REALLEADER USA ★
                </span>
                <h3 className="font-black text-2xl sm:text-4xl text-white uppercase tracking-tight">
                  EXCELÊNCIA, DESIGN E DURABILIDADE
                </h3>
                <p className="text-xs sm:text-base text-slate-300 font-medium">
                  Ergonomia de precisão, estruturas biomecânicas e acabamentos de alto padrão em {lead.city}.
                </p>
              </div>

              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to request a free equipment quote.`)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#cdc2b1] hover:bg-white text-[#1a1918] font-black text-sm sm:text-base px-6 py-3 rounded-full border-2 border-white shadow-xl transition-all uppercase whitespace-nowrap cursor-pointer"
              >
                SOLICITAR ORÇAMENTO →
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center gap-2 bg-[#cdc2b1] hover:bg-white text-[#1a1918] font-black text-base sm:text-xl px-8 py-3.5 rounded-full border-2 border-white shadow-xl transition-all uppercase cursor-pointer"
            >
              <Phone className="h-4 w-4" /> CALL DIRECT: {phoneDisplay}
            </a>
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to explore equipment for my gym.`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base sm:text-xl px-8 py-3.5 rounded-full border-2 border-white shadow-xl transition-all uppercase cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" /> WHATSAPP CATALOG & PRICES
            </a>
          </div>
        </div>
      </section>

      {/* 3. SECTION 2: CLIENT PARTNER LOGOS TICKER */}
      <section className="bg-[#121110] py-5 overflow-hidden border-b border-[#cdc2b1]/20">
        <div className="text-center text-xs font-bold text-[#cdc2b1] uppercase tracking-widest mb-3">
          BEYOND THE MACHINES • TRUSTED BY TOP COMMERCIAL GYMS
        </div>
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex gap-12 whitespace-nowrap text-lg sm:text-2xl font-black text-slate-400 uppercase tracking-tighter opacity-80"
        >
          <span>🏆 WORLD GYM</span>
          <span>⚡ BODYTECH</span>
          <span>🥊 IRONWORKS PRIME</span>
          <span>🔥 FÁBRICA DE MONSTROS</span>
          <span>⭐ WELLNESS CLUB</span>
          <span>💪 HOPE FITNESS</span>
          <span>🏆 WORLD GYM</span>
          <span>⚡ BODYTECH</span>
          <span>🥊 IRONWORKS PRIME</span>
          <span>🔥 FÁBRICA DE MONSTROS</span>
        </motion.div>
      </section>

      {/* 4. SECTION 3: BUCKLER 360 - UMA EXPERIÊNCIA COMPLETA (5 ECOSYSTEM PILLARS) */}
      <section className="py-16 px-4 sm:px-10 bg-[#1a1918] border-b-4 border-[#cdc2b1]/30">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#cdc2b1]/15 text-[#cdc2b1] px-4 py-1 rounded-full text-xs font-extrabold uppercase mb-3 border border-[#cdc2b1]/30">
            BUCKLER 360 ECOSYSTEM
          </div>
          <h2 className="font-black text-3xl sm:text-6xl text-white uppercase tracking-tight">
            UMA EXPERIÊNCIA COMPLETA
          </h2>
          <p className="text-base sm:text-xl text-slate-300 font-medium max-w-2xl mx-auto mt-2">
            Soluções completas de equipamentos, manutenção preditiva e suporte para {lead.name} em {lead.city}!
          </p>
        </div>

        {/* 5 Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {[
            {
              title: "BUCKLER MACHINES",
              desc: "Equipamentos biomecânicos de alta durabilidade e ergonomia superior para sua academia do zero.",
              icon: "🏋️‍♂️",
              img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80"
            },
            {
              title: "BUCKLER CARE",
              desc: "Suporte VIP contínuo, manutenção preventiva mensal e relatórios detalhados de alta performance.",
              icon: "🛠️",
              img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80"
            },
            {
              title: "BUCKLER GAAS",
              desc: "Gym-as-a-Service: consultoria de marca, arquitetura de espaço, marketing e treinamento de equipe.",
              icon: "🚀",
              img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80"
            },
            {
              title: "BUCKLER TRACKING",
              desc: "Acompanhamento em tempo real de pedidos, transporte e instalação na sua academia.",
              icon: "📦",
              img: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=400&q=80"
            },
            {
              title: "BUCKLER CHECK-UP",
              desc: "Auditoria operacional preditiva mensal realizada por nossos engenheiros de Customer Success.",
              icon: "📊",
              img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80"
            }
          ].map((pillar, idx) => (
            <div
              key={idx}
              className="bg-[#121110] rounded-3xl p-5 border-2 border-[#cdc2b1]/30 hover:border-[#cdc2b1] transition-all flex flex-col justify-between group hover:scale-105 shadow-xl"
            >
              <div>
                <div className="relative overflow-hidden rounded-2xl mb-4 h-36">
                  <img src={pillar.img} alt={pillar.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <span className="absolute top-2 left-2 bg-[#cdc2b1] text-[#1a1918] font-black text-xs p-1.5 rounded-full shadow-md">
                    {pillar.icon}
                  </span>
                </div>
                <h3 className="font-black text-base text-[#cdc2b1] uppercase tracking-tight mb-2">{pillar.title}</h3>
                <p className="text-xs text-slate-300 font-normal leading-relaxed">{pillar.desc}</p>
              </div>

              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to know more about ${pillar.title}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 w-full py-2 bg-[#cdc2b1] hover:bg-white text-[#1a1918] font-extrabold text-xs tracking-wider rounded-xl transition-colors uppercase text-center block"
              >
                SAIBA MAIS →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SECTION 4: NOSSAS SÉRIES (01-04 SERIES SHOWCASE) */}
      <section className="py-16 px-4 sm:px-10 bg-[#121110] border-b-4 border-[#cdc2b1]/30">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <span className="bg-[#cdc2b1] text-[#1a1918] font-black text-xs px-4 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
            NOSSAS SÉRIES DE EQUIPAMENTOS
          </span>
          <h2 className="font-black text-3xl sm:text-6xl text-[#cdc2b1] uppercase tracking-tight">
            TRANSFORME SUA ACADEMIA NO ESPAÇO DOS SONHOS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {[
            {
              num: "01",
              title: "SÉRIE CARDIO",
              desc: "Esteiras Touch Screen, Elípticos LED, Remos e Airbikes comerciais de alta resistência.",
              img: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=600&q=80"
            },
            {
              num: "02",
              title: "SÉRIE DUET",
              desc: "Máquinas pin loaded duplas de alta eficiência que otimizam o espaço da sua academia.",
              img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80"
            },
            {
              num: "03",
              title: "SÉRIE PRIME",
              desc: "Elegância e biometria de nível mundial com acabamentos em titanium gold e preto fosco.",
              img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80"
            },
            {
              num: "04",
              title: "SÉRIE INFINITE",
              desc: "Gaiolas de agachamento Super Power Cage, supino horizontal e anilhas de uretano CPU.",
              img: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=600&q=80"
            }
          ].map((serie, idx) => (
            <div
              key={idx}
              className="bg-[#1a1918] rounded-3xl p-6 border-2 border-[#cdc2b1]/30 flex flex-col sm:flex-row items-center gap-6 shadow-xl hover:border-[#cdc2b1] transition-all"
            >
              <div className="w-full sm:w-1/2 h-52 rounded-2xl overflow-hidden">
                <img src={serie.img} alt={serie.title} className="w-full h-full object-cover" />
              </div>
              <div className="w-full sm:w-1/2 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-3xl font-black text-[#cdc2b1] block mb-1">{serie.num}</span>
                  <h3 className="font-black text-xl text-white uppercase tracking-tight mb-2">{serie.title}</h3>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed mb-4">{serie.desc}</p>
                </div>
                <a
                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want pricing details for ${serie.title}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-2 px-4 bg-[#cdc2b1] hover:bg-white text-[#1a1918] font-bold text-xs rounded-xl uppercase transition-colors text-center"
                >
                  CONHECER A {serie.title} →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SECTION 5: NOSSAS MÁQUINAS (CATALOG TABS & GRID) */}
      <section className="py-16 px-4 sm:px-10 bg-[#1a1918] border-b-4 border-[#cdc2b1]/30">
        <div className="max-w-6xl mx-auto text-center mb-8">
          <span className="bg-[#cdc2b1] text-[#1a1918] font-black text-xs px-4 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
            CATÁLOGO OFICIAL 2025
          </span>
          <h2 className="font-black text-3xl sm:text-6xl text-white uppercase tracking-tight mb-8">
            NOSSAS MÁQUINAS
          </h2>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {["Todos", "Cardio", "Pin Loaded", "Plate Loaded", "Benches & Racks", "Cable Cross"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase transition-all ${
                  activeTab === tab
                    ? "bg-[#cdc2b1] text-[#1a1918] shadow-md"
                    : "bg-[#121110] text-slate-400 hover:text-white border border-[#cdc2b1]/20"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Machine Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredEquipment.map((eq, idx) => (
            <div
              key={idx}
              className="bg-[#121110] p-4 rounded-3xl border-2 border-[#cdc2b1]/30 shadow-xl flex flex-col justify-between hover:scale-105 transition-transform duration-300"
            >
              <div>
                <div className="relative overflow-hidden rounded-2xl mb-4 h-48">
                  <img src={eq.image} alt={eq.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-[#cdc2b1] text-[#1a1918] font-black text-[10px] px-3 py-1 rounded-full shadow-md uppercase">
                    {eq.tag}
                  </span>
                </div>
                <h3 className="font-black text-base text-[#cdc2b1] uppercase tracking-tight mb-2 leading-snug">{eq.title}</h3>
                <p className="text-xs text-slate-400 font-semibold mb-4">Categoria: {eq.category} • Garantia Comercial 5 Anos</p>
              </div>

              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to add ${eq.title} to my gym floor.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-[#cdc2b1] hover:bg-white text-[#1a1918] font-black text-xs tracking-wider rounded-2xl transition-colors uppercase text-center block"
              >
                SOLICITAR COTAÇÃO NO WHATSAPP →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 7. SECTION 6: VERIFIED MEMBER REVIEWS MARQUEE LOOP */}
      <section className="bg-[#121110] py-16 overflow-hidden relative border-b-4 border-[#cdc2b1]/30">
        <div className="text-center mb-10 px-4">
          <span className="bg-[#cdc2b1] text-[#1a1918] font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
            TESTEMUNHOS REAIS ★
          </span>
          <h2 className="font-black text-3xl sm:text-6xl text-[#cdc2b1] uppercase mt-3 tracking-tight">
            O QUE DIZEM PROPRIETÁRIOS E MEMBROS EM {lead.city.toUpperCase()}
          </h2>
        </div>

        {/* Continuous Horizontal Marquee Loop */}
        <div className="flex overflow-hidden">
          <motion.div
            animate={{ x: [0, -1400] }}
            transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
            className="flex gap-6 shrink-0"
          >
            {[
              { author: "Vikram Singhania", location: "Delhi • Gym Owner", text: "Buckler equipment transformed our 5000 sqft facility. Biomechanics & finish are unmatched!", rating: "★★★★★" },
              { author: "Ananya Iyer", location: "Bengaluru • Fitness Director", text: "The Buckler Care monthly checkups keep our machine downtime at 0%. World-class service!", rating: "★★★★★" },
              { author: "Kabir Deshmukh", location: "Mumbai • Head Coach", text: "Dumbbells and plate-loaded leg press are bulletproof. Best investment we made this year.", rating: "★★★★★" },
              { author: "Meera Patel", location: "Ahmedabad • Studio Owner", text: "Super smooth delivery and fast installation via WhatsApp tracking. Highly recommended!", rating: "★★★★★" },
              { author: "Rajesh Sharma", location: "Jaipur • Powerlifter", text: "The Power Cage and Urethane CPU plates are competition grade. 5 Stars for durability!", rating: "★★★★★" },
              { author: "Vikram Singhania", location: "Delhi • Gym Owner", text: "Buckler equipment transformed our 5000 sqft facility. Biomechanics & finish are unmatched!", rating: "★★★★★" },
              { author: "Ananya Iyer", location: "Bengaluru • Fitness Director", text: "The Buckler Care monthly checkups keep our machine downtime at 0%. World-class service!", rating: "★★★★★" }
            ].map((rev, idx) => (
              <div
                key={idx}
                className="bg-[#1a1918] text-white p-5 rounded-3xl border-2 border-[#cdc2b1]/40 shadow-2xl w-80 sm:w-96 shrink-0 transform hover:scale-105 transition-transform"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xl text-[#cdc2b1] tracking-tight">{rev.author}</span>
                  <span className="text-[#cdc2b1] font-bold text-sm tracking-widest">{rev.rating}</span>
                </div>
                <div className="text-xs text-amber-400 font-bold mb-2 uppercase tracking-wider">
                  {rev.location}
                </div>
                <p className="text-sm text-slate-300 leading-snug font-semibold">
                  "{rev.text}"
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 8. FOOTER & EMBEDDED GOOGLE MAP */}
      <footer className="bg-[#121110] text-white py-14 px-4 sm:px-10 text-center relative">
        <h2 className="font-black text-4xl sm:text-7xl text-[#cdc2b1] uppercase mb-3 tracking-tighter drop-shadow-md">
          {brandName}
        </h2>
        <p className="text-base sm:text-xl text-slate-300 font-medium max-w-xl mx-auto mb-6">
          Equipamentos Fitness Comerciais de Alto Padrão em {lead.city}. Visite-nos em {lead.address || lead.city}!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <a
            href={`tel:${cleanPhone}`}
            className="bg-[#cdc2b1] hover:bg-white text-[#1a1918] font-black text-xl sm:text-2xl px-8 py-3 rounded-full border-2 border-white shadow-xl transition-all cursor-pointer uppercase"
          >
            📞 CALL: {phoneDisplay}
          </a>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I want to request gym equipment details.`)}`}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xl sm:text-2xl px-8 py-3 rounded-full border-2 border-white shadow-xl transition-all cursor-pointer uppercase"
          >
            💬 WHATSAPP PORTAL →
          </a>
        </div>

        {/* Embedded Google Map */}
        <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden border-4 border-[#cdc2b1]/40 shadow-2xl mb-8">
          <iframe
            title={`Map for ${lead.name}`}
            width="100%"
            height="260"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps?q=${encodeURIComponent(`${lead.name}, ${lead.address || ""}, ${lead.city}`)}&output=embed`}
          />
        </div>

        <div className="border-t border-slate-800 pt-6 text-xs sm:text-sm font-semibold opacity-80">
          © 2026 {lead.name} • {lead.city} • All rights reserved • Powered by ClientForge Live Preview Engine
        </div>
      </footer>
    </div>
  );
}

