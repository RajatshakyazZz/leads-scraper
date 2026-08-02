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
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(lead.id);
                }
              }}
              className={`cursor-pointer transition-all duration-200 rounded-xl border bg-white shadow-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:-translate-y-0.5 ${
                selectedId === lead.id
                  ? "ring-1 ring-primary border-primary/40 bg-primary/[0.03]"
                  : "border-border hover:border-primary/30 hover:shadow-premium-hover"
              }`}
            >
              <CardHeader className="pb-2.5 pt-5 px-5">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-[10px] flex items-center gap-1.5 font-bold tracking-[0.12em] uppercase text-primary">
                    <Crown className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.75} />
                    Rank · {String(i + 1).padStart(2, "0")}
                  </CardTitle>
                  <div className="font-mono text-3xl font-bold tabular-nums leading-none text-foreground">{lead.score}</div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <div className="font-bold text-sm leading-snug text-foreground truncate">{lead.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-sans truncate">{lead.address}</div>
                <div className="mt-3.5 flex items-center gap-2.5 text-xs font-sans text-muted-foreground font-mono tabular-nums">
                  <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />{lead.audit.estLostRevenuePerMonth.toLocaleString("en-IN")}/mo</span>
                  <span className="text-border">•</span>
                  <span>{lead.reviewsCount} reviews</span>
                </div>
                <div className="mt-3 flex gap-2 border-t border-border/80 pt-3">
                  {lead.phone && <Phone className="h-3.5 w-3.5 text-muted-foreground/70" strokeWidth={1.5} />}
                  {lead.whatsapp && <MessageCircle className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />}
                  {lead.email && <Mail className="h-3.5 w-3.5 text-muted-foreground/70" strokeWidth={1.5} />}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="rounded-xl border border-border bg-white shadow-premium">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-base tracking-tight font-bold text-foreground">All Prospects Ranked</CardTitle>
        </CardHeader>
        <CardContent className="pb-5 px-5">
          <div className="overflow-x-auto rounded-lg border border-border/80 bg-white">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="w-12 text-center text-xs font-semibold text-muted-foreground py-2.5">#</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground py-2.5">Business</TableHead>
                  <TableHead className="w-[280px] text-xs font-semibold text-muted-foreground py-2.5">Score Breakdown</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground py-2.5">₹ Lost / mo</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground py-2.5">Audit Details</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-muted-foreground py-2.5 pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((lead, i) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02, duration: 0.2 }}
                    aria-selected={selectedId === lead.id}
                    className={`border-b border-border/60 cursor-pointer transition-colors duration-150 hover:bg-secondary/30 ${selectedId === lead.id ? "bg-primary/[0.04]" : ""}`}
                    onClick={() => setSelectedId(lead.id)}
                  >
                    <TableCell className="text-center font-mono text-xs text-muted-foreground py-3 tabular-nums">{i + 1}</TableCell>
                    <TableCell className="py-3">
                      <div className="font-semibold text-sm text-foreground">{lead.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 font-mono tabular-nums">{lead.reviewsCount} reviews · {lead.rating}★</div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${lead.score}%` }}
                            transition={{ duration: 0.6, delay: i * 0.02, ease: "easeOut" }}
                            className="h-full bg-primary"
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-foreground w-9 text-right tabular-nums">{lead.score}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold tabular-nums text-foreground py-3">₹{lead.audit.estLostRevenuePerMonth.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="py-3">
                      {lead.audit.hasWebsite ? (
                        <Badge variant="secondary" className="text-[10px] font-medium h-5 px-2 bg-emerald-50 text-emerald-700 border border-emerald-200">{lead.audit.pageSpeedScore} PageSpeed</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-medium h-5 px-2 text-rose-600 border-rose-200 bg-rose-50">No site</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-3 pr-4">
                      <Button
                        size="sm"
                        variant={selectedId === lead.id ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(lead.id);
                        }}
                        className={`rounded-lg h-7 px-3 text-xs font-medium cursor-pointer ${
                          selectedId === lead.id ? "bg-primary text-primary-foreground shadow-xs" : "border-border hover:bg-secondary/60"
                        }`}
                      >
                        {selectedId === lead.id ? "Selected" : "Select"}
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
            {ranked.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground font-sans">Awaiting performance audits to rank prospects</div>}
          </div>
        </CardContent>
      </Card>
    </PhaseShell>
  );
}

