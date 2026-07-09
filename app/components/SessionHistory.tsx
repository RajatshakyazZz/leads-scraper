"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Trash2,
  Download,
  Copy,
  FolderOpen,
  Calendar,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Clock,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { ScrapeSession } from "@/lib/types";
import { SessionDetail } from "./SessionDetail";

type SessionHistoryProps = {
  onClose: () => void;
  onLoadSession: (sessionId: string, leads: any[], audits: any, pipelineState?: any) => void;
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

  useEffect(() => {
    fetchSessions(true);
  }, [sort]);

  const fetchSessions = async (reset = false) => {
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
  };

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
      if (expandedSessionId === id) setExpandedSessionId(null);
    } catch (e) {
      toast.error((e as Error).message, { id: deleteToast });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.size} selected sessions and all associated pipeline data?`)) return;
    
    setDeleting(true);
    const deleteToast = toast.loading(`Deleting ${selectedIds.size} sessions...`);
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
      toast.success("Selected sessions deleted successfully", { id: deleteToast });
      setExpandedSessionId(null);
    } catch (e) {
      toast.error((e as Error).message, { id: deleteToast });
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const exportToast = toast.loading("Generating CSV export...");
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/export/leads?sessionId=${id}`, {
        headers: { authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("CSV generation failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-session-${id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("CSV exported successfully", { id: exportToast });
    } catch (e) {
      toast.error("Export failed. Please check backend config.", { id: exportToast });
    }
  };

  const handleExportAll = async () => {
    const exportToast = toast.loading("Generating account CSV export...");
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/export/leads`, {
        headers: { authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("CSV generation failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lead-to-launch-all-data.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("All data exported successfully", { id: exportToast });
    } catch (e) {
      toast.error("Export failed.", { id: exportToast });
    }
  };

  const handleDuplicate = (session: ScrapeSession, e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicateSession(session.niche, session.city, session.countRequested);
    onClose();
  };

  const toggleExpand = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end bg-background/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0"
      />
      
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative z-10 flex h-full w-full max-w-4xl flex-col border-l border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="font-display text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Scraped Leads History
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage and review all your previous lead generation sessions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportAll} className="h-8 text-xs">
              <Download className="h-3.5 w-3.5 mr-1" />
              Export Account
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters and search */}
        <div className="border-b border-border bg-muted/30 p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by niche or city..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <Button type="submit" size="sm" className="h-9 px-4">Search</Button>
            </div>
          </form>
          
          {selectedIds.size > 0 && (
            <div className="mt-3 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-md p-2 animate-in fade-in slide-in-from-top-1">
              <span className="text-xs font-medium text-primary">
                {selectedIds.size} session{selectedIds.size > 1 ? "s" : ""} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleting}
                className="h-7 text-[11px] px-2.5"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Loading session history...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-xl">
              <FolderOpen className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <h3 className="font-display text-sm mt-3">No sessions found</h3>
              <p className="text-xs text-muted-foreground mt-1">Run a new scrape to start your first session history log.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider px-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === sessions.length}
                    onChange={toggleSelectAll}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Select All</span>
                </div>
                <span>Pipeline Stage Complete</span>
              </div>
              
              {sessions.map((session) => {
                const isExpanded = expandedSessionId === session.id;
                const isSelected = selectedIds.has(session.id);
                const isActive = currentSessionId === session.id;
                
                return (
                  <Card
                    key={session.id}
                    className={`border overflow-hidden transition-all duration-200 ${
                      isActive ? "border-primary bg-primary/5 accent-shadow" : "hover:border-border"
                    } ${isSelected ? "border-primary/50 bg-primary/[0.02]" : ""}`}
                  >
                    <div
                      onClick={() => toggleExpand(session.id)}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          onClick={(e) => toggleSelect(session.id, e)}
                          className="mt-1 flex items-center"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm capitalize">
                              {session.niche}
                            </span>
                            <span className="text-muted-foreground text-xs">in</span>
                            <span className="font-medium text-sm capitalize">
                              {session.city}
                            </span>
                            {isActive && (
                              <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Active
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(session.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Layers className="h-3.5 w-3.5" />
                              {session.countReceived} leads
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              session.status === "completed" ? "bg-green-100 text-green-800" :
                              session.status === "failed" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {session.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Pipeline progress bar indicators */}
                      <div className="flex items-center gap-6 justify-between md:justify-end">
                        <div className="flex gap-1.5">
                          <span className={`h-2.5 w-2.5 rounded-full title="Scraped" ${session.pipeline.scrapeComplete ? "bg-green-500" : "bg-muted"}`} />
                          <span className={`h-2.5 w-2.5 rounded-full title="Audited" ${session.pipeline.auditComplete ? "bg-green-500" : "bg-muted"}`} />
                          <span className={`h-2.5 w-2.5 rounded-full title="Ranked" ${session.pipeline.rankComplete ? "bg-green-500" : "bg-muted"}`} />
                          <span className={`h-2.5 w-2.5 rounded-full title="Build Prompt Generated" ${session.pipeline.buildComplete ? "bg-green-500" : "bg-muted"}`} />
                          <span className={`h-2.5 w-2.5 rounded-full title="Outreach Drafted" ${session.pipeline.outreachComplete ? "bg-green-500" : "bg-muted"}`} />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDelete(session.id, e)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            aria-label="Delete session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpand(session.id)}
                            className="h-8 w-8"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Collapsible expanded detail */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="border-t border-border bg-muted/10 overflow-hidden"
                        >
                          <div className="p-4 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                              <span>ID: {session.id}</span>
                              <span>•</span>
                              <span>Duration: {((session.durationMs || 0) / 1000).toFixed(1)}s</span>
                              <span>•</span>
                              <span>Source: {session.source}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={(e) => handleDuplicate(session, e)}
                                className="text-xs h-7"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Re-run Scrape
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={(e) => handleExport(session.id, e)}
                                className="text-xs h-7"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Export CSV
                              </Button>
                              <Button
                                variant="default"
                                size="xs"
                                onClick={() => handleLoad(session.id)}
                                className="text-xs h-7"
                              >
                                <FolderOpen className="h-3 w-3 mr-1" />
                                Open Session
                              </Button>
                            </div>
                          </div>
                          <SessionDetail sessionId={session.id} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </div>
          )}
          
          {nextCursor && !loading && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSessions(false)}
                disabled={loadingMore}
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                Load More Sessions
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
