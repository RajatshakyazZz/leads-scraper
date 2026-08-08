"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { PhaseShell } from "./PhaseShell";
import { IncompleteState } from "./IncompleteState";
import { Loader2, AlertTriangle, IndianRupee, Gauge, Star, Phone, MessageCircle, Globe, Flame } from "lucide-react";
import type { Lead, AuditResult } from "@/lib/types";
import { formatRevenueRange, formatTotalRevenueRange } from "@/lib/scoring";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

export function Phase2Audit({
  leads,
  audits,
  setAudits,
  sessionId,
  onNext,
  onPrev,
}: {
  leads: Lead[];
  audits: Record<string, AuditResult>;
  setAudits: (a: Record<string, AuditResult>) => void;
  sessionId?: string | null;
  onNext: () => void;
  onPrev: () => void;
}) {
  const { getIdToken } = useAuth();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(leads.map((l) => l.id)));

  const allSelected = leads.length > 0 && selectedIds.size === leads.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(leads.map((l) => l.id)));
  }

  async function runAudit() {
    const targets = leads.filter((l) => selectedIds.has(l.id));
    if (targets.length === 0) {
      toast.error("Select at least one lead to audit");
      return;
    }
    setRunning(true);
    setProgress(0);
    try {
      const all: Record<string, AuditResult> = { ...audits };
      const BATCH_SIZE = 5;
      let completed = 0;

      for (let batchStart = 0; batchStart < targets.length; batchStart += BATCH_SIZE) {
        const batch = targets.slice(batchStart, batchStart + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (lead) => {
            const res = await fetch("/api/audit", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ lead }),
            });
            const data = await res.json();
            return { id: lead.id, audit: data.audit };
          }),
        );

        for (const result of results) {
          if (result.status === "fulfilled") {
            all[result.value.id] = result.value.audit;
          }
          completed++;
        }

        setAudits({ ...all });
        setProgress(Math.round((completed / targets.length) * 100));
      }

      if (sessionId) {
        try {
          const token = await getIdToken();
          await fetch(`/api/sessions/${sessionId}/audits`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ audits: all })
          });
        } catch (err) {
          console.error("Failed to save audits to session:", err);
        }
      }

      toast.success(`Audited ${targets.length} lead${targets.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const auditedCount = Object.keys(audits).length;
  const totalLost = Object.values(audits).reduce((s, a) => s + (a?.estLostRevenuePerMonth ?? 0), 0);

  // Incomplete state: Phase 1 not run yet
  if (leads.length === 0) {
    return (
      <PhaseShell
        title="Phase 2 — Business audit"
        subtitle="PageSpeed, mobile readiness, schema, gaps + AI-summarized biggest opportunity. Estimated revenue left on the table."
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled
        nextLabel="Rank prospects"
      >
        <IncompleteState
          title="No leads to audit yet"
          description="Phase 1 hasn't been run. Go back, run the scraper, and we'll audit each business's website performance, mobile readiness, and conversion gaps here."
          actionLabel="Go to Scrape"
          onAction={onPrev}
        />
      </PhaseShell>
    );
  }

  return (
    <PhaseShell
      title="Phase 2 — Business audit"
      subtitle="PageSpeed, mobile readiness, schema, gaps + AI-summarized biggest opportunity. Estimated revenue left on the table."
      onPrev={onPrev}
      onNext={onNext}
      nextDisabled={auditedCount === 0}
      nextLabel="Rank prospects"
    >
      {/* High Impact Coral Red Warning Banner */}
      <div className="mb-6 rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-red-900/20 to-slate-950 p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center font-black shrink-0 border border-red-500/40">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-red-400">THE REVENUE PROBLEM</div>
            <h2 className="font-sans font-black text-xl sm:text-2.5xl tracking-tight text-white uppercase leading-none">
              IS THIS <span className="text-red-500">YOUR REALITY?</span>
            </h2>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Est. Total Revenue Leakage</div>
          <div className="font-mono text-xl sm:text-2xl font-black text-white flex items-center justify-end">
            <IndianRupee className="h-5 w-5 text-red-500 mr-0.5" /> {formatTotalRevenueRange(totalLost)}<span className="text-xs text-slate-400 font-sans font-normal">/mo (est. total)</span>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-2xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md shadow-xl">
          <CardContent className="pt-5 pb-5 px-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold">Audited Ratio</div>
            <div className="font-mono text-2xl font-black tabular-nums text-white mt-1">{auditedCount}<span className="text-slate-500 text-lg font-sans font-normal"> / {leads.length}</span></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md shadow-xl">
          <CardContent className="pt-5 pb-5 px-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold">Offline Businesses</div>
            <div className="font-mono text-2xl font-black tabular-nums text-red-500 mt-1">
              {Object.values(audits).filter((a) => !a.hasWebsite).length}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md shadow-xl">
          <CardContent className="pt-5 pb-5 px-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold">Average PageSpeed</div>
            <div className="font-mono text-2xl font-black tabular-nums text-lime-400 mt-1">
              {auditedCount ? Math.round(Object.values(audits).reduce((s, a) => s + a.pageSpeedScore, 0) / auditedCount) : 0}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-slate-800 bg-[#111726]/90 backdrop-blur-md shadow-xl">
          <CardContent className="pt-5 pb-5 px-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold">Est. Monthly Lost Revenue</div>
            <div className="font-mono text-xl font-black tabular-nums text-red-500 flex items-center mt-1">
              <IndianRupee className="h-4 w-4 text-red-500 mr-0.5" strokeWidth={2} />{formatTotalRevenueRange(totalLost)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none font-sans text-sm text-white">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              aria-label={allSelected ? "Deselect all leads" : "Select all leads"}
              className="rounded-md border-slate-700 text-lime-500 bg-slate-900"
            />
            <span className="font-extrabold text-xs uppercase tracking-wider">
              {selectedIds.size === 0
                ? "Select leads to audit"
                : someSelected
                  ? `${selectedIds.size} of ${leads.length} selected`
                  : `All ${leads.length} selected`}
            </span>
          </label>
        </div>
        <div className="flex items-center gap-3">
          {running && <div className="w-48"><Progress value={progress} className="h-1.5 bg-slate-800" /></div>}
          <Button
            onClick={runAudit}
            disabled={running || selectedIds.size === 0}
            className="h-10 px-5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-lime-500/20 cursor-pointer transition-all"
          >
            {running ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin text-slate-950" /> Auditing...</>
            ) : (
              <>Run audit{selectedIds.size === leads.length ? " on all leads" : ` on ${selectedIds.size} selected`}</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {leads.map((lead, i) => {
          const a = audits[lead.id];
          const isSelected = selectedIds.has(lead.id);
          return (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, duration: 0.25 }}
            >
              <Card className={`h-full rounded-2xl border bg-[#111726]/90 backdrop-blur-md shadow-xl transition-all duration-200 ${isSelected ? "ring-2 ring-lime-400 border-lime-500/50" : "border-slate-800 hover:border-slate-700"}`}>
                <CardHeader className="pb-3 pt-5 px-5 border-b border-slate-800/80">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleOne(lead.id)}
                      aria-label={`Select ${lead.name} for audit`}
                      className="mt-0.5 rounded-md border-slate-700 text-lime-500 bg-slate-900"
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-black leading-snug text-white truncate font-serif">{lead.name}</CardTitle>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 mt-0.5 font-mono font-extrabold">{lead.category}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-5 pb-5 pt-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-300 font-sans">
                    <span className="flex items-center gap-1 font-mono tabular-nums">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={1.5} />
                      <span className="font-bold text-white">{lead.rating?.toFixed(1) ?? "—"}</span>
                      <span className="text-slate-400 font-sans">({lead.reviewsCount ?? 0})</span>
                    </span>
                    {lead.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-lime-400" strokeWidth={1.5} />
                        <span className="font-mono text-[11px] text-slate-300">{lead.phone.replace(/^\+91 /, "")}</span>
                      </span>
                    )}
                    {lead.whatsapp && (
                      <span className="flex items-center gap-1 text-lime-400 font-extrabold font-mono">
                        <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} /> WA
                      </span>
                    )}
                    {lead.website ? (
                      <Badge variant="secondary" className="text-[10px] font-extrabold h-5 px-2 bg-slate-900 text-lime-400 border border-lime-500/30">
                        <Globe className="h-2.5 w-2.5 mr-1 text-lime-400" strokeWidth={1.5} /> Has site
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-extrabold h-5 px-2 text-red-400 border-red-500/40 bg-red-500/10 font-mono">
                        No site
                      </Badge>
                    )}
                  </div>

                  {a ? (
                    <>
                      <div className="flex items-center gap-4 pt-3 border-t border-slate-800">
                        <PageSpeedGauge score={a.pageSpeedScore} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold">Est. Monthly Lost Revenue</div>
                          <div className="font-mono text-base font-black tabular-nums text-red-500 flex items-center mt-0.5">
                            <IndianRupee className="h-4 w-4 text-red-500 mr-0.5" strokeWidth={2} />{formatRevenueRange(a.estLostRevenuePerMonth)}<span className="text-[10px] font-sans font-normal text-slate-400 ml-1">/mo</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {a.gaps.slice(0, 3).map((g) => (
                          <Badge key={g} variant="outline" className="text-[10px] font-extrabold h-5 px-2 text-red-400 border-red-500/30 bg-red-500/10 font-mono">{g}</Badge>
                        ))}
                      </div>
                      <div className="rounded-xl bg-red-500/10 p-2.5 text-xs border border-red-500/30">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" strokeWidth={2} />
                          <span className="text-slate-300 leading-relaxed italic">&ldquo;{a.biggestGap}&rdquo;</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500 py-3 justify-center border-t border-slate-800 pt-3 font-mono font-bold">
                      <Gauge className="h-4 w-4 text-slate-500" strokeWidth={1.5} /> Awaiting performance audit
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </PhaseShell>
  );
}

function PageSpeedGauge({ score }: { score: number }) {
  const isGood = score >= 70;
  const isMed = score >= 50 && score < 70;
  
  const colorClass = score === 0 
    ? "text-red-500" 
    : isGood 
      ? "text-lime-400" 
      : isMed 
        ? "text-amber-400" 
        : "text-red-500";
        
  const ringClass = score === 0 
    ? "stroke-red-500" 
    : isGood 
      ? "stroke-lime-400" 
      : isMed 
        ? "stroke-amber-400" 
        : "stroke-red-500";

  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-13 w-13 shrink-0">
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        <circle cx="28" cy="28" r="22" className="stroke-slate-800 fill-none" strokeWidth="4" />
        <motion.circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className={ringClass}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-xs font-black font-mono tabular-nums ${colorClass}`}>
        {score || "—"}
      </div>
    </div>
  );
}
