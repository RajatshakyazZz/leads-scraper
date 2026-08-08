"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Search,
  Trash2,
  Download,
  Copy,
  FolderOpen,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Clock,
  Loader2,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { ScrapeSession, Lead, AuditResult } from "@/lib/types";
import { SessionDetail } from "./SessionDetail";

type SessionHistoryProps = {
  onClose: () => void;
  onLoadSession: (sessionId: string, leads: Lead[], audits: Record<string, AuditResult>, pipelineState?: unknown) => void;
  currentSessionId: string | null;
  onDuplicateSession: (niche: string, city: string, count: number) => void;
};

export function SessionHistory({ onClose, onLoadSession, currentSessionId, onDuplicateSession }: SessionHistoryProps) {
  const { getIdToken } = useAuth();
  const [sessions, setSessions] = useState<ScrapeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchSessions = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const token = await getIdToken();
      let url = `/api/sessions?limit=10&sort=${sort}`;
      if (!reset && nextCursor) {
        url += `&cursor=${nextCursor}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const res = await fetch(url, {
        headers: { authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to load sessions.");
      
      if (reset) {
        setSessions(data.sessions || []);
      } else {
        setSessions((prev) => [...prev, ...(data.sessions || [])]);
      }
      setNextCursor(data.nextCursor || null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [getIdToken, nextCursor, search, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSessions(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [sort, fetchSessions]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions(true);
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map((s) => s.id)));
    }
  };

  const handleLoad = async (sessionId: string) => {
    const loadToast = toast.loading("Loading session data...");
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/sessions/${sessionId}`, {
        headers: { authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch session detail.");
      
      onLoadSession(sessionId, data.leads, data.audits, data.session.pipeline);
      toast.success("Session loaded successfully!", { id: loadToast });
      onClose();
    } catch (e) {
      toast.error((e as Error).message, { id: loadToast });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this session? This will permanently delete all leads, audits, ranks, builds, and outreach associated with it.")) return;
    
    const deleteToast = toast.loading("Deleting session...");
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/sessions/${id}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete session.");
      
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Session deleted successfully", { id: deleteToast });
    } catch (e) {
      toast.error((e as Error).message, { id: deleteToast });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected session(s)?`)) return;
    
    setDeleting(true);
    const bulkToast = toast.loading(`Deleting ${selectedIds.size} session(s)...`);
    try {
      const token = await getIdToken();
      for (const id of Array.from(selectedIds)) {
        await fetch(`/api/sessions/${id}`, {
          method: "DELETE",
          headers: { authorization: `Bearer ${token}` }
        });
      }
      setSessions((prev) => prev.filter((s) => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      toast.success("Selected sessions deleted", { id: bulkToast });
    } catch (e) {
      toast.error((e as Error).message, { id: bulkToast });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/export/leads?sessionId=${sessionId}`, {
        headers: { authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to export CSV.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `session-${sessionId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Session CSV exported!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleExportAll = async () => {
    try {
      const token = await getIdToken();
      const res = await fetch("/api/export/leads", {
        headers: { authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to export account leads.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `account-leads-all.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("All account leads exported!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedSessionId((prev) => (prev === id ? null : id));
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 220 }}
        className="relative z-10 flex h-full w-full max-w-4xl flex-col border-l border-slate-800 bg-[#0B0F19] text-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-[#0F172A]/90 backdrop-blur-md">
          <div>
            <h2 className="font-sans font-black text-lg flex items-center gap-2 text-white uppercase tracking-tight">
              <Clock className="h-5 w-5 text-lime-400" />
              Scraped Leads History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">Manage and review all your previous lead generation sessions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportAll} className="h-8.5 rounded-xl text-xs font-bold border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white">
              <Download className="h-3.5 w-3.5 mr-1 text-lime-400" />
              Export Account
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl h-8.5 w-8.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters and search */}
        <div className="border-b border-slate-800 bg-slate-950 p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Search by niche or city..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9 h-9 rounded-xl border-slate-800 bg-slate-900 text-xs font-bold text-white focus-visible:ring-1 focus-visible:ring-lime-400 placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-9 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-mono font-bold focus-visible:outline-none cursor-pointer text-slate-200"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <Button type="submit" size="sm" className="h-9 px-4 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-lime-500/20 cursor-pointer">
                Search
              </Button>
            </div>
          </form>
          
          {selectedIds.size > 0 && (
            <div className="mt-3 flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-xl p-2.5">
              <span className="text-xs font-bold text-red-400 pl-1 font-mono">
                {selectedIds.size} session{selectedIds.size > 1 ? "s" : ""} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleting}
                className="h-7 text-xs px-3 rounded-lg cursor-pointer bg-red-600 hover:bg-red-500 font-bold"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        {/* Sessions list */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-lime-400 animate-spin" />
              <span className="text-xs font-mono text-slate-400">Loading session history...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-950/60 p-8">
              <FolderOpen className="h-10 w-10 text-slate-600 mx-auto" />
              <h3 className="font-sans font-black text-base mt-3 text-white uppercase">No sessions found</h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">Run a new scrape to start your first session history log.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider px-1 font-mono font-bold">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === sessions.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 bg-slate-900 text-lime-500 focus:ring-lime-400 h-4 w-4 cursor-pointer"
                  />
                  <span>Select All</span>
                </div>
                <span>Pipeline Stage Progress</span>
              </div>
              
              {sessions.map((session) => {
                const isExpanded = expandedSessionId === session.id;
                const isSelected = selectedIds.has(session.id);
                const isActive = currentSessionId === session.id;
                
                return (
                  <Card
                    key={session.id}
                    className={`rounded-2xl border bg-[#111726]/90 backdrop-blur-md overflow-hidden transition-all duration-200 shadow-xl ${
                      isActive 
                        ? "ring-2 ring-lime-400 border-lime-500/50" 
                        : "border-slate-800 hover:border-slate-700"
                    } ${isSelected ? "border-lime-500/40 bg-slate-900/90" : ""}`}
                  >
                    <div
                      onClick={() => toggleExpand(session.id)}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          onClick={(e) => toggleSelect(session.id, e)}
                          className="mt-0.5 flex items-center"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded border-slate-700 bg-slate-900 text-lime-500 focus:ring-lime-400 h-4 w-4 cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap font-sans">
                            <span className="font-serif font-black text-base capitalize text-white">
                              {session.niche}
                            </span>
                            <span className="text-slate-400 text-xs font-mono">in</span>
                            <span className="font-serif font-black text-base capitalize text-white">
                              {session.city}
                            </span>
                            {isActive && (
                              <span className="bg-lime-500/20 text-lime-400 border border-lime-500/40 text-[9px] px-2.5 py-0.5 rounded-full font-mono font-black uppercase tracking-wider">
                                Active Session
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3.5 mt-2 text-xs text-slate-400 flex-wrap font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-lime-400" />
                              {formatDate(session.createdAt)}
                            </span>
                            <span className="flex items-center gap-1 tabular-nums">
                              <Layers className="h-3.5 w-3.5 text-slate-500" />
                              {session.countReceived} leads
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase font-mono ${
                              session.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                              session.status === "failed" ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-lime-500/10 text-lime-400 border-lime-500/30"
                            }`}>
                              {session.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Pipeline progress indicators */}
                      <div className="flex items-center gap-5 justify-between md:justify-end">
                        <div className="flex gap-1.5" title="Pipeline Progress: Scrape, Audit, Rank, Build, Outreach">
                          <span className={`h-2.5 w-2.5 rounded-full ${session.pipeline.scrapeComplete ? "bg-lime-400 shadow-[0_0_8px_rgba(132,204,22,0.8)]" : "bg-slate-800"}`} title="Scraped" />
                          <span className={`h-2.5 w-2.5 rounded-full ${session.pipeline.auditComplete ? "bg-lime-400 shadow-[0_0_8px_rgba(132,204,22,0.8)]" : "bg-slate-800"}`} title="Audited" />
                          <span className={`h-2.5 w-2.5 rounded-full ${session.pipeline.rankComplete ? "bg-lime-400 shadow-[0_0_8px_rgba(132,204,22,0.8)]" : "bg-slate-800"}`} title="Ranked" />
                          <span className={`h-2.5 w-2.5 rounded-full ${session.pipeline.buildComplete ? "bg-lime-400 shadow-[0_0_8px_rgba(132,204,22,0.8)]" : "bg-slate-800"}`} title="Build Prompt Generated" />
                          <span className={`h-2.5 w-2.5 rounded-full ${session.pipeline.outreachComplete ? "bg-lime-400 shadow-[0_0_8px_rgba(132,204,22,0.8)]" : "bg-slate-800"}`} title="Outreach Drafted" />
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDelete(session.id, e)}
                            className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            aria-label="Delete session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded details panel */}
                    {isExpanded && (
                      <div className="border-t border-slate-800/80 bg-slate-950/90 p-4 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 pb-2 border-b border-slate-800/60">
                          <div>
                            ID: <span className="text-slate-200 font-bold">{session.id}</span>
                            {session.durationMs && ` • Duration: ${(session.durationMs / 1000).toFixed(1)}s`}
                            {session.source && ` • Source: ${session.source}`}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateSession(session.niche, session.city, session.countRequested);
                                onClose();
                              }}
                              className="h-8 rounded-xl text-xs font-bold border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1 text-slate-400" />
                              Re-run Scrape
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => handleExportCsv(session.id, e)}
                              className="h-8 rounded-xl text-xs font-bold border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
                            >
                              <Download className="h-3.5 w-3.5 mr-1 text-lime-400" />
                              Export CSV
                            </Button>

                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoad(session.id);
                              }}
                              className="h-8 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-lime-500/20 cursor-pointer"
                            >
                              <FolderOpen className="h-3.5 w-3.5 mr-1" />
                              Open Session
                            </Button>
                          </div>
                        </div>

                        <SessionDetail sessionId={session.id} />
                      </div>
                    )}
                  </Card>
                );
              })}
              
              {nextCursor && (
                <div className="pt-2 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSessions(false)}
                    disabled={loadingMore}
                    className="h-9 px-5 rounded-xl text-xs font-bold border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white"
                  >
                    {loadingMore ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin text-lime-400" /> Loading...</>
                    ) : (
                      "Load More Sessions"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
