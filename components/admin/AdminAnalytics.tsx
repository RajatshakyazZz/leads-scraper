"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./AdminProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Activity, BarChart3, Building2, MapPin, Users, AlertCircle } from "lucide-react";

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
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="rounded-2xl"><CardContent className="p-6 h-72"><Skeleton className="h-full w-full rounded-xl" /></CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-6 h-72"><Skeleton className="h-full w-full rounded-xl" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="font-sans font-bold text-3xl text-slate-900">Analytics</h1>
          <p className="text-xs text-slate-500 mt-1 font-sans">Insights from user activity and scraped leads.</p>
        </div>
        <Card className="rounded-2xl border border-sky-100 bg-white p-8 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 text-lg">Unable to load analytics</h3>
          <p className="text-xs text-slate-500 mt-1 font-mono">{error || "No data returned from backend."}</p>
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
        <h1 className="font-sans font-bold text-3xl text-slate-900">Analytics</h1>
        <p className="text-xs text-slate-500 mt-1 font-sans">Insights from user activity and scraped leads.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="rounded-2xl border border-sky-100 bg-white shadow-lg shadow-sky-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
              <span>Scrapes Today</span>
              <Activity className="h-4 w-4 text-sky-600" />
            </div>
            <p className="font-mono text-3xl font-bold text-sky-700 tabular-nums">{(data.scrapesToday || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-sky-100 bg-white shadow-lg shadow-sky-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
              <span>Scrapes This Month</span>
              <BarChart3 className="h-4 w-4 text-sky-600" />
            </div>
            <p className="font-mono text-3xl font-bold text-sky-700 tabular-nums">{(data.scrapesThisMonth || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-sky-600" />
              Top Niches
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 font-sans">Most frequently searched categories</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {topNiches.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-xs text-slate-400 font-sans italic">
                No niche data recorded yet.
              </div>
            ) : (
              <div className="h-[260px] w-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topNiches} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={90} className="text-[11px] font-sans" />
                    <RechartsTooltip cursor={{ fill: "#F0F7FF" }} />
                    <Bar dataKey="count" fill="#0284C7" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-600" />
              Top Cities
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 font-sans">Most frequently searched locations</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {topCities.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-xs text-slate-400 font-sans italic">
                No city data recorded yet.
              </div>
            ) : (
              <div className="h-[260px] w-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCities} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={90} className="text-[11px] font-sans" />
                    <RechartsTooltip cursor={{ fill: "#F0F7FF" }} />
                    <Bar dataKey="count" fill="#0EA5E9" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-sky-100 bg-white/95 shadow-lg shadow-sky-500/5 overflow-hidden">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-600" />
            Top Users
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 font-sans">Most active users by lead consumption</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-sky-50/60">
                <TableRow className="border-b border-sky-100">
                  <TableHead className="w-16 text-center text-xs font-bold text-slate-500 py-2.5">Rank</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 py-2.5">User Email</TableHead>
                  <TableHead className="text-right pr-6 text-xs font-bold text-slate-500 py-2.5">Leads Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-xs text-slate-500 font-sans italic">No user data available.</TableCell></TableRow>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  topUsers.map((user: any, idx: number) => (
                    <TableRow key={user.uid} className="border-b border-sky-100/60 hover:bg-sky-50/30">
                      <TableCell className="text-center font-mono text-xs text-slate-400 font-bold tabular-nums">{idx + 1}</TableCell>
                      <TableCell className="font-medium text-xs text-slate-900 font-sans">{user.email}</TableCell>
                      <TableCell className="text-right pr-6 font-mono text-xs font-bold text-sky-700 tabular-nums">{user.leadsUsed.toLocaleString()}</TableCell>
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
