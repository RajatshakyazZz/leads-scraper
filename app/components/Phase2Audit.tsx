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
import { Loader2, AlertTriangle, IndianRupee, Gauge, Star, Phone, MessageCircle, Globe } from "lucide-react";
import type { Lead, AuditResult } from "@/lib/types";
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
          prevPhaseLabel="Scrape"
          onPrev={onPrev}
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-2xl border-border/80 bg-card/85 backdrop-blur-md shadow-premium">
          <CardContent className="pt-6 pb-6">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Audited Prospect Ratio</div>
            <div className="font-display text-3xl font-medium tabular-nums text-foreground mt-2">{auditedCount}<span className="text-muted-foreground/40 text-xl font-sans"> / {leads.length}</span></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 bg-card/85 backdrop-blur-md shadow-premium">
          <CardContent className="pt-6 pb-6">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Offline Businesses</div>
            <div className="font-display text-3xl font-medium tabular-nums text-rose-500 mt-2">
              {Object.values(audits).filter((a) => !a.hasWebsite).length}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 bg-card/85 backdrop-blur-md shadow-premium">
          <CardContent className="pt-6 pb-6">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Average PageSpeed</div>
            <div className="font-display text-3xl font-medium tabular-nums text-foreground mt-2">
              {auditedCount ? Math.round(Object.values(audits).reduce((s, a) => s + a.pageSpeedScore, 0) / auditedCount) : 0}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 bg-card/85 backdrop-blur-md shadow-premium">
          <CardContent className="pt-6 pb-6">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Est. monthly lost revenue</div>
            <div className="font-display text-3xl font-medium tabular-nums text-foreground flex items-center mt-2">
              <IndianRupee className="h-6 w-6 text-muted-foreground/60 mr-0.5" strokeWidth={1.5} />{totalLost.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none font-sans text-sm text-foreground">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              aria-label={allSelected ? "Deselect all leads" : "Select all leads"}
              className="rounded-lg"
            />
            <span className="font-medium">
              {selectedIds.size === 0
                ? "Select leads to audit"
                : someSelected
                  ? `${selectedIds.size} of ${leads.length} selected`
                  : `All ${leads.length} selected`}
            </span>
          </label>
        </div>
        <div className="flex items-center gap-4">
          {running && <div className="w-48"><Progress value={progress} className="h-1.5" /></div>}
          <Button
            onClick={runAudit}
            disabled={running || selectedIds.size === 0}
            className="h-10 px-4 rounded-xl cursor-pointer"
          >
            {running ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Auditing...</>
            ) : (
              <>Run audit{selectedIds.size === leads.length ? " on all leads" : ` on ${selectedIds.size} selected`}</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.map((lead, i) => {
          const a = audits[lead.id];
          const isSelected = selectedIds.has(lead.id);
          return (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
            >
              <Card className={`h-full rounded-2xl border-border/80 bg-card/85 backdrop-blur-md shadow-premium transition-all duration-300 ${isSelected ? "ring-1 ring-primary/45 border-primary/20" : "hover:shadow-premium-hover hover:border-primary/25"}`}>
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleOne(lead.id)}
                      aria-label={`Select ${lead.name} for audit`}
                      className="mt-1 rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm sm:text-base font-medium leading-snug text-foreground truncate">{lead.name}</CardTitle>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80 mt-1 font-semibold">{lead.category}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-5 pb-5 pt-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground font-sans">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" strokeWidth={1.5} />
                      <span className="font-semibold text-foreground">{lead.rating?.toFixed(1) ?? "—"}</span>
                      <span className="text-muted-foreground/60">({lead.reviewsCount ?? 0})</span>
                    </span>
                    {lead.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground/50" strokeWidth={1.5} />
                        <span className="font-mono text-[11px] text-foreground">{lead.phone.replace(/^\+91 /, "")}</span>
                      </span>
                    )}
                    {lead.whatsapp && (
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} /> WA
                      </span>
                    )}
                    {lead.website ? (
                      <Badge variant="secondary" className="text-[10px] font-medium h-5.5 px-2 bg-emerald-500/5 text-emerald-600 border border-emerald-500/20">
                        <Globe className="h-2.5 w-2.5 mr-1 text-emerald-500" strokeWidth={1.5} /> Has site
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-medium h-5.5 px-2 text-rose-500 border-rose-500/30 bg-rose-500/5">
                        No site
                      </Badge>
                    )}
                  </div>

                  {a ? (
                    <>
                      <div className="flex items-center gap-4 pt-3.5 border-t border-border/50">
                        <PageSpeedGauge score={a.pageSpeedScore} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Est. monthly lost revenue</div>
                          <div className="font-display text-lg font-medium tabular-nums text-foreground flex items-center mt-1">
                            <IndianRupee className="h-4 w-4 text-muted-foreground/60 mr-0.5" strokeWidth={1.5} />{a.estLostRevenuePerMonth.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {a.gaps.slice(0, 3).map((g) => (
                          <Badge key={g} variant="outline" className="text-[10px] font-medium h-5.5 px-2 text-rose-500 border-rose-500/25 bg-rose-500/[0.02]">{g}</Badge>
                        ))}
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3 text-xs border border-border/50">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" strokeWidth={1.75} />
                          <span className="text-muted-foreground leading-relaxed italic">&ldquo;{a.biggestGap}&rdquo;</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 justify-center border-t border-border/50 pt-3">
                      <Gauge className="h-4 w-4 text-muted-foreground/60" strokeWidth={1.5} /> Awaiting performance audit
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
    ? "text-rose-500" 
    : isGood 
      ? "text-emerald-500" 
      : isMed 
        ? "text-amber-500" 
        : "text-rose-500";
        
  const ringClass = score === 0 
    ? "stroke-rose-500" 
    : isGood 
      ? "stroke-emerald-500" 
      : isMed 
        ? "stroke-amber-500" 
        : "stroke-rose-500";

  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        <circle cx="28" cy="28" r="22" className="stroke-border/70 fill-none" strokeWidth="4.5" />
        <motion.circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          strokeWidth="4.5"
          strokeLinecap="round"
          className={ringClass}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold font-mono tabular-nums ${colorClass}`}>
        {score || "—"}
      </div>
    </div>
  );
}
