"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./AdminProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Activity, BarChart3, Building2, MapPin, Users, AlertCircle, TrendingUp } from "lucide-react";

export function AdminAnalytics() {
  const { adminFetch } = useAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await adminFetch("/api/admin/analytics");
        const json = await res.json();
        if (res.ok) {
          setData(json);
        } else {
          setError(json.error || "Failed to fetch analytics data.");
        }
      } catch (e) {
        console.error("Admin Analytics Fetch Error:", e);
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [adminFetch]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-48 rounded-xl bg-slate-800" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 w-full rounded-2xl bg-slate-800" />
          <Skeleton className="h-28 w-full rounded-2xl bg-slate-800" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="rounded-2xl bg-slate-900 border-slate-800"><CardContent className="p-6 h-72"><Skeleton className="h-full w-full rounded-xl bg-slate-800" /></CardContent></Card>
          <Card className="rounded-2xl bg-slate-900 border-slate-800"><CardContent className="p-6 h-72"><Skeleton className="h-full w-full rounded-xl bg-slate-800" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Insights from user activity and scraped leads.</p>
        </div>
        <Card className="rounded-2xl border border-rose-500/30 bg-slate-900/80 p-8 text-center backdrop-blur-xl">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
          <h3 className="font-bold text-white text-lg">Unable to load analytics</h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">{error || "No data returned from backend."}</p>
        </Card>
      </div>
    );
  }

  const topNiches = data.topNiches || [];
  const topCities = data.topCities || [];
  const topUsers = data.topUsers || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-lime-400 uppercase tracking-widest mb-1">
          <TrendingUp className="w-3.5 h-3.5" /> Usage Intelligence
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics & Trends</h1>
        <p className="text-slate-400 text-sm mt-1">Insights from user activity, high-converting business categories, and location queries.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
              <span>Scrapes Today</span>
              <Activity className="h-4 w-4 text-lime-400" />
            </div>
            <p className="font-mono text-3xl font-black text-lime-400 tabular-nums">{(data.scrapesToday || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
              <span>Scrapes This Month</span>
              <BarChart3 className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="font-mono text-3xl font-black text-cyan-400 tabular-nums">{(data.scrapesThisMonth || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl rounded-2xl">
          <CardHeader className="pb-2 pt-5 px-5 border-b border-slate-800/60 mb-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-lime-400" />
              Top Business Niches
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Most frequently searched lead categories</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {topNiches.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-xs text-slate-500 italic">
                No niche data recorded yet.
              </div>
            ) : (
              <div className="h-[260px] w-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topNiches} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={130} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }} />
                    <Bar dataKey="count" fill="#84cc16" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl rounded-2xl">
          <CardHeader className="pb-2 pt-5 px-5 border-b border-slate-800/60 mb-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-400" />
              Top Target Cities
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Most frequently searched locations</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {topCities.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-xs text-slate-500 italic">
                No city data recorded yet.
              </div>
            ) : (
              <div className="h-[260px] w-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCities} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={130} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }} />
                    <Bar dataKey="count" fill="#06b6d4" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 pt-5 px-5 border-b border-slate-800/60">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            Most Active Power Users
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Users by highest lead generation consumption</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-950/60 border-b border-slate-800/80">
                <TableRow className="border-slate-800/80 hover:bg-transparent">
                  <TableHead className="w-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3">Rank</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3">User Email</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3">Leads Scraped</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.length === 0 ? (
                  <TableRow className="border-slate-800/60"><TableCell colSpan={3} className="text-center py-8 text-xs text-slate-500 italic">No user data available.</TableCell></TableRow>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  topUsers.map((user: any, idx: number) => (
                    <TableRow key={user.uid} className="border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                      <TableCell className="text-center font-mono text-xs text-slate-400 font-bold tabular-nums">#{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-200 font-semibold">{user.email}</TableCell>
                      <TableCell className="text-right pr-6 font-mono text-xs font-bold text-lime-400 tabular-nums">{user.leadsUsed.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
