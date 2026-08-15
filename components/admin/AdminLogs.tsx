"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./AdminProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ScrollText } from "lucide-react";

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
}

export function AdminLogs() {
  const { adminFetch } = useAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/logs?limit=50");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs();
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminFetch]);

  const getActionBadge = (action: string) => {
    if (action.includes("delete") || action.includes("ban") || action.includes("reset")) {
      return <Badge variant="outline" className="uppercase text-[9px] font-mono px-2 py-0.5 border-rose-500/40 text-rose-400 bg-rose-500/10">{action.replace("_", " ")}</Badge>;
    }
    if (action.includes("settings")) {
      return <Badge variant="outline" className="uppercase text-[9px] font-mono px-2 py-0.5 border-purple-500/40 text-purple-400 bg-purple-500/10">{action.replace("_", " ")}</Badge>;
    }
    return <Badge variant="outline" className="uppercase text-[9px] font-mono px-2 py-0.5 border-lime-500/40 text-lime-400 bg-lime-500/10">{action.replace("_", " ")}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-lime-400 uppercase tracking-widest mb-1">
            <ScrollText className="w-3.5 h-3.5" /> Security & Admin Audit Trail
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Audit Logs</h1>
          <p className="text-slate-400 text-sm mt-1">Immutable record of all administrative configuration and user quota modifications.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadLogs} 
          disabled={loading}
          className="bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 text-lime-400 ${loading ? "animate-spin" : ""}`} />
          Refresh Logs
        </Button>
      </div>

      <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/60 border-b border-slate-800/80">
              <TableRow className="border-slate-800/80 hover:bg-transparent">
                <TableHead className="w-32 text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3">Time</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3">Action</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3">Target</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && logs.length === 0 ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i} className="border-slate-800/60">
                    <TableCell><Skeleton className="h-6 w-20 bg-slate-800" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 bg-slate-800" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32 bg-slate-800" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-48 bg-slate-800" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow className="border-slate-800/60">
                  <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-xs italic">
                    No admin audit log entries recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                logs.map((log: any) => (
                  <TableRow key={log.id} className="border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                    <TableCell className="font-mono text-xs text-slate-400 whitespace-nowrap">
                      {log.timestamp ? getRelativeTime(log.timestamp) : "Recently"}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action || "system_event")}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-200 font-semibold">{log.target || "Global"}</TableCell>
                    <TableCell className="text-xs text-slate-300 font-mono max-w-xs truncate">
                      {typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details || "-")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
