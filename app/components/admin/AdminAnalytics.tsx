"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./AdminProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export function AdminAnalytics() {
  const { adminFetch } = useAdmin();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await adminFetch("/api/admin/analytics");
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [adminFetch]);

  if (loading || !data) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6 h-64"><Skeleton className="h-full w-full" /></CardContent></Card>
          <Card><CardContent className="p-6 h-64"><Skeleton className="h-full w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="font-display text-3xl">Analytics</h1>
        <p className="text-muted-foreground mt-1">Insights from user activity and scraped leads.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Scrapes Today</p>
            <p className="font-display text-4xl text-primary">{data.scrapesToday.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Scrapes This Month</p>
            <p className="font-display text-4xl text-primary">{data.scrapesThisMonth.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Niches</CardTitle>
            <CardDescription>Most frequently searched categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topNiches} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: 'var(--muted)' }} />
                  <Bar dataKey="count" fill="#0052ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Cities</CardTitle>
            <CardDescription>Most frequently searched locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topCities} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: 'var(--muted)' }} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2, 221 100% 60%))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Users</CardTitle>
          <CardDescription>Most active users by lead consumption</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Rank</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead className="text-right pr-6">Leads Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topUsers.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No data available.</TableCell></TableRow>
              ) : (
                data.topUsers.map((user: any, idx: number) => (
                  <TableRow key={user.uid}>
                    <TableCell className="text-center font-mono text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell className="text-right pr-6 font-mono">{user.leadsUsed.toLocaleString()}</TableCell>
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
