"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { LoginPage } from "@/components/LoginPage";
import { Stepper } from "@/components/Stepper";
import { Phase1Scrape } from "@/components/Phase1Scrape";
import { Phase2Audit } from "@/components/Phase2Audit";
import { Phase3Rank } from "@/components/Phase3Rank";
import { Phase4Build } from "@/components/Phase4Build";
import { Phase5Outreach } from "@/components/Phase5Outreach";
import { scoreLead } from "@/lib/scoring";
import type { Lead, AuditResult } from "@/lib/types";
import { Loader2, LogOut, Sparkles, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionHistory } from "@/components/SessionHistory";
import { toast } from "sonner";

export default function Page() {
  return (
    <AuthProvider>
      <LeadLaunchApp />
    </AuthProvider>
  );
}

function LeadLaunchApp() {
  const { getIdToken, loading, quota, signOutUser, user } = useAuth();
  const [phase, setPhase] = useState(1);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [audits, setAudits] = useState<Record<string, AuditResult>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadSavedLeads() {
      try {
        const token = await getIdToken();
        const res = await fetch("/api/leads", {
          headers: { authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Unable to load saved leads.");
        if (!cancelled && Array.isArray(data.leads)) setLeads(data.leads);
      } catch {
        // Keep local/unconfigured environments usable.
      }
    }

    loadSavedLeads();

    return () => {
      cancelled = true;
    };
  }, [getIdToken, user]);

  const handleLoadSession = (
    loadedSessionId: string,
    loadedLeads: Lead[],
    loadedAudits: Record<string, AuditResult>,
    pipeline?: any
  ) => {
    setSessionId(loadedSessionId);
    setLeads(loadedLeads || []);
    setAudits(loadedAudits || {});
    setSelectedId(null);
    setPhase(1); // Jump to first phase to inspect
  };

  const handleDuplicateSession = (niche: string, city: string, count: number) => {
    setLeads([]);
    setAudits({});
    setSelectedId(null);
    setSessionId(null);
    setPhase(1);
    toast.success(`Filters reset for: ${niche} in ${city}. You can now start a new scrape.`);
  };

  const completed = useMemo(() => {
    const s = new Set<number>();
    if (leads.length > 0) s.add(1);
    if (Object.keys(audits).length > 0) s.add(2);
    if (selectedId) {
      s.add(3);
      s.add(4);
    }
    return s;
  }, [leads, audits, selectedId]);

  const selectedRanked = useMemo(() => {
    if (!selectedId) return null;
    const lead = leads.find((l) => l.id === selectedId);
    const audit = audits[selectedId];
    if (!lead || !audit) return null;
    return scoreLead(lead, audit);
  }, [selectedId, leads, audits]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading account
        </div>
      </main>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-foreground focus:text-background focus:px-3 focus:py-2 focus:rounded-md focus:text-sm"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <div className="font-display text-xl leading-none">Lead <span className="text-muted-foreground">→</span> Launch</div>
              <div className="text-[11px] text-muted-foreground leading-tight tracking-wide uppercase mt-1">Scrape · Audit · Rank · Build · Outreach</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {quota && (
              <div className="hidden sm:block rounded-md border border-border bg-card px-3 py-1.5 text-right">
                <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Leads left</div>
                <div className="font-mono text-sm tabular-nums">
                  {quota.remaining}/{quota.leadLimit}
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} aria-label="View Scraped History">
              <History className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              History
            </Button>
            <Button variant="outline" size="sm" onClick={signOutUser} aria-label="Sign out">
              <LogOut className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
        <Stepper current={phase} completed={completed} onJump={(n) => setPhase(n)} />
      </header>
      <main id="main" className="pt-6" tabIndex={-1}>
        <AnimatePresence mode="wait">
          {phase === 1 && (
            <Phase1Scrape
              key="p1"
              leads={leads}
              setLeads={setLeads}
              sessionId={sessionId}
              setSessionId={setSessionId}
              onNext={() => setPhase(2)}
            />
          )}
          {phase === 2 && (
            <Phase2Audit
              key="p2"
              leads={leads}
              audits={audits}
              setAudits={setAudits}
              sessionId={sessionId}
              onNext={() => setPhase(3)}
              onPrev={() => setPhase(1)}
            />
          )}
          {phase === 3 && (
            <Phase3Rank
              key="p3"
              leads={leads}
              audits={audits}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              sessionId={sessionId}
              onNext={() => setPhase(4)}
              onPrev={() => setPhase(2)}
            />
          )}
          {phase === 4 && (
            <Phase4Build
              key="p4"
              selected={selectedRanked}
              sessionId={sessionId}
              onNext={() => setPhase(5)}
              onPrev={() => setPhase(3)}
            />
          )}
          {phase === 5 && (
            <Phase5Outreach
              key="p5"
              selected={selectedRanked}
              sessionId={sessionId}
              onPrev={() => setPhase(4)}
            />
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showHistory && (
          <SessionHistory
            onClose={() => setShowHistory(false)}
            onLoadSession={handleLoadSession}
            currentSessionId={sessionId}
            onDuplicateSession={handleDuplicateSession}
          />
        )}
      </AnimatePresence>
    </>
  );
}
