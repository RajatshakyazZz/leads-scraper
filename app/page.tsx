"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { LoginPage } from "@/components/LoginPage";
import { Stepper } from "@/components/Stepper";
import { Phase1Scrape } from "@/components/Phase1Scrape";
import { scoreLead } from "@/lib/scoring";
import type { Lead, AuditResult } from "@/lib/types";
import { Loader2, LogOut, Sparkles, History, Zap, User, Database, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Phase2Audit = dynamic(() => import("@/components/Phase2Audit").then((m) => m.Phase2Audit), {
  loading: () => <PhaseLoader label="LOADING AUDIT ENGINE..." />,
});

const Phase3Rank = dynamic(() => import("@/components/Phase3Rank").then((m) => m.Phase3Rank), {
  loading: () => <PhaseLoader label="LOADING RANKING ENGINE..." />,
});

const Phase4Build = dynamic(() => import("@/components/Phase4Build").then((m) => m.Phase4Build), {
  loading: () => <PhaseLoader label="LOADING BUILD ENGINE..." />,
});

const Phase5Outreach = dynamic(() => import("@/components/Phase5Outreach").then((m) => m.Phase5Outreach), {
  loading: () => <PhaseLoader label="LOADING OUTREACH ENGINE..." />,
});

const SessionHistory = dynamic(() => import("@/components/SessionHistory").then((m) => m.SessionHistory));
const ProfileModal = dynamic(() => import("@/components/ProfileModal").then((m) => m.ProfileModal));

function PhaseLoader({ label }: { label: string }) {
  return (
    <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs font-mono font-bold text-slate-400">
      <Loader2 className="h-7 w-7 animate-spin text-lime-400" />
      <span>{label}</span>
    </div>
  );
}

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
  const [showProfile, setShowProfile] = useState(false);

  const [loadingSavedLeads, setLoadingSavedLeads] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Home screen starts clean with empty leads so history leads aren't auto-displayed on start.
  const handleViewAllLeads = async () => {
    setLoadingSavedLeads(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/leads", {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to load saved leads.");
      if (Array.isArray(data.leads)) {
        setLeads(data.leads);
        if (data.leads.length > 0) {
          toast.success(`Loaded ${data.leads.length} saved leads from your workspace history.`);
        } else {
          toast.info("No saved leads found in workspace history.");
        }
        setPhase(1);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingSavedLeads(false);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
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
      link.download = sessionId ? `leads-session-${sessionId}.csv` : "clientforge-leads.csv";
      link.click();
      URL.revokeObjectURL(urlBlob);
      toast.success("CSV exported successfully!");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleLoadSession = (
    loadedSessionId: string,
    loadedLeads: Lead[],
    loadedAudits: Record<string, AuditResult>
  ) => {
    setSessionId(loadedSessionId);
    setLeads(loadedLeads || []);
    setAudits(loadedAudits || {});
    setSelectedId(null);
    setPhase(1); // Jump to first phase to inspect
  };

  const handleDuplicateSession = (niche: string, city: string) => {
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
      <main className="min-h-screen flex items-center justify-center px-4 bg-[#080B11]">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-400 font-bold">
          <Loader2 className="h-8 w-8 animate-spin text-lime-400" aria-hidden="true" />
          <span>INITIALIZING CLIENTFORGE AGENT ENGINE...</span>
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
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-lime-400 focus:text-slate-950 focus:px-3 focus:py-2 focus:rounded-md focus:text-sm font-black"
      >
        Skip to content
      </a>
      <header className="border-b border-slate-800 bg-[#0B0F19]/95 backdrop-blur-md sticky top-0 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/icon.png"
              alt="ClientForge"
              width={40}
              height={40}
              priority
              className="h-10 w-10 object-contain rounded-xl border border-lime-500/30 shadow-md shadow-lime-500/20"
            />
            <div>
              <div className="font-sans font-black text-xl tracking-tight leading-none text-white flex items-center gap-1">
                CLIENT<span className="text-lime-400 font-black">FORGE</span>
              </div>
              <div className="text-[9px] text-lime-400/90 leading-tight tracking-[0.18em] uppercase mt-1 font-mono font-bold">
                LEADS ➔ CONVERSION
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:gap-2.5">
            {quota && (
              <div className="hidden md:block rounded-xl border border-lime-500/30 bg-lime-500/10 px-3 py-1 text-right">
                <div className="text-[9px] uppercase tracking-[0.14em] text-lime-400 font-mono font-bold">Leads Available</div>
                <div className="font-mono text-xs tabular-nums font-black text-white">
                  {quota.remaining}/{quota.leadLimit}
                </div>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfile(true)}
              aria-label="Manage Profile"
              className="h-9 rounded-xl border-slate-700 bg-slate-900 text-xs font-extrabold uppercase tracking-wider text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              <User className="h-3.5 w-3.5 mr-1.5 text-lime-400" aria-hidden="true" />
              Profile
            </Button>

            {/* View All Leads Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAllLeads}
              disabled={loadingSavedLeads}
              aria-label="View All Leads"
              className="h-9 rounded-xl border-lime-500/40 bg-lime-500/10 text-xs font-extrabold uppercase tracking-wider text-lime-400 hover:bg-lime-500/20 hover:text-lime-300"
            >
              {loadingSavedLeads ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-lime-400" aria-hidden="true" />
              ) : (
                <Database className="h-3.5 w-3.5 mr-1.5 text-lime-400" aria-hidden="true" />
              )}
              View All Leads
            </Button>

            {/* Export CSV Button (Placed between Profile & History) */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={exportingCsv}
              aria-label="Export CSV"
              className="h-9 rounded-xl border-slate-700 bg-slate-900 text-xs font-extrabold uppercase tracking-wider text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              {exportingCsv ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-lime-400" aria-hidden="true" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1.5 text-lime-400" aria-hidden="true" />
              )}
              Export CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(true)}
              aria-label="View Scraped History"
              className="h-9 rounded-xl border-slate-700 bg-slate-900 text-xs font-extrabold uppercase tracking-wider text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              <History className="h-3.5 w-3.5 mr-1.5 text-lime-400" aria-hidden="true" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={signOutUser}
              aria-label="Sign out"
              className="h-9 rounded-xl border-slate-800 bg-slate-900 text-xs font-extrabold uppercase tracking-wider text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Exit
            </Button>
          </div>
        </div>
        <Stepper current={phase} completed={completed} onJump={(n) => setPhase(n)} />
      </header>

      {/* Minimal Professional Sub-Header Bar */}
      <div className="border-b border-slate-800/60 bg-slate-950/60 py-2.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
          <span className="text-lime-400 font-extrabold">CLIENTFORGE PIPELINE</span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-300">AUTOMATED GOOGLE MAPS SCRAPING, AUDITING & LIVE PREVIEW ENGINE</span>
        </div>
      </div>

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
              onViewAllLeads={handleViewAllLeads}
              loadingSavedLeads={loadingSavedLeads}
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
              onReset={() => setPhase(1)}
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
        {showProfile && (
          <ProfileModal
            onClose={() => setShowProfile(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
