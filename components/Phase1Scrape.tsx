"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhaseShell } from "./PhaseShell";
import { Download, Loader2, MapPin, Phone, Star, Globe, MessageCircle, Mail, ShieldCheck, Zap, Radio, Search, CheckCircle2, Sparkles, Navigation, Layers } from "lucide-react";
import type { Lead, ScrapeInput } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

const LeadMap = dynamic(() => import("./LeadMap"), { ssr: false });
const WHATSAPP_LIMIT_URL = `https://wa.me/917895317940?text=${encodeURIComponent("Hi, I want to increase my Lead to Launch leads limit.")}`;

const SCRAPE_STEPS = [
  { id: 1, label: "1. Connect Radar", minPct: 0 },
  { id: 2, label: "2. Scan G-Maps", minPct: 25 },
  { id: 3, label: "3. Extract Contacts", minPct: 50 },
  { id: 4, label: "4. Index Workspace", minPct: 85 },
];

export function Phase1Scrape({
  leads,
  setLeads,
  sessionId,
  setSessionId,
  onNext,
  onPrev,
}: {
  leads: Lead[];
  setLeads: (l: Lead[]) => void;
  sessionId?: string | null;
  setSessionId?: (id: string | null) => void;
  onNext: () => void;
  onPrev?: () => void;
}) {
  const { getIdToken, quota, updateQuota } = useAuth();
  const [input, setInput] = useState<ScrapeInput>({ niche: "Dentist", city: "Bandra, Mumbai", count: 12 });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);

  // Prominent Scrape Progress State
  const [progress, setProgress] = useState(0);
  const [scrapeStage, setScrapeStage] = useState("");
  const [currentLeadCount, setCurrentLeadCount] = useState(0);
  const [totalTargetCount, setTotalTargetCount] = useState(0);

  const DEFAULT_LEAD_LIMIT = 15;
  const remaining = quota?.remaining ?? DEFAULT_LEAD_LIMIT;
  const maxCount = Math.max(1, Math.min(25, remaining));

  async function runScrape() {
    if (quota && quota.remaining <= 0) {
      setLimitDialogOpen(true);
      return;
    }

    const nextInput = {
      ...input,
      count: Math.max(1, Math.min(Number(input.count) || 1, maxCount)),
    };

    if (nextInput.count !== input.count) {
      setInput(nextInput);
    }

    setLoading(true);
    setProgress(5);
    setScrapeStage(`📡 Connecting Google Maps Radar API for "${nextInput.niche}"...`);
    setCurrentLeadCount(0);
    setTotalTargetCount(nextInput.count);

    // Initial API simulation progress interval
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 42) {
          if (prev === 15) setScrapeStage(`🔍 Scanning Google Maps listings for "${nextInput.niche}" in ${nextInput.city}...`);
          if (prev === 30) setScrapeStage(`📍 Resolving GPS location coordinates & place IDs...`);
          return prev + 4;
        }
        return prev;
      });
    }, 150);

    try {
      const token = await getIdToken();
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(nextInput),
      });
      clearInterval(progressTimer);

      const data = await res.json();
      if (data.quota) updateQuota(data.quota);
      if (!res.ok) {
        if (data.code === "LEAD_LIMIT_REACHED") setLimitDialogOpen(true);
        throw new Error(data.error ?? "Scrape failed");
      }

      if (setSessionId && data.sessionId) {
        setSessionId(data.sessionId);
      }

      setLeads([]);
      setProgress(48);
      const totalLeads = data.leads.length;
      setTotalTargetCount(totalLeads);

      // Stagger leads into state with accurate incremental percentage
      for (let i = 0; i < totalLeads; i++) {
        const lead = data.leads[i];
        await new Promise((r) => setTimeout(r, 90));
        setLeads(data.leads.slice(0, i + 1));
        setCurrentLeadCount(i + 1);

        const currentPct = Math.min(98, Math.round(48 + ((i + 1) / totalLeads) * 48));
        setProgress(currentPct);
        setScrapeStage(`📞 Extracting phone, WhatsApp & review metrics for "${lead.name}"...`);
      }

      setProgress(100);
      setScrapeStage(`✨ ${totalLeads} Businesses Scraped & Saved to Workspace Database!`);
      toast.success(`${totalLeads} leads scraped from ${nextInput.city}`);
    } catch (e) {
      clearInterval(progressTimer);
      setProgress(0);
      toast.error((e as Error).message);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 700);
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const token = await getIdToken();
      let url = "/api/export/leads";
      if (sessionId) {
        url += `?sessionId=${sessionId}`;
      }
      const res = await fetch(url, {
        headers: { authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Export failed");
      }

      const csv = await res.blob();
      const urlBlob = URL.createObjectURL(csv);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = sessionId ? `leads-session-${sessionId}.csv` : "lead-to-launch-leads.csv";
      link.click();
      URL.revokeObjectURL(urlBlob);
      toast.success("CSV exported");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <PhaseShell
      title="Phase 1 — Scrape leads"
      subtitle="Pull real-time business data directly from Google Maps. We capture contact info, rating, reviews, location, and web presence."
      onPrev={onPrev}
      onNext={onNext}
      nextDisabled={leads.length === 0}
      nextLabel="Audit these leads"
    >
      {/* Prominent High-Impact Interactive Scrape Radar Panel */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            className="mb-6 rounded-2xl border border-lime-500/50 bg-gradient-to-r from-[#0C1322] via-[#0F182C] to-[#0A101C] p-5 sm:p-6 shadow-2xl shadow-lime-500/10 relative overflow-hidden backdrop-blur-md"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header Row */}
            <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-lime-500/20 border border-lime-500/40 text-lime-400 flex items-center justify-center font-bold shrink-0 shadow-lg shadow-lime-500/20">
                  <Radio className="h-5 w-5 animate-pulse text-lime-400" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-extrabold uppercase tracking-[0.18em] text-lime-400">REALTIME GOOGLE MAPS API RADAR</div>
                  <h2 className="font-sans font-black text-lg sm:text-xl tracking-tight text-white uppercase leading-none mt-0.5">
                    SCRAPING PROSPECT LEADS IN PROGRESS...
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {totalTargetCount > 0 && (
                  <Badge className="bg-slate-900 border border-lime-500/30 text-lime-400 font-mono text-xs px-3 py-1 font-black uppercase tracking-wider tabular-nums">
                    Scraped {currentLeadCount} / {totalTargetCount} Businesses
                  </Badge>
                )}
                <div className="font-mono text-3xl sm:text-4xl font-black text-lime-400 tabular-nums drop-shadow-[0_0_12px_rgba(132,204,22,0.6)]">
                  {progress}%
                </div>
              </div>
            </div>

            {/* Prominent Large Interactive Animated Progress Bar */}
            <div className="mt-4 mb-4">
              <div className="w-full h-4 rounded-full bg-slate-950 overflow-hidden border border-slate-800 relative shadow-inner p-0.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-lime-500 via-lime-400 to-emerald-400 shadow-[0_0_20px_rgba(132,204,22,0.8)] rounded-full transition-all duration-300 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-shimmer" />
                </motion.div>
              </div>
            </div>

            {/* Realtime Stage Status Row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-slate-200">
                <Loader2 className="h-4 w-4 animate-spin text-lime-400 shrink-0" />
                <span className="text-white bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-800">{scrapeStage}</span>
              </div>

              {/* 4 Interactive Step Indicators */}
              <div className="flex items-center gap-2 flex-wrap">
                {SCRAPE_STEPS.map((s) => {
                  const active = progress >= s.minPct;
                  return (
                    <span
                      key={s.id}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-lg font-bold border transition-all ${
                        active
                          ? "bg-lime-500/10 border-lime-500/40 text-lime-400 shadow-xs"
                          : "bg-slate-900/60 border-slate-800 text-slate-500"
                      }`}
                    >
                      {active ? "✓ " : ""}{s.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 rounded-2xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="pb-3 pt-5 px-5 border-b border-slate-800">
            <CardTitle className="text-base tracking-tight font-black text-white uppercase flex items-center gap-2">
              <Zap className="h-4 w-4 text-lime-400" /> Target Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pt-4 pb-5">
            <div className="space-y-1.5">
              <Label htmlFor="niche" className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-extrabold font-mono">Niche Category</Label>
              <Input id="niche" autoComplete="off" value={input.niche} onChange={(e) => setInput({ ...input, niche: e.target.value })} placeholder="e.g. Dentist, Restaurant, Realtor" className="h-10 text-sm rounded-xl border-slate-800 bg-slate-900 text-white focus-visible:ring-1 focus-visible:ring-lime-400 font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-extrabold font-mono">City / Target Area</Label>
              <Input id="city" autoComplete="off" value={input.city} onChange={(e) => setInput({ ...input, city: e.target.value })} placeholder="e.g. Bandra, Mumbai" className="h-10 text-sm rounded-xl border-slate-800 bg-slate-900 text-white focus-visible:ring-1 focus-visible:ring-lime-400 font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="count" className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-extrabold font-mono">Lead Quantity</Label>
              <Input id="count" type="number" inputMode="numeric" min={1} max={maxCount} value={input.count} onChange={(e) => setInput({ ...input, count: Number(e.target.value) })} className="h-10 text-sm rounded-xl border-slate-800 bg-slate-900 text-white focus-visible:ring-1 focus-visible:ring-lime-400 font-mono font-bold tabular-nums" />
              <p className="text-[10px] text-slate-400 font-mono mt-1">Maximum {maxCount} credits available in current account.</p>
            </div>
            <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-xs">
              <div>
                <div className="text-[9px] uppercase tracking-[0.14em] text-lime-400 font-mono font-extrabold">Account Quota Balance</div>
                <div className="font-mono text-xs tabular-nums font-black text-white mt-0.5">{quota ? remaining : DEFAULT_LEAD_LIMIT}/{quota?.leadLimit ?? DEFAULT_LEAD_LIMIT} leads remaining</div>
              </div>
              <ShieldCheck className="h-5 w-5 text-lime-400" aria-hidden="true" />
            </div>

            <Button onClick={runScrape} disabled={loading} className="w-full h-11 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-lime-500/20 cursor-pointer transition-all">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin text-slate-950" /> Scraping ({progress}%)...</>
              ) : (quota && quota.remaining <= 0) ? (
                "Increase lead limit"
              ) : (
                "Scrape Leads Now →"
              )}
            </Button>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <Stat label="Found" value={leads.length} />
              <Stat label="With phone" value={leads.filter((l) => l.phone).length} />
              <Stat label="No site" value={leads.filter((l) => !l.website).length} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 rounded-2xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col relative">
          <CardHeader className="pb-3 pt-5 px-5 border-b border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-base tracking-tight font-black text-white uppercase flex items-center gap-2">
              <MapPin className="h-4 w-4 text-lime-400" /> Realtime Scraped Google Map Radar
            </CardTitle>
            {loading && (
              <Badge className="bg-lime-500/10 text-lime-400 border border-lime-500/30 font-mono text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5 px-3 py-1">
                <Radio className="h-3.5 w-3.5 animate-spin text-lime-400" /> Radar Active ({progress}%)
              </Badge>
            )}
          </CardHeader>
          <CardContent className="h-[360px] md:h-full min-h-[380px] p-0 relative">
            <div className="absolute inset-0 z-0">
              <LeadMap leads={leads} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-2xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3 pt-5 px-5 border-b border-slate-800">
          <CardTitle className="text-base tracking-tight font-black text-white uppercase flex items-center gap-2">
            Scraped Businesses Table ({leads.length})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={exporting || leads.length === 0} className="h-9 px-4 rounded-xl border-slate-700 bg-slate-900 text-xs font-extrabold uppercase tracking-wider text-slate-200 hover:bg-slate-800 hover:text-white transition-colors">
            {exporting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-lime-400" /> : <Download className="h-3.5 w-3.5 mr-1.5 text-lime-400" />}
            Export CSV / Excel
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/80 border-b border-slate-800">
                <TableRow className="border-b border-slate-800 hover:bg-transparent">
                  <TableHead className="w-12 text-center text-xs font-black text-slate-400 py-3 uppercase font-mono">#</TableHead>
                  <TableHead className="text-xs font-black text-slate-400 py-3 uppercase font-mono">Business Name</TableHead>
                  <TableHead className="text-xs font-black text-slate-400 py-3 uppercase font-mono">Contact Details</TableHead>
                  <TableHead className="text-xs font-black text-slate-400 py-3 uppercase font-mono">Rating & Reviews</TableHead>
                  <TableHead className="text-xs font-black text-slate-400 py-3 uppercase font-mono">Site Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {leads.map((l, i) => (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
                    >
                      <TableCell className="text-center font-mono text-xs text-slate-500 py-3.5 tabular-nums font-bold">{i + 1}</TableCell>
                      <TableCell className="py-3.5">
                        <div className="font-black text-sm text-white font-serif">{l.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-sans">
                          <MapPin className="h-3 w-3 text-slate-500" /> {l.address}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex flex-col gap-1 text-xs">
                          {l.phone && <span className="flex items-center gap-1.5 text-slate-300 font-mono tabular-nums"><Phone className="h-3 w-3 text-lime-400" /> {l.phone}</span>}
                          {l.whatsapp && <span className="flex items-center gap-1.5 text-lime-400 font-extrabold font-mono"><MessageCircle className="h-3 w-3 text-lime-400" /> WhatsApp</span>}
                          {l.email && <span className="flex items-center gap-1.5 text-slate-300 font-mono tabular-nums"><Mail className="h-3 w-3 text-slate-500" /> {l.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 font-mono tabular-nums">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-black text-sm text-white">{l.rating?.toFixed(1)}</span>
                          <span className="text-slate-400 text-xs font-sans">({l.reviewsCount})</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        {l.website ? (
                          <Badge variant="secondary" className="text-[10px] font-extrabold h-5 px-2 bg-slate-800 text-lime-400 border border-lime-500/30 uppercase tracking-wider"><Globe className="h-3 w-3 mr-1 text-lime-400" /> Website Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-extrabold h-5 px-2 text-rose-400 border-rose-500/40 bg-rose-500/10 uppercase tracking-wider font-mono">No Website (High Value)</Badge>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
            {leads.length === 0 && !loading && (
              <div className="text-center py-12 text-sm text-slate-400 font-sans font-medium">Run a search to find and save leads to your workspace</div>
            )}
          </div>
        </CardContent>
      </Card>
      <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
        <DialogContent className="rounded-2xl border border-slate-800 shadow-2xl max-w-md bg-[#0F172A] text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white uppercase">Free leads limit reached</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
              Aapka free leads quota complete ho gaya hai. Limit increase karne ke liye WhatsApp par contact karein.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose render={<Button variant="outline" className="rounded-xl h-9.5 text-xs font-bold border-slate-700 text-slate-300" />}>Close</DialogClose>
            <a
              href={WHATSAPP_LIMIT_URL}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ className: "h-9.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-lime-500/20" })}
            >
              <MessageCircle className="h-4 w-4 mr-1.5" aria-hidden="true" />
              WhatsApp Support
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PhaseShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 flex flex-col justify-between">
      <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-extrabold font-mono">{label}</div>
      <div className="font-mono text-lg font-black tabular-nums text-lime-400 mt-0.5">{value}</div>
    </div>
  );
}
