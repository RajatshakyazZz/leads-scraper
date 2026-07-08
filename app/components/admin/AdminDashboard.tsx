"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./AdminProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Database, UserPlus, User, Crown, Activity } from "lucide-react";
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
      <div className="space-y-6">
        <h1 className="font-display text-3xl">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const chartData = [
    { name: "Free", value: stats.freeUsers, color: "hsl(var(--muted-foreground))" },
    { name: "Pro", value: stats.proUsers, color: "#f59e0b" }, // amber-500
  ];

  const cards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { title: "Total Leads Scraped", value: stats.totalLeads, icon: Database, color: "text-foreground" },
    { title: "Today's Signups", value: stats.todaySignups, icon: UserPlus, color: "text-green-600" },
    { title: "Pro Users", value: stats.proUsers, icon: Crown, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your platform's performance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      <p className="font-display text-4xl">{card.value.toLocaleString()}</p>
                    </div>
                    <div className={`p-2 rounded-xl bg-muted/50 ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => [value, "Users"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {chartData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}:</span>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
           <Card className="h-full flex items-center justify-center bg-muted/20 border-dashed">
             <div className="text-center space-y-2 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto opacity-50" />
                <p>More dashboard widgets coming soon</p>
             </div>
           </Card>
        </motion.div>
      </div>
    </div>
  );
}
