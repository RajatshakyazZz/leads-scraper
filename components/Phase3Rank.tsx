"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PhaseShell } from "./PhaseShell";
import { IncompleteState } from "./IncompleteState";
import { Crown, IndianRupee, MessageCircle, Phone, Mail, CheckCircle2 } from "lucide-react";
import type { Lead, AuditResult, RankedLead } from "@/lib/types";
import { scoreLead, formatRevenueRange } from "@/lib/scoring";
import { useAuth } from "@/components/AuthProvider";

export function Phase3Rank({
  leads,
  audits,
  selectedId,
  setSelectedId,
  sessionId,
  onNext,
  onPrev,
}: {
  leads: Lead[];
  audits: Record<string, AuditResult>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  sessionId?: string | null;
  onNext: () => void;
  onPrev: () => void;
}) {
  const { getIdToken } = useAuth();
  const ranked: RankedLead[] = useMemo(() => {
    return leads
      .filter((l) => audits[l.id])
      .map((l) => scoreLead(l, audits[l.id]))
      .sort((a, b) => b.score - a.score);
  }, [leads, audits]);

  useEffect(() => {
    if (!sessionId || ranked.length === 0) return;
    
    async function saveRankings() {
      try {
        const token = await getIdToken();
        const rankingsObj: Record<string, { score: number; scoreBreakdown: RankedLead["scoreBreakdown"]; rank: number }> = {};
        ranked.forEach((item, index) => {
          rankingsObj[item.id] = {
            score: item.score,
            scoreBreakdown: item.scoreBreakdown,
            rank: index + 1
          };
        });
        
        await fetch(`/api/sessions/${sessionId}/rankings`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ rankings: rankingsObj })
        });
      } catch (err) {
        console.error("Failed to save rankings:", err);
      }
    }
    
    saveRankings();
  }, [sessionId, ranked, getIdToken]);

  if (ranked.length === 0) {
    return (
      <PhaseShell
        title="Phase 3 — Ranked prospects"
        subtitle="Conversion score blends site quality, review volume, rating, reachability, and industry fit. Pick one to build for."
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled
        nextLabel="Build website"
      >
        <IncompleteState
          title={leads.length === 0 ? "No leads scraped yet" : "No audits yet"}
          description={
            leads.length === 0
              ? "Phases 1 and 2 haven't been run. After scraping leads and auditing them, this page ranks each by conversion potential and lets you pick one to build for."
              : "Run an audit in Phase 2 first. Once leads have audits, we score them on site quality, review volume, rating, reachability, and industry fit — then sort for highest conversion potential."
          }
          actionLabel={leads.length === 0 ? "Go to Scrape" : "Go to Audit"}
          onAction={onPrev}
        />
      </PhaseShell>
    );
  }

  return (
    <PhaseShell
      title="Phase 3 — Ranked prospects"
      subtitle="Conversion score blends site quality, review volume, rating, reachability, and industry fit. Pick one to build for."
      onPrev={onPrev}
      onNext={onNext}
      nextDisabled={!selectedId}
      nextLabel="Build website"
    >
      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        {ranked.slice(0, 3).map((lead, i) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
          >
            <Card
              role="button"
              tabIndex={0}
              aria-pressed={selectedId === lead.id}
              aria-label={`Select rank ${i + 1}: ${lead.name}`}
              onClick={() => setSelectedId(lead.id)}
              className={`cursor-pointer transition-all duration-200 rounded-2xl border bg-[#111726]/90 backdrop-blur-md shadow-xl hover:-translate-y-0.5 ${
                selectedId === lead.id
                  ? "ring-2 ring-lime-400 border-lime-500/50 bg-slate-900/90"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <CardHeader className="pb-2.5 pt-5 px-5 border-b border-slate-800/80">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-[10px] flex items-center gap-1.5 font-black tracking-[0.16em] uppercase text-lime-400 font-mono">
                    <Crown className="h-4 w-4 text-amber-400" strokeWidth={2} />
                    Rank · {String(i + 1).padStart(2, "0")}
                  </CardTitle>
                  <div className="font-mono text-3xl font-black tabular-nums leading-none text-lime-400">{lead.score}</div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-4">
                <div className="font-black text-base leading-snug text-white font-serif truncate">{lead.name}</div>
                <div className="text-xs text-slate-400 mt-0.5 font-sans truncate">{lead.address}</div>
                <div className="mt-3.5 flex items-center gap-2.5 text-xs font-sans text-slate-300 font-mono tabular-nums">
                  <span className="flex items-center gap-1 text-red-400 font-bold"><IndianRupee className="h-3.5 w-3.5 text-red-500" />{formatRevenueRange(lead.audit.estLostRevenuePerMonth)}/mo</span>
                  <span className="text-slate-600">•</span>
                  <span>{lead.reviewsCount} reviews</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
                  <div className="flex gap-2">
                    {lead.phone && <Phone className="h-3.5 w-3.5 text-lime-400" strokeWidth={1.5} />}
                    {lead.whatsapp && <MessageCircle className="h-3.5 w-3.5 text-lime-400" strokeWidth={1.5} />}
                    {lead.email && <Mail className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />}
                  </div>
                  {selectedId === lead.id && (
                    <span className="text-[10px] font-extrabold text-lime-400 uppercase tracking-widest flex items-center gap-1 font-mono">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="rounded-2xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md shadow-2xl">
        <CardHeader className="pb-3 pt-5 px-5 border-b border-slate-800">
          <CardTitle className="text-base tracking-tight font-black text-white uppercase">All Prospects Ranked ({ranked.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/80 border-b border-slate-800">
                <TableRow className="border-b border-slate-800 hover:bg-transparent">
                  <TableHead className="w-12 text-center text-xs font-black text-slate-400 py-3 uppercase font-mono">#</TableHead>
                  <TableHead className="text-xs font-black text-slate-400 py-3 uppercase font-mono">Business Name</TableHead>
                  <TableHead className="w-[240px] text-xs font-black text-slate-400 py-3 uppercase font-mono">Opportunity Score</TableHead>
                  <TableHead className="text-xs font-black text-slate-400 py-3 uppercase font-mono">₹ Lost / mo (Est.)</TableHead>
                  <TableHead className="text-xs font-black text-slate-400 py-3 uppercase font-mono">Audit Status</TableHead>
                  <TableHead className="text-right text-xs font-black text-slate-400 py-3 pr-4 uppercase font-mono">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((lead, i) => (
                  <TableRow
                    key={lead.id}
                    aria-selected={selectedId === lead.id}
                    className={`border-b border-slate-800/60 cursor-pointer transition-colors duration-150 ${selectedId === lead.id ? "bg-slate-800/80" : "hover:bg-slate-800/30"}`}
                    onClick={() => setSelectedId(lead.id)}
                  >
                    <TableCell className="text-center font-mono text-xs text-slate-500 py-3.5 tabular-nums font-bold">{i + 1}</TableCell>
                    <TableCell className="py-3.5">
                      <div className="font-black text-sm text-white font-serif">{lead.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">{lead.reviewsCount} reviews · {lead.rating}★</div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-2 flex-1 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                          <div className="h-full bg-lime-400 rounded-full" style={{ width: `${lead.score}%` }} />
                        </div>
                        <span className="font-mono text-xs font-black text-lime-400 w-9 text-right tabular-nums">{lead.score}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-black tabular-nums text-red-400 py-3.5">{formatRevenueRange(lead.audit.estLostRevenuePerMonth)}</TableCell>
                    <TableCell className="py-3.5">
                      {lead.audit.hasWebsite ? (
                        <Badge variant="secondary" className="text-[10px] font-extrabold h-5 px-2 bg-slate-900 text-lime-400 border border-lime-500/30">{lead.audit.pageSpeedScore} PageSpeed</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-extrabold h-5 px-2 text-red-400 border-red-500/40 bg-red-500/10 font-mono">No site</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-3.5 pr-4">
                      <Button
                        size="sm"
                        variant={selectedId === lead.id ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(lead.id);
                        }}
                        className={`rounded-xl h-8 px-4 text-xs font-black uppercase tracking-wider cursor-pointer ${
                          selectedId === lead.id ? "bg-lime-500 text-slate-950 shadow-md shadow-lime-500/20" : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {selectedId === lead.id ? "Selected" : "Select"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {ranked.length === 0 && <div className="text-center py-12 text-sm text-slate-500 font-sans">Awaiting performance audits to rank prospects</div>}
          </div>
        </CardContent>
      </Card>
    </PhaseShell>
  );
}
