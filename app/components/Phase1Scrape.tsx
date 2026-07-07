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
  onNext,
  onPrev,
}: {
  leads: Lead[];
  setLeads: (l: Lead[]) => void;
  onNext: () => void;
  onPrev?: () => void;
}) {
  const { getIdToken, quota, updateQuota } = useAuth();
  const [input, setInput] = useState<ScrapeInput>({ niche: "Dentist", city: "Bandra, Mumbai", count: 12 });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const remaining = quota?.remaining ?? 0;
  const maxCount = Math.max(1, Math.min(25, remaining || 1));

  async function runScrape() {
    if (remaining <= 0) {
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
      const res = await fetch("/api/export/leads", {
        headers: { authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Export failed");
      }

      const csv = await res.blob();
      const url = URL.createObjectURL(csv);
      const link = document.createElement("a");
      link.href = url;
      link.download = "lead-to-launch-leads.csv";
      link.click();
      URL.revokeObjectURL(url);
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
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Target</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="niche" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Niche</Label>
              <Input id="niche" autoComplete="off" value={input.niche} onChange={(e) => setInput({ ...input, niche: e.target.value })} placeholder="e.g. Dentist" className="h-10 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Location</Label>
              <Input id="city" autoComplete="off" value={input.city} onChange={(e) => setInput({ ...input, city: e.target.value })} placeholder="e.g. Bandra, Mumbai" className="h-10 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="count" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Count</Label>
              <Input id="count" type="number" inputMode="numeric" min={1} max={maxCount} value={input.count} onChange={(e) => setInput({ ...input, count: Number(e.target.value) })} className="h-10 text-base font-mono tabular-nums" />
              <p className="text-[11px] text-muted-foreground">Max {maxCount} available right now.</p>
            </div>
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Free account</div>
                <div className="font-mono text-sm tabular-nums">{remaining}/{quota?.leadLimit ?? 15} leads left</div>
              </div>
              <ShieldCheck className="h-4 w-4 text-[color:var(--accent-foreground)]" aria-hidden="true" />
            </div>
            <Button onClick={runScrape} disabled={loading} className="w-full h-11 transition-transform duration-150 active:scale-[0.98]">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scraping...</> : remaining <= 0 ? "Increase lead limit" : "Scrape leads"}
            </Button>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Stat label="Found" value={leads.length} />
              <Stat label="With phone" value={leads.filter((l) => l.phone).length} />
              <Stat label="No site" value={leads.filter((l) => !l.website).length} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Live map</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadMap leads={leads} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Saved leads</CardTitle>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={exporting || leads.length === 0}>
            {exporting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Site</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {leads.map((l, i) => (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-b border-border"
                    >
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{l.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {l.address}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col gap-0.5">
                          {l.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {l.phone}</span>}
                          {l.whatsapp && <span className="flex items-center gap-1 text-[color:var(--accent-foreground)]"><MessageCircle className="h-3 w-3" /> WhatsApp</span>}
                          {l.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {l.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-[color:var(--chart-4)] text-[color:var(--chart-4)]" />
                          <span className="font-medium">{l.rating?.toFixed(1)}</span>
                          <span className="text-muted-foreground text-xs">({l.reviewsCount})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {l.website ? (
                          <Badge variant="secondary" className="text-xs font-normal"><Globe className="h-3 w-3 mr-1" /> Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs font-normal text-[color:var(--destructive)] border-[color:var(--destructive)]/40 bg-[color:var(--destructive)]/5">No site</Badge>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
            {leads.length === 0 && !loading && (
              <div className="text-center py-12 text-sm text-muted-foreground">Run a scrape to save leads to your account</div>
            )}
          </div>
        </CardContent>
      </Card>
      <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Free leads finished</DialogTitle>
            <DialogDescription>
              Aapka 15 free leads quota complete ho gaya hai. Limit increase karne ke liye WhatsApp par message bhejo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
            <a
              href={WHATSAPP_LIMIT_URL}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ className: "h-10" })}
            >
              <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
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
    <div className="rounded-md border border-border px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <div className="font-display text-xl tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
