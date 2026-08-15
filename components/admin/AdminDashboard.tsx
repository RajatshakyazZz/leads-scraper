"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./AdminProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Database, UserPlus, Crown, Activity, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { motion } from "framer-motion";

type DashboardStats = {
  totalUsers: number;
  totalLeads: number;
  todaySignups: number;
  freeUsers: number;
  proUsers: number;
};

export function AdminDashboard() {
  const { adminFetch } = useAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch("/api/admin/dashboard");
        const data = await res.json();
        if (res.ok) setStats(data.stats);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [adminFetch]);

  if (loading || !stats) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold text-white">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-900/60 border-slate-800"><CardContent className="p-6"><Skeleton className="h-16 w-full bg-slate-800" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const chartData = [
    { name: "Free Plan", value: stats.freeUsers, color: "#84cc16" }, // lime-500
    { name: "Pro Plan", value: stats.proUsers, color: "#a855f7" }, // purple-500
  ];

  const cards = [
    { title: "TOTAL USERS", value: stats.totalUsers, icon: Users, badge: "Active Base", color: "text-lime-400 bg-lime-500/10 border-lime-500/30" },
    { title: "TOTAL LEADS SCRAPED", value: stats.totalLeads, icon: Database, badge: "All-time", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
    { title: "TODAY'S SIGNUPS", value: stats.todaySignups, icon: UserPlus, badge: "Aug 2026", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    { title: "PRO USERS", value: stats.proUsers, icon: Crown, badge: "Paid Tier", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-lime-400 uppercase tracking-widest mb-1">
          <Zap className="w-3.5 h-3.5" /> ClientForge Control Center
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time user telemetry, scraping analytics, and quota engine diagnostics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="bg-slate-900/80 border-slate-800/90 hover:border-slate-700/90 transition-all duration-300 shadow-xl backdrop-blur-xl group">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.title}</p>
                      <p className="text-3xl font-black text-white tracking-tight group-hover:scale-105 transition-transform duration-200 origin-left">
                        {card.value.toLocaleString()}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${card.color} shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                    <span className="text-[11px] text-slate-500 font-medium">Metric Status</span>
                    <span className="text-[10px] font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                      {card.badge}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="lg:col-span-1">
          <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl h-full">
            <CardHeader className="border-b border-slate-800/60 pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-100">
                <Users className="w-4 h-4 text-lime-400" /> Plan Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <RechartsTooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }} formatter={(value: any) => [value, "Users"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {chartData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs font-semibold">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-400">{d.name}:</span>
                    <span className="text-slate-100 font-bold">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl h-full p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-4">
                <div className="flex items-center gap-2 font-bold text-base text-slate-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Platform Infrastructure Status
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Operational
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Scraping Engine</span>
                  <div className="text-sm font-semibold text-slate-200">Google Maps Live</div>
                  <span className="inline-block text-[10px] text-emerald-400 font-medium">9.6s Avg Window</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Database Node</span>
                  <div className="text-sm font-semibold text-slate-200">Cloud Firestore</div>
                  <span className="inline-block text-[10px] text-lime-400 font-medium">Synced & Secure</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">History Cache</span>
                  <div className="text-sm font-semibold text-slate-200">Zero Contamination</div>
                  <span className="inline-block text-[10px] text-cyan-400 font-medium">Location Filtered</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-lime-400" /> Active Hackathon Session
              </span>
              <span className="font-mono text-slate-300">Target Quota: 15 Leads/User</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
