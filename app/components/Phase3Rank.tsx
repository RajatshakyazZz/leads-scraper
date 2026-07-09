"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PhaseShell } from "./PhaseShell";
import { IncompleteState } from "./IncompleteState";
import { Crown, IndianRupee, MessageCircle, Phone, Mail } from "lucide-react";
import type { Lead, AuditResult, RankedLead } from "@/lib/types";
import { scoreLead } from "@/lib/scoring";
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
          prevPhaseLabel={leads.length === 0 ? "Scrape" : "Audit"}
          onPrev={onPrev}
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
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {ranked.slice(0, 3).map((lead, i) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
          >
            <Card
              role="button"
              tabIndex={0}
              aria-pressed={selectedId === lead.id}
              aria-label={`Select rank ${i + 1}: ${lead.name}`}
              onClick={() => setSelectedId(lead.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(lead.id);
                }
              }}
              className={`cursor-pointer transition-all duration-300 rounded-2xl border-border/80 bg-card/85 backdrop-blur-md shadow-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:-translate-y-1 ${
                selectedId === lead.id
                  ? "ring-1 ring-primary/45 border-primary/25 bg-primary/[0.01]"
                  : "hover:border-primary/25 hover:shadow-premium-hover"
              }`}
            >
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-[10px] flex items-center gap-1.5 font-bold tracking-[0.15em] uppercase text-muted-foreground">
                    <Crown className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.5} />
                    Rank · {String(i + 1).padStart(2, "0")}
                  </CardTitle>
                  <div className="font-display text-3xl font-medium tabular-nums leading-none text-foreground">{lead.score}</div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <div className="font-medium text-sm sm:text-base leading-snug text-foreground truncate">{lead.name}</div>
                <div className="text-xs text-muted-foreground/90 mt-1 font-sans truncate">{lead.address}</div>
                <div className="mt-4 flex items-center gap-3 text-xs font-sans text-muted-foreground">
                  <span className="flex items-center gap-1.5"><IndianRupee className="h-3.5 w-3.5 text-muted-foreground/60" />{lead.audit.estLostRevenuePerMonth.toLocaleString("en-IN")}/mo</span>
                  <span className="text-border/60">•</span>
                  <span>{lead.reviewsCount} reviews</span>
                </div>
                <div className="mt-3.5 flex gap-2 border-t border-border/40 pt-3">
                  {lead.phone && <Phone className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={1.5} />}
                  {lead.whatsapp && <MessageCircle className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />}
                  {lead.email && <Mail className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={1.5} />}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="rounded-2xl border-border/80 bg-card/85 backdrop-blur-md shadow-premium">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg tracking-tight font-medium text-foreground">All Prospects Ranked</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="overflow-x-auto rounded-xl border border-border/50 bg-background/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b border-border/60 hover:bg-transparent">
                  <TableHead className="w-12 text-center text-xs font-semibold text-muted-foreground py-3">#</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground py-3">Business</TableHead>
                  <TableHead className="w-[280px] text-xs font-semibold text-muted-foreground py-3">Score Breakdown</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground py-3">₹ Lost / mo</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground py-3">Audit Details</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-muted-foreground py-3 pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((lead, i) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02, duration: 0.3 }}
                    aria-selected={selectedId === lead.id}
                    className={`border-b border-border/50 cursor-pointer transition-colors duration-200 hover:bg-muted/30 ${selectedId === lead.id ? "bg-primary/[0.03]" : ""}`}
                    onClick={() => setSelectedId(lead.id)}
                  >
                    <TableCell className="text-center font-mono text-xs text-muted-foreground/80 py-3.5">{i + 1}</TableCell>
                    <TableCell className="py-3.5">
                      <div className="font-medium text-sm text-foreground">{lead.name}</div>
                      <div className="text-xs text-muted-foreground/90 mt-1 font-sans">{lead.reviewsCount} reviews · {lead.rating}★</div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-1.5 flex-1 rounded-full bg-muted/60 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${lead.score}%` }}
                            transition={{ duration: 0.8, delay: i * 0.03, ease: "easeOut" }}
                            className="h-full bg-primary"
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-foreground w-9 text-right">{lead.score}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium tabular-nums text-foreground py-3.5">₹{lead.audit.estLostRevenuePerMonth.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="py-3.5">
                      {lead.audit.hasWebsite ? (
                        <Badge variant="secondary" className="text-[10px] font-medium h-5.5 px-2 bg-emerald-500/5 text-emerald-600 border border-emerald-500/20">{lead.audit.pageSpeedScore} PageSpeed</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-medium h-5.5 px-2 text-rose-500 border-rose-500/30 bg-rose-500/5">No site</Badge>
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
                        className="rounded-xl h-8 text-xs cursor-pointer"
                      >
                        {selectedId === lead.id ? "Selected" : "Select"}
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
            {ranked.length === 0 && <div className="text-center py-16 text-sm text-muted-foreground italic font-sans">Awaiting performance audits to rank prospects</div>}
          </div>
        </CardContent>
      </Card>
    </PhaseShell>
  );
}
