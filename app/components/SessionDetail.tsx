"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Globe, Phone, MapPin, Gauge, AlertCircle, FileText, Send, HelpCircle } from "lucide-react";
import type { Lead, AuditResult } from "@/lib/types";

type SessionDetailProps = {
  sessionId: string;
};

export function SessionDetail({ sessionId }: SessionDetailProps) {
  const { getIdToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    leads: Lead[];
    audits: Record<string, AuditResult>;
    rankings: Record<string, any>;
    builds: Record<string, any>;
    outreach: Record<string, any>;
  } | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const token = await getIdToken();
        const res = await fetch(`/api/sessions/${sessionId}`, {
          headers: { authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (res.ok) {
          setData({
            leads: json.leads || [],
            audits: json.audits || {},
            rankings: json.rankings || {},
            builds: json.builds || {},
            outreach: json.outreach || {}
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [sessionId, getIdToken]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <span className="text-xs text-muted-foreground ml-2">Loading pipeline details...</span>
      </div>
    );
  }

  if (!data || data.leads.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        No pipeline data stored for this session.
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border bg-card">
      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-8">
          <TabsTrigger value="leads" className="text-xs">Leads ({data.leads.length})</TabsTrigger>
          <TabsTrigger value="audits" className="text-xs">Audits</TabsTrigger>
          <TabsTrigger value="rankings" className="text-xs">Rankings</TabsTrigger>
          <TabsTrigger value="builds" className="text-xs">Builds</TabsTrigger>
          <TabsTrigger value="outreach" className="text-xs">Outreach</TabsTrigger>
        </TabsList>
        
        {/* Leads Tab */}
        <TabsContent value="leads" className="pt-3">
          <div className="border border-border rounded-md overflow-hidden max-h-72 overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead className="h-8 text-xs">Name</TableHead>
                  <TableHead className="h-8 text-xs">Category</TableHead>
                  <TableHead className="h-8 text-xs">Website</TableHead>
                  <TableHead className="h-8 text-xs">Phone</TableHead>
                  <TableHead className="h-8 text-xs">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="py-2 font-medium text-xs max-w-[180px] truncate">{lead.name}</TableCell>
                    <TableCell className="py-2 text-xs">{lead.category}</TableCell>
                    <TableCell className="py-2 text-xs">
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Link
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-xs">{lead.phone || "-"}</TableCell>
                    <TableCell className="py-2 text-xs font-mono">{lead.rating ? `${lead.rating} ★ (${lead.reviewsCount || 0})` : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Audits Tab */}
        <TabsContent value="audits" className="pt-3 space-y-3">
          <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
            {data.leads.map((lead) => {
              const audit = data.audits[lead.id];
              return (
                <div key={lead.id} className="border border-border rounded-md p-3 flex flex-col sm:flex-row justify-between gap-3 text-xs bg-muted/10">
                  <div className="flex-1">
                    <div className="font-semibold">{lead.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                      {lead.website ? (
                        <span className="inline-flex items-center gap-0.5"><Globe className="h-3 w-3" />{lead.website}</span>
                      ) : (
                        <span className="text-red-500 font-medium">No Website</span>
                      )}
                    </div>
                    {audit && (
                      <div className="mt-2 space-y-1">
                        <div className="text-muted-foreground"><span className="font-medium text-foreground">Gaps:</span> {audit.gaps?.join(", ") || "None"}</div>
                        <div className="text-muted-foreground"><span className="font-medium text-foreground">Biggest Impact:</span> {audit.biggestGap}</div>
                      </div>
                    )}
                  </div>
                  {audit ? (
                    <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0 sm:pl-4 min-w-[120px]">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase">PageSpeed</div>
                        <div className="font-mono font-bold text-sm text-right flex items-center gap-1 justify-end">
                          <Gauge className="h-4.5 w-4.5 text-primary" />
                          {audit.pageSpeedScore}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground uppercase">Lost Rev</div>
                        <div className="font-semibold text-red-600">₹{audit.estLostRevenuePerMonth?.toLocaleString("en-IN")}/mo</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic flex items-center justify-center min-w-[120px]">Awaiting audit</div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Rankings Tab */}
        <TabsContent value="rankings" className="pt-3">
          <div className="border border-border rounded-md overflow-hidden max-h-72 overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead className="h-8 text-xs">Rank</TableHead>
                  <TableHead className="h-8 text-xs">Business</TableHead>
                  <TableHead className="h-8 text-xs">Category</TableHead>
                  <TableHead className="h-8 text-xs">Rating / Reviews</TableHead>
                  <TableHead className="h-8 text-xs text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.leads
                  .map((lead) => {
                    const rank = data.rankings[lead.id] || {};
                    return { lead, rank };
                  })
                  .sort((a, b) => (a.rank.rank || 999) - (b.rank.rank || 999))
                  .map(({ lead, rank }) => (
                    <TableRow key={lead.id}>
                      <TableCell className="py-2 text-xs font-bold font-mono">
                        {rank.rank !== undefined ? `#${rank.rank}` : "-"}
                      </TableCell>
                      <TableCell className="py-2 font-medium text-xs max-w-[180px] truncate">{lead.name}</TableCell>
                      <TableCell className="py-2 text-xs">{lead.category}</TableCell>
                      <TableCell className="py-2 text-xs font-mono">{lead.rating ? `${lead.rating} ★ (${lead.reviewsCount || 0})` : "-"}</TableCell>
                      <TableCell className="py-2 text-xs font-mono font-bold text-primary text-right">{rank.score || "-"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Website Builds Tab */}
        <TabsContent value="builds" className="pt-3 space-y-2">
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {Object.keys(data.builds).length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground italic">No website prompts generated in this session.</div>
            ) : (
              Object.values(data.builds).map((build: any) => (
                <div key={build.leadId + build.platform} className="border border-border rounded-md p-3 text-xs bg-muted/10">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-2">
                    <span className="font-semibold text-xs">{build.leadName}</span>
                    <Badge variant="outline" className="text-[10px] capitalize bg-background">{build.platform}</Badge>
                  </div>
                  <div className="bg-background border border-border rounded p-2 max-h-24 overflow-y-auto font-mono text-[10px] whitespace-pre-wrap">
                    {build.prompt}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
        
        {/* Outreach Tab */}
        <TabsContent value="outreach" className="pt-3">
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {Object.keys(data.outreach).length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground italic">No outreach drafts generated in this session.</div>
            ) : (
              Object.values(data.outreach).map((outr: any) => (
                <div key={outr.leadId + outr.channel} className="border border-border rounded-md p-3 text-xs bg-muted/10">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-2">
                    <span className="font-semibold text-xs">{outr.leadName}</span>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-[10px] capitalize bg-background">{outr.channel}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize bg-background">{outr.language}</Badge>
                      <Badge className="text-[10px] bg-green-500">{outr.status || "draft"}</Badge>
                    </div>
                  </div>
                  {outr.subject && (
                    <div className="font-semibold mb-1 text-muted-foreground">Subject: <span className="text-foreground">{outr.subject}</span></div>
                  )}
                  <div className="bg-background border border-border rounded p-2 max-h-24 overflow-y-auto whitespace-pre-wrap text-muted-foreground text-[11px] leading-relaxed">
                    {outr.body}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
