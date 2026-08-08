"use client";

import { useEffect, useState, useMemo, use } from "react";
import type { RankedLead } from "@/lib/types";
import {
  Loader2,
  ShieldCheck,
  Phone,
  MessageSquare,
  Share2,
  Copy,
  ExternalLink,
  Sparkles,
  Calendar,
  X,
  Stethoscope,
  Utensils,
  Building2,
  Scissors,
  Dumbbell,
  Star,
  CheckCircle2,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkle,
  Layers,
  Navigation,
  Heart,
  Monitor,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function PreviewPage({ params }: { params: Promise<{ previewId: string }> }) {
  const resolvedParams = use(params);
  const previewId = resolvedParams.previewId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<RankedLead | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    async function fetchPreview() {
      try {
        setLoading(true);
        const res = await fetch(`/api/previews/${previewId}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Preview link not found or expired.");
        }
        setLead(data.preview.lead);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    if (previewId) fetchPreview();
  }, [previewId]);

  const nichePreset = useMemo(() => (lead ? getNichePreset(lead.category, lead.name) : null), [lead]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Live preview link copied to clipboard!");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="h-10 w-10 animate-spin text-amber-400 mb-4" />
        <h2 className="text-lg font-bold text-slate-200">Loading Live Prospect Preview...</h2>
        <p className="text-xs text-slate-400 mt-1">Retrieving business details & real-time map</p>
      </div>
    );
  }

  if (error || !lead || !nichePreset) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="h-14 w-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xl mb-4 border border-rose-500/30">
          !
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Preview Not Found</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error || "This preview link could not be found."}</p>
        <Button onClick={() => window.location.href = "/"} className="bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs rounded-xl">
          Return to LeadForge Homepage
        </Button>
      </div>
    );
  }

  const cleanPhone = (lead.phone ?? "").replace(/\s/g, "");
  const waNumber = (lead.whatsapp ?? lead.phone ?? "919999999999").replace(/\D/g, "");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Toolbar with Viewport Switcher */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="truncate">
            <h1 className="font-bold text-xs sm:text-sm text-white truncate">{lead.name} — Live Website Preview</h1>
            <p className="text-[10px] text-amber-400/90 font-mono truncate">Lifetime Active Link • LeadForge Cold Lead Engine</p>
          </div>
        </div>

        {/* Viewport Switcher Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "desktop" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Desktop Fullscreen</span>
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "mobile" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mobile (375px)</span>
            </button>
          </div>

          <Button size="sm" onClick={copyLink} className="h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700">
            <Copy className="h-3.5 w-3.5 mr-1 text-amber-400" /> Share Link
          </Button>
          <Button size="sm" onClick={() => window.open(`https://wa.me/${waNumber}?text=Hi%20${encodeURIComponent(lead.name)}`, "_blank")} className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
            <MessageSquare className="h-3.5 w-3.5 mr-1" /> WhatsApp
          </Button>
        </div>
      </div>

      {/* Main Full Page / Mobile Viewport Render */}
      <div className="flex-1 overflow-y-auto bg-[#141414] p-0 sm:p-4 scrollbar-thin">
        <div
          className={`transition-all duration-300 ${
            viewMode === "mobile"
              ? "max-w-[375px] my-6 mx-auto bg-[#1a1a1a] rounded-3xl border-4 border-amber-500/40 shadow-2xl overflow-hidden min-h-[667px]"
              : "w-full min-h-screen bg-[#1a1a1a] shadow-2xl"
          }`}
        >
          <LiveWebsiteRenderer
            lead={lead}
            preset={nichePreset}
            tab="all"
            isMobile={viewMode === "mobile"}
            waNumber={waNumber}
            cleanPhone={cleanPhone}
            onOpenBooking={() => setShowBookingModal(true)}
          />
        </div>
      </div>

      {/* Booking Modal */}
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
                  <h4 className="font-bold text-amber-400 text-base">Make Table Reservation / Slot</h4>
                  <p className="text-xs text-slate-400">{lead.name}</p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Your Full Name</label>
                  <input type="text" placeholder="e.g. Rahul Sharma" className="w-full h-9 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Phone / WhatsApp Number</label>
                  <input type="tel" placeholder={lead.phone || "+91 95577 30531"} className="w-full h-9 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Select Specialty / Option</label>
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
                      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.name}, I would like to reserve a slot.`)}`, "_blank");
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
    </div>
  );
}

/* ============================================================================
   LIVE WEBSITE RENDERER FOR PUBLIC PREVIEW PAGE (PIXEL PERFECT MOBILE RESPONSIVE)
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
      {/* 1. SITE HEADER BAR */}
      <header className={`sticky top-0 z-20 ${theme.headerBg} backdrop-blur-md px-4 sm:px-6 py-3 border-b ${theme.headerBorder} flex items-center justify-between shadow-lg`}>
        <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl ${theme.badgeBg} flex items-center justify-center ${theme.accentText} font-bold shadow-md border ${theme.cardBorder}`}>
            <IconComp className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-base tracking-tight text-white leading-none font-serif flex items-center gap-1.5">
              <span>{lead.name}</span>
            </div>
            <div className={`text-[9px] sm:text-[10px] ${theme.accentText} font-bold uppercase tracking-wider mt-1`}>{preset.nicheCategory} • {lead.city}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-400 px-3 py-1 text-xs font-bold border border-amber-500/30">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> Open Today
          </span>
          <a
            href={`tel:${cleanPhone}`}
            className={`inline-flex items-center gap-1.5 rounded-xl ${theme.ctaBtn} px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold transition-all shadow-md`}
          >
            <Phone className="h-3 w-3 text-white" /> Call Direct
          </a>
        </div>
      </header>

      {/* CONTINUOUS REALTIME LOOP TICKER BAR */}
      <div className={`${theme.tickerBg} ${theme.tickerText} py-1.5 px-3 overflow-hidden relative border-b ${theme.headerBorder}`}>
        <motion.div
          animate={{ x: [0, -600] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex items-center gap-6 whitespace-nowrap text-[10px] sm:text-xs font-mono uppercase tracking-widest"
        >
          <span>★ {lead.rating ?? 4.8} Google Rated ({lead.reviewsCount ?? 334}+ Reviews)</span>
          <span>• Verified {preset.nicheCategory} in {lead.city}</span>
          <span>• 100% Instant WhatsApp Reservations</span>
          <span>• {lead.yearsInBusiness ?? 8}+ Years Heritage Trust in {lead.city}</span>
          <span>★ {lead.rating ?? 4.8} Google Rated ({lead.reviewsCount ?? 334}+ Reviews)</span>
          <span>• Verified {preset.nicheCategory} in {lead.city}</span>
        </motion.div>
      </div>

      <div className={`p-4 sm:p-8 space-y-6 sm:space-y-10 ${isMobile ? "max-w-full" : "max-w-7xl mx-auto"}`}>
        {/* 2. HERO BANNER */}
        <section className="space-y-4 sm:space-y-6">
          <div className={`rounded-2xl sm:rounded-3xl border ${theme.cardBorder} overflow-hidden shadow-2xl relative text-left group`}>
            <div className={`relative ${isMobile ? "h-64" : "h-64 sm:h-96"} w-full overflow-hidden`}>
              <img
                src={preset.heroImage}
                alt={lead.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-black/40" />
            </div>

            <div className="absolute inset-0 p-4 sm:p-10 flex flex-col justify-end text-white z-10">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] sm:text-xs font-bold text-amber-300 shadow-sm border border-amber-500/30 mb-2 w-fit">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{lead.rating ?? 4.8}★ Google Rated</span>
                <span className="text-slate-300">({lead.reviewsCount ?? 334}+ reviews)</span>
              </div>

              <div className="text-[10px] sm:text-sm text-amber-400 font-bold uppercase tracking-widest mb-1 font-serif">
                Welcome To <span className="text-white font-extrabold">{lead.name}</span>
              </div>

              <h2 className={`font-extrabold text-white tracking-tight leading-tight drop-shadow-md font-serif ${isMobile ? "text-lg" : "text-xl sm:text-4xl"} max-w-3xl`}>
                {preset.heroTitle}
              </h2>
              <p className={`text-slate-300 leading-relaxed mt-2 max-w-2xl font-sans drop-shadow-xs ${isMobile ? "text-[11px]" : "text-xs sm:text-base"}`}>
                {preset.heroSub}
              </p>

              <div className="mt-4 flex flex-wrap gap-2.5 items-center">
                <button
                  onClick={onOpenBooking}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {preset.ctaPrimary}
                </button>
                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 border border-slate-700 shadow-md transition-all"
                >
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
                  {preset.ctaSecondary}
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            {preset.trustBadges.map((badge, idx) => (
              <div key={idx} className={`bg-[#222222] border ${theme.cardBorder} rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-md flex flex-col items-center justify-center transition-all hover:border-amber-500/60`}>
                <CheckCircle2 className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.accentText} mb-1`} />
                <span className="text-[10px] sm:text-sm font-bold text-slate-200 leading-tight">{badge}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. SPECIALTIES (PIXEL PERFECT 1-COLUMN MOBILE LAYOUT) */}
        <section className="space-y-4 sm:space-y-6 pt-2">
          <div className={`flex items-center justify-between border-b ${theme.headerBorder} pb-2.5`}>
            <h3 className="font-bold text-sm sm:text-xl text-amber-400 uppercase tracking-wider flex items-center gap-2 font-serif">
              <Sparkle className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.accentText}`} /> Our Specialties & Menu
            </h3>
            <span className={`text-[10px] sm:text-xs font-bold ${theme.badgeBg} px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border ${theme.cardBorder}`}>{preset.services.length} Signature Offerings</span>
          </div>

          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
            {preset.services.map((srv, idx) => (
              <div key={idx} className={`rounded-2xl border ${theme.cardBorder} bg-[#222222] transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden group flex flex-col`}>
                <div className="h-40 sm:h-44 w-full overflow-hidden relative">
                  <img
                    src={srv.image}
                    alt={srv.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                  <div className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg ${theme.badgeBg} ${theme.accentText} font-bold flex items-center justify-center text-xs shadow-md border ${theme.cardBorder}`}>
                    {(srv as { badge?: string }).badge || `Option #${idx + 1}`}
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 text-white font-bold text-sm leading-tight drop-shadow-md font-serif">
                    {srv.title}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{srv.desc}</p>
                  <button
                    onClick={onOpenBooking}
                    className={`mt-3 text-xs font-bold ${theme.accentText} flex items-center gap-1 group-hover:translate-x-1 transition-transform`}
                  >
                    Book / Order Now →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. ABOUT */}
        <section className={`bg-[#222222] border ${theme.cardBorder} rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-3 relative overflow-hidden shadow-xl`}>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-lg text-amber-400 uppercase tracking-wider font-serif">About {lead.name}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-4xl">
            Welcome to <span className="font-bold text-white">{lead.name}</span> — {lead.city}'s premier {preset.nicheCategory.toLowerCase()} destination. Rated <span className="font-bold text-amber-400">{lead.rating ?? 4.8}/5 stars</span> from over <span className="font-bold text-white">{lead.reviewsCount ?? 334}+ verified reviews</span>. Located at {lead.address}, we deliver uncompromised quality, authentic flavors, and exceptional hospitality.
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm font-bold pt-1">
            <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 className="h-4 w-4" /> 100% Quality & Hygiene Guaranteed</span>
            <span className="flex items-center gap-1.5 text-amber-300"><ShieldCheck className="h-4 w-4" /> Certified Local Favorite</span>
          </div>
        </section>

        {/* 5. REVIEWS */}
        <section className="space-y-4 pt-2 overflow-hidden">
          <div className={`flex items-center justify-between border-b ${theme.headerBorder} pb-2.5`}>
            <h3 className="font-bold text-sm sm:text-xl text-amber-400 uppercase tracking-wider flex items-center gap-2 font-serif">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-400 text-amber-400" /> What Guests Say ({lead.reviewsCount ?? 334}+ Reviews)
            </h3>
            <span className="text-[10px] sm:text-xs text-amber-300 font-bold bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">{lead.rating ?? 4.8}★ Rating</span>
          </div>

          <div className="relative overflow-hidden py-1">
            <motion.div
              animate={{ x: [0, -900] }}
              transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
              className="flex items-center gap-4 sm:gap-5 whitespace-normal"
            >
              {[...preset.reviews, ...preset.reviews, ...preset.reviews].map((rev, idx) => (
                <div key={idx} className={`w-[260px] sm:w-[320px] shrink-0 p-4 sm:p-5 rounded-2xl border ${theme.cardBorder} bg-[#222222] shadow-md hover:border-amber-500/60 transition-all`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full ${theme.badgeBg} ${theme.accentText} font-bold text-xs flex items-center justify-center uppercase border border-amber-500/30`}>
                        {rev.author[0]}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-white font-serif">{rev.author}</div>
                        <div className="text-[9px] sm:text-[10px] text-amber-400 font-sans">{rev.source || "Google Review"}</div>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-amber-400 text-xs">
                      {"★".repeat(rev.rating)}
                    </div>
                  </div>
                  <p className="text-[11.5px] sm:text-xs text-slate-300 italic font-sans leading-relaxed">"{rev.text}"</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 6. FAQS */}
        <section className="space-y-4 pt-2">
          <div className={`border-b ${theme.headerBorder} pb-2.5`}>
            <h3 className="font-bold text-sm sm:text-xl text-amber-400 uppercase tracking-wider flex items-center gap-2 font-serif">
              <Layers className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.accentText}`} /> Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-2.5">
            {preset.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={`border ${theme.cardBorder} rounded-xl sm:rounded-2xl bg-[#222222] overflow-hidden shadow-md`}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between font-bold text-xs sm:text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.accentText} shrink-0`} /> : <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className={`px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-0 text-[11.5px] sm:text-sm text-slate-300 leading-relaxed font-sans border-t ${theme.headerBorder} bg-slate-900/50`}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. REALTIME MAP */}
        <section className="space-y-4 pt-2">
          <h3 className={`font-bold text-sm sm:text-xl text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b ${theme.headerBorder} pb-2.5 font-serif`}>
            <MapPin className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.accentText}`} /> Realtime Location & Google Maps
          </h3>

          <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${theme.cardBorder} bg-[#222222] shadow-md space-y-3.5`}>
            <div className="grid sm:grid-cols-3 gap-3 text-xs sm:text-sm text-slate-200">
              <div className="flex items-start gap-2.5">
                <MapPin className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.accentText} shrink-0 mt-0.5`} />
                <div>
                  <div className="font-bold text-white font-serif">{lead.name}</div>
                  <div className="text-slate-300 mt-0.5">{lead.address}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.accentText} shrink-0`} />
                <a href={`tel:${cleanPhone}`} className={`font-bold ${theme.accentText} hover:underline text-xs sm:text-sm`}>{lead.phone || "+91 95577 30531"}</a>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.accentText} shrink-0`} />
                <span className="text-slate-300">Monday – Sunday: 07:00 AM – 12:00 AM</span>
              </div>
            </div>

            <div className="h-52 sm:h-80 w-full rounded-2xl overflow-hidden border border-slate-700 shadow-inner relative bg-slate-900">
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
                className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold ${theme.accentText} hover:underline`}
              >
                <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Get Driving Directions on Google Maps →
              </a>
            </div>
          </div>
        </section>

        <footer className="pt-6 sm:pt-8 pb-4 sm:pb-6 border-t border-slate-800 text-center space-y-2">
          <div className="font-bold text-xs sm:text-sm text-amber-400 font-serif">{lead.name}</div>
          <div className="text-[11px] sm:text-xs text-slate-400 font-sans">© {new Date().getFullYear()} {lead.name}. All rights reserved. • Heritage Dining & Premium Local Site</div>
        </footer>
      </div>

      {/* MOBILE BOTTOM CTA BAR */}
      <div className="sticky bottom-0 inset-x-0 bg-stone-950 border-t border-amber-900/60 p-2.5 sm:p-3 flex items-center justify-around z-20 shadow-2xl">
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
   PRESETS ENGINE FOR PUBLIC PREVIEW PAGE
   ============================================================================ */
function getNichePreset(category: string, name: string) {
  const cat = `${category} ${name}`.toLowerCase();

  // 1. Restaurant / Cafe / Dining
  if (cat.includes("restau") || cat.includes("cafe") || cat.includes("food") || cat.includes("dini") || cat.includes("pizz") || cat.includes("baker") || cat.includes("biryan") || cat.includes("thali") || cat.includes("veg") || cat.includes("nawaab")) {
    return {
      nicheCategory: "Restaurant & Dining",
      icon: Utensils,
      heroImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
      heroTitle: "Premium Vegetarian Dining & Authentic Royal Cuisine",
      heroSub: "Experience royal culinary traditions with authentic North Indian, South Indian, Chinese & Mughlai delicacies. Rated #1 for family & tourist dining.",
      trustBadges: ["100% Pure Veg Kitchen", "FSSAI Certified 5★", "Instant WhatsApp Reservation"],
      theme: {
        bodyBg: "bg-[#141414]",
        headerBg: "bg-[#1a1a1a]/95 text-white",
        headerBorder: "border-amber-500/30",
        cardBorder: "border-amber-500/30",
        badgeBg: "bg-amber-500/20 text-amber-300",
        accentText: "text-amber-400",
        ctaBtn: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-amber-500/20",
        tickerBg: "bg-black",
        tickerText: "text-amber-300"
      },
      ctaPrimary: "Make Table Reservation",
      ctaSecondary: "View Digital Menu",
      services: [
        { title: "Signature Royal Maharaja Thali", desc: "A royal platter featuring Dal Makhani, Shahi Paneer, Mix Veg, Pulao, Raita, Butter Naan, Sweet & Papad.", image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80", badge: "Most Popular" },
        { title: "Navratan Korma (Mughlai Classic)", desc: "Cooked with nine selected vegetables, dry fruits, and a silky cashew gravy — an authentic taste of royalty.", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=400&q=80", badge: "Chef's Special" },
        { title: "Special Paneer Teen Zayka Tikka", desc: "Tri-color marinated paneer grilled in tandoor with three signature aromatic spice marinades.", image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=400&q=80", badge: "Spicy & Hot" },
        { title: "Crispy South Indian Dosa & Idli Platter", desc: "Golden paper butter dosas served with fresh coconut chutney and hot drumstick sambar.", image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80", badge: "All-Day Fresh" },
        { title: "Indo-Chinese Noodles & Crispy Manchurian", desc: "Wok-tossed Hakka noodles with crunchy vegetables and spicy Manchurian gravy.", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80", badge: "Kids Favorite" },
        { title: "Authentic Confectionery & Sweet Desserts", desc: "In-house authentic sweet Petha, royal Gulab Jamun, and Rabri Falooda.", image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80", badge: "Fresh Sweets" }
      ],
      reviews: [
        { author: "Rajesh Kumar", rating: 5, text: "Absolutely the best restaurant! The Maharaja Thali was incredible and the heritage view made our dining experience unforgettable.", source: "Local Guide · Google Review" },
        { author: "Priya Sharma", rating: 5, text: "Exceeded all expectations! Pure vegetarian food with authentic taste. Best veg restaurant without doubt!", source: "TripAdvisor Review" },
        { author: "Michael Thompson", rating: 5, text: "As a tourist from UK, I was looking for authentic Indian vegetarian food. Highly recommended!", source: "Tourist · Google Review" }
      ],
      faqs: [
        { q: "What makes this restaurant special?", a: "We combine prime location, 100% pure vegetarian multi-cuisine menu, 4.8/5 rating from 1200+ reviews, and dedicated family AC dining." },
        { q: "What are the operating hours?", a: "We are open daily from 7:00 AM to 12:00 AM." },
        { q: "Is this a pure vegetarian restaurant?", a: "Yes! We operate a 100% pure vegetarian kitchen with Jain food options available." },
        { q: "Do you accept table reservations?", a: "Yes, reserve tables instantly via WhatsApp or phone." }
      ]
    };
  }

  // Fallback preset
  return {
    nicheCategory: category || "Local Business",
    icon: Building2,
    heroImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    heroTitle: "Top-Rated Local Service & Guaranteed Quality",
    heroSub: `Serving ${name} customers in ${category} with transparent pricing, certified experts, and 100% satisfaction guarantee.`,
    trustBadges: ["Google 4.8★ Verified", "Certified Professionals", "Fast Service"],
    theme: {
      bodyBg: "bg-[#141414]",
      headerBg: "bg-[#1a1a1a]/95 text-white",
      headerBorder: "border-amber-500/30",
      cardBorder: "border-amber-500/30",
      badgeBg: "bg-amber-500/20 text-amber-300",
      accentText: "text-amber-400",
      ctaBtn: "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold",
      tickerBg: "bg-black",
      tickerText: "text-amber-300"
    },
    ctaPrimary: "Book on WhatsApp",
    ctaSecondary: "Call Direct",
    services: [
      { title: "Core Service", desc: "High quality execution.", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80", badge: "Popular" }
    ],
    reviews: [
      { author: "Siddharth Gupta", rating: 5, text: "Outstanding service! Prompt response on WhatsApp.", source: "Google Review" }
    ],
    faqs: [
      { q: "How quickly can I book?", a: "Contact us via WhatsApp for instant confirmation." }
    ]
  };
}
