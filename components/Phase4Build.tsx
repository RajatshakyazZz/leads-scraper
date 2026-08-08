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
  const [restaurantStyle, setRestaurantStyle] = useState<"crav" | "classic">("crav");
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
                    🍔 CRAV Theme
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
  preset: ReturnType<typeof getNichePreset>
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
${preset.services.map((s, i) => `   ${i + 1}. [${(s as { badge?: string }).badge || "Featured"}] ${s.title}: ${s.desc} (Image: ${s.image})`).join("\n")}
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
  const shortName = brandName.split(" ")[0] || "CRAV";

  return (
    <div className="bg-[#F5E3CD] text-[#4C0016] font-sans relative overflow-x-hidden selection:bg-[#EF1624] selection:text-white">
      {/* 1. TOP NAVBAR (BEIGE & RED) */}
      <nav className="w-full flex items-center justify-between px-4 sm:px-10 py-4 bg-[#F5E3CD] sticky top-0 z-40 border-b border-[#4C0016]/10">
        <a href="#hero" className="font-modak text-3xl sm:text-5xl text-[#EF1624] text-stroke-180 hover:scale-105 transition-transform tracking-wider">
          {shortName}
        </a>
        <div className="flex items-center gap-2 sm:gap-4 font-mouse-memoirs">
          <button
            onClick={onOpenBooking}
            className="text-sm sm:text-lg uppercase text-white bg-[#EF1624] px-4 sm:px-6 py-1.5 sm:py-2 rounded-full hover:bg-black transition-colors font-bold shadow-md cursor-pointer"
          >
            ORDER NOW
          </button>
          <button
            onClick={onOpenBooking}
            className="flex items-center gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full border-2 border-[#4C0016] text-xs sm:text-base font-bold uppercase text-[#4C0016] hover:bg-[#4C0016] hover:text-white transition-all cursor-pointer"
          >
            <span>MENU ≡</span>
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION 1 */}
      <section id="hero" className="relative min-h-[90vh] flex flex-col justify-between items-center pt-8 sm:pt-14 pb-8 px-4 text-center overflow-hidden">
        {/* Tilted Floating Badges */}
        <div className="w-full max-w-6xl mx-auto relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, rotate: -12 }}
            animate={{ scale: 1, rotate: -12 }}
            className="absolute -top-4 sm:top-2 left-2 sm:left-12 bg-[#FFC614] text-[#4C0016] font-modak text-xl sm:text-4xl px-3 sm:px-6 py-1 rounded-2xl border-2 border-[#4C0016] shadow-lg transform -rotate-12 z-20"
          >
            SMASHED FRESH
          </motion.div>

          <motion.div
            initial={{ scale: 0.8, rotate: 15 }}
            animate={{ scale: 1, rotate: 15 }}
            className="absolute -top-4 sm:top-2 right-2 sm:right-12 bg-[#FFC614] text-[#4C0016] font-modak text-xl sm:text-4xl px-3 sm:px-6 py-1 rounded-2xl border-2 border-[#4C0016] shadow-lg transform rotate-15 z-20"
          >
            BOLD FLAVOR
          </motion.div>

          <h1 className="font-modak text-6xl sm:text-[11vw] text-[#EF1624] text-stroke-180 leading-none tracking-tight drop-shadow-md">
            THE BURGER
          </h1>

          {/* Center Hero Image with Animated Cartoon Eyes */}
          <div className="relative my-4 sm:my-6 w-64 h-64 sm:w-96 sm:h-96 mx-auto group">
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

          <h2 className="font-modak text-5xl sm:text-[9vw] text-[#FFC614] text-stroke-dark leading-none tracking-wide">
            {brandName}
          </h2>
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

      {/* JELLY WAVE DIVIDER 1 */}
      <div className="w-full overflow-hidden leading-none z-20 relative">
        <svg className="w-full h-16 sm:h-28" viewBox="0 0 1536 300" fill="none" preserveAspectRatio="none">
          <path d="M1536,0 H-1 V135 S184.32,65 460.8,155 S860.16,105 1121.28,137 S1413.12,105 1536,105 V0" fill="#EF1624" />
        </svg>
      </div>

      {/* 3. SECTION 2: TOP CLASSIC (RED BACKGROUND #EF1624) */}
      <section className="bg-[#EF1624] text-white py-12 px-4 sm:px-10 text-center relative overflow-hidden">
        <div className="inline-block bg-[#FFC614] text-[#4C0016] font-modak text-lg sm:text-2xl px-4 py-1 rounded-full border-2 border-white transform -rotate-5 mb-4 shadow-lg">
          TOP CLASSIC ★
        </div>

        <h2 className="font-modak text-4xl sm:text-8xl text-white text-stroke-red leading-none mb-4 uppercase">
          JUICY CHEESY FULLY LOADED
        </h2>

        <p className="max-w-2xl mx-auto font-mouse-memoirs text-xl sm:text-3xl text-[#F5E3CD] leading-snug mb-8">
          {lead.name} is back and bolder than ever. Honoring our rich culinary roots, we bring you the ultimate smashed experience — hot, fresh & fully loaded in {lead.city}!
        </p>

        {/* Red Wavy Blob Order Button */}
        <button
          onClick={onOpenBooking}
          className="inline-block bg-[#FFC614] hover:bg-white text-[#EF1624] font-modak text-2xl sm:text-4xl px-8 sm:px-12 py-3 sm:py-4 rounded-full border-4 border-white shadow-2xl transition-all hover:scale-105 cursor-pointer uppercase mb-12"
        >
          ORDER NOW →
        </button>

        {/* 3 Tilted Showcase Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto items-center">
          <div className="bg-[#F5E3CD] p-3 rounded-3xl border-4 border-[#4C0016] shadow-xl transform sm:-rotate-6 hover:rotate-0 transition-transform duration-300">
            <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80" alt="Artisan Smash Burger" className="w-full h-48 sm:h-56 object-cover rounded-2xl mb-3" />
            <h3 className="font-modak text-xl text-[#EF1624] uppercase">Double Smashed Patty</h3>
            <p className="font-mouse-memoirs text-base text-[#4C0016]">Caramelized crust & chili honey glaze</p>
          </div>

          <div className="bg-[#F5E3CD] p-3 rounded-3xl border-4 border-[#4C0016] shadow-xl transform sm:rotate-0 hover:scale-105 transition-transform duration-300 z-10">
            <img src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80" alt="Cheesy Loaded" className="w-full h-48 sm:h-56 object-cover rounded-2xl mb-3" />
            <h3 className="font-modak text-xl text-[#EF1624] uppercase">Cheesy Loaded Smash</h3>
            <p className="font-mouse-memoirs text-base text-[#4C0016]">Extra cheddar & smoky bacon relish</p>
          </div>

          <div className="bg-[#F5E3CD] p-3 rounded-3xl border-4 border-[#4C0016] shadow-xl transform sm:rotate-6 hover:rotate-0 transition-transform duration-300">
            <img src="https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80" alt="Golden Fries" className="w-full h-48 sm:h-56 object-cover rounded-2xl mb-3" />
            <h3 className="font-modak text-xl text-[#EF1624] uppercase">Peri Peri Golden Fries</h3>
            <p className="font-mouse-memoirs text-base text-[#4C0016]">Hand-cut skin-on fries with truffle mayo</p>
          </div>
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
          {["BERLIN", "LONDON", "NEW YORK", "SYDNEY", "TOKYO"].map((loc, idx) => (
            <div
              key={idx}
              className="bg-white/90 p-4 rounded-3xl border-3 border-[#4C0016] shadow-lg flex flex-col items-center w-36 sm:w-44 hover:scale-105 transition-transform"
            >
              <h4 className="font-modak text-lg text-[#EF1624] uppercase">{loc}</h4>
              <p className="font-mouse-memoirs text-xs text-[#4C0016]">Smash Kitchen Express</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FOOTER & EMBEDDED GOOGLE MAP */}
      <footer className="bg-[#4C0016] text-[#F5E3CD] py-12 px-4 sm:px-10 text-center relative">
        <h2 className="font-modak text-5xl sm:text-8xl text-[#FFC614] text-stroke-dark uppercase mb-4">
          FEEL THE CHANGE
        </h2>
        <p className="font-mouse-memoirs text-xl sm:text-2xl max-w-xl mx-auto mb-6">
          Smashed for the bold, built for the hungry. Visit us at {lead.address || lead.city}!
        </p>

        <button
          onClick={onOpenBooking}
          className="bg-[#EF1624] hover:bg-[#FFC614] hover:text-[#4C0016] text-white font-modak text-xl sm:text-3xl px-8 py-3 rounded-full border-2 border-white shadow-xl transition-all cursor-pointer mb-10"
        >
          RESERVE TABLE / ORDER WHATSAPP →
        </button>

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
          © 2026 {lead.name} • All rights reserved • Powered by ClientForge Live Preview Engine
        </div>
      </footer>
    </div>
  );
}
