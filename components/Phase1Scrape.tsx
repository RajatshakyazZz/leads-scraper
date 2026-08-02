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
import { Download, Loader2, MapPin, Phone, Star, Globe, MessageCircle, Mail, ShieldCheck } from "lucide-react";
import type { Lead, ScrapeInput } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

const LeadMap = dynamic(() => import("./LeadMap"), { ssr: false });
const WHATSAPP_LIMIT_URL = `https://wa.me/917895317940?text=${encodeURIComponent("Hi, I want to increase my Lead to Launch leads limit.")}`;

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
    try {
      const token = await getIdToken();
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(nextInput),
      });
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
      // Stagger in for visual drama
      for (let i = 0; i < data.leads.length; i++) {
        await new Promise((r) => setTimeout(r, 80));
        setLeads(data.leads.slice(0, i + 1));
      }
      toast.success(`${data.leads.length} leads scraped from ${nextInput.city}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
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
      subtitle="Pull local businesses from Google Maps. We capture contact, reviews, photos, and location to score conversion potential."
      onPrev={onPrev}
      onNext={onNext}
      nextDisabled={leads.length === 0}
      nextLabel="Audit these leads"
    >
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-200/20 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-base tracking-tight font-bold text-slate-900">Target Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <div className="space-y-1.5">
              <Label htmlFor="niche" className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold">Niche</Label>
              <Input id="niche" autoComplete="off" value={input.niche} onChange={(e) => setInput({ ...input, niche: e.target.value })} placeholder="e.g. Dentist" className="h-9.5 text-sm rounded-xl border-sky-100 focus-visible:ring-1 focus-visible:ring-sky-500 bg-sky-50/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold">Location</Label>
              <Input id="city" autoComplete="off" value={input.city} onChange={(e) => setInput({ ...input, city: e.target.value })} placeholder="e.g. Bandra, Mumbai" className="h-9.5 text-sm rounded-xl border-sky-100 focus-visible:ring-1 focus-visible:ring-sky-500 bg-sky-50/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="count" className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold">Count</Label>
              <Input id="count" type="number" inputMode="numeric" min={1} max={maxCount} value={input.count} onChange={(e) => setInput({ ...input, count: Number(e.target.value) })} className="h-9.5 text-sm rounded-xl border-sky-100 focus-visible:ring-1 focus-visible:ring-sky-500 font-mono tabular-nums bg-sky-50/20" />
              <p className="text-[10px] text-slate-500 mt-1">Maximum {maxCount} credits available in current quota.</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-2xs">
              <div>
                <div className="text-[9px] uppercase tracking-[0.14em] text-sky-700 font-bold">Account Balance</div>
                <div className="font-mono text-xs tabular-nums font-bold text-slate-900 mt-0.5">{quota ? remaining : DEFAULT_LEAD_LIMIT}/{quota?.leadLimit ?? DEFAULT_LEAD_LIMIT} leads remaining</div>
              </div>
              <ShieldCheck className="h-4.5 w-4.5 text-sky-600" aria-hidden="true" />
            </div>
            <Button onClick={runScrape} disabled={loading} className="w-full h-10.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-md shadow-sky-600/20 cursor-pointer transition-all">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scraping...</> : (quota && quota.remaining <= 0) ? "Increase lead limit" : "Scrape leads"}
            </Button>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Stat label="Found" value={leads.length} />
              <Stat label="With phone" value={leads.filter((l) => l.phone).length} />
              <Stat label="No site" value={leads.filter((l) => !l.website).length} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5 overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-base tracking-tight font-bold text-slate-900">Live Map</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px] md:h-[400px] p-0 relative">
            <div className="absolute inset-0 z-0">
              <LeadMap leads={leads} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3 pt-5 px-5">
          <CardTitle className="text-base tracking-tight font-bold text-slate-900">Saved Leads</CardTitle>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={exporting || leads.length === 0} className="h-8.5 px-3.5 rounded-xl border-sky-200 hover:bg-sky-50 text-xs font-semibold text-sky-700 transition-colors">
            {exporting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-sky-600" /> : <Download className="h-3.5 w-3.5 mr-1.5 text-sky-600" />}
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="pb-5 px-5">
          <div className="overflow-x-auto rounded-xl border border-sky-100 bg-white">
            <Table>
              <TableHeader className="bg-sky-50/60">
                <TableRow className="border-b border-sky-100 hover:bg-transparent">
                  <TableHead className="w-12 text-center text-xs font-bold text-slate-500 py-2.5">#</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 py-2.5">Business</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 py-2.5">Contact</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 py-2.5">Reviews</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 py-2.5">Site Presence</TableHead>
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
                      className="border-b border-sky-100/60 hover:bg-sky-50/30 transition-colors"
                    >
                      <TableCell className="text-center font-mono text-xs text-slate-400 py-3 tabular-nums">{i + 1}</TableCell>
                      <TableCell className="py-3">
                        <div className="font-bold text-sm text-slate-900">{l.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-sans">
                          <MapPin className="h-3 w-3 text-slate-400" /> {l.address}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1 text-xs">
                          {l.phone && <span className="flex items-center gap-1.5 text-slate-800 font-mono tabular-nums"><Phone className="h-3 w-3 text-slate-400" /> {l.phone}</span>}
                          {l.whatsapp && <span className="flex items-center gap-1.5 text-sky-600 font-semibold"><MessageCircle className="h-3 w-3 text-sky-500" /> WhatsApp</span>}
                          {l.email && <span className="flex items-center gap-1.5 text-slate-800 font-mono tabular-nums"><Mail className="h-3 w-3 text-slate-400" /> {l.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5 font-mono tabular-nums">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-sm text-slate-900">{l.rating?.toFixed(1)}</span>
                          <span className="text-slate-400 text-xs font-sans">({l.reviewsCount})</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {l.website ? (
                          <Badge variant="secondary" className="text-[10px] font-semibold h-5 px-2 bg-sky-50 text-sky-700 border border-sky-200"><Globe className="h-3 w-3 mr-1 text-sky-600" /> Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-semibold h-5 px-2 text-rose-600 border-rose-200 bg-rose-50">No site</Badge>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
            {leads.length === 0 && !loading && (
              <div className="text-center py-12 text-sm text-slate-500 font-sans">Run a search to find and save leads to your workspace</div>
            )}
          </div>
        </CardContent>
      </Card>
      <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
        <DialogContent className="rounded-2xl border border-sky-100 shadow-2xl max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-sans font-bold text-slate-900">Free leads limit reached</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 font-sans mt-1.5">
              Aapka 15 free leads quota complete ho gaya hai. Limit increase karne ke liye WhatsApp par message bhejo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose render={<Button variant="outline" className="rounded-xl h-9.5 text-xs font-semibold" />}>Close</DialogClose>
            <a
              href={WHATSAPP_LIMIT_URL}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ className: "h-9.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/20" })}
            >
              <MessageCircle className="h-4 w-4 mr-1.5" aria-hidden="true" />
              WhatsApp
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PhaseShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-sky-100 bg-sky-50/40 px-3 py-2 flex flex-col justify-between">
      <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">{label}</div>
      <div className="font-mono text-lg font-bold tabular-nums text-sky-900 mt-0.5">{value}</div>
    </div>
  );
}
