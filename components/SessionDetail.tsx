"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Globe, Gauge } from "lucide-react";
import type { Lead, AuditResult } from "@/lib/types";

type SessionDetailProps = {
  sessionId: string;
};

type SessionRanking = {
  rank: number;
  score: number;
};

type SessionBuild = {
  leadId: string;
  leadName: string;
  platform: string;
  prompt: string;
};

type SessionOutreach = {
  leadId: string;
  leadName: string;
  channel: string;
  language: string;
  status: string;
  subject?: string;
  body: string;
};

export function SessionDetail({ sessionId }: SessionDetailProps) {
  const { getIdToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    leads: Lead[];
    audits: Record<string, AuditResult>;
    rankings: Record<string, SessionRanking>;
    builds: Record<string, SessionBuild>;
    outreach: Record<string, SessionOutreach>;
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
    <div className="p-5 border-t border-border/80 bg-card">
      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-9.5 rounded-xl border border-border bg-muted/40 p-1">
          <TabsTrigger value="leads" className="text-xs rounded-lg py-1">Leads ({data.leads.length})</TabsTrigger>
          <TabsTrigger value="audits" className="text-xs rounded-lg py-1">Audits</TabsTrigger>
          <TabsTrigger value="rankings" className="text-xs rounded-lg py-1">Rankings</TabsTrigger>
          <TabsTrigger value="builds" className="text-xs rounded-lg py-1">Builds</TabsTrigger>
          <TabsTrigger value="outreach" className="text-xs rounded-lg py-1">Outreach</TabsTrigger>
        </TabsList>
        
        {/* Leads Tab */}
        <TabsContent value="leads" className="pt-4 animate-in fade-in-50 duration-200">
          <div className="border border-border/60 rounded-xl bg-background/40 overflow-hidden max-h-72 overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0">
                <TableRow className="border-b border-border/50">
                  <TableHead className="h-9 text-xs font-semibold text-muted-foreground py-2">Name</TableHead>
                  <TableHead className="h-9 text-xs font-semibold text-muted-foreground py-2">Category</TableHead>
                  <TableHead className="h-9 text-xs font-semibold text-muted-foreground py-2">Website</TableHead>
                  <TableHead className="h-9 text-xs font-semibold text-muted-foreground py-2">Phone</TableHead>
                  <TableHead className="h-9 text-xs font-semibold text-muted-foreground py-2">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.leads.map((lead) => (
                  <TableRow key={lead.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <TableCell className="py-2.5 font-medium text-xs max-w-[180px] truncate text-foreground">{lead.name}</TableCell>
                    <TableCell className="py-2.5 text-xs text-foreground">{lead.category}</TableCell>
                    <TableCell className="py-2.5 text-xs">
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">
                          <Globe className="h-3 w-3" />
                          Link
                        </a>
                      ) : (
                        <span className="text-muted-foreground/60">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-foreground font-mono">{lead.phone || "-"}</TableCell>
                    <TableCell className="py-2.5 text-xs font-mono text-foreground">{lead.rating ? `${lead.rating} ★ (${lead.reviewsCount || 0})` : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Audits Tab */}
        <TabsContent value="audits" className="pt-4 space-y-3 animate-in fade-in-50 duration-200">
          <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
            {data.leads.map((lead) => {
              const audit = data.audits[lead.id];
              return (
                <div key={lead.id} className="border border-border/60 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between gap-3 text-xs bg-muted/20">
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{lead.name}</div>
                    <div className="text-[11px] text-muted-foreground/80 mt-1 flex items-center gap-1.5 font-sans">
                      {lead.website ? (
                        <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3 text-muted-foreground/60" />{lead.website}</span>
                      ) : (
                        <span className="text-rose-500 font-medium bg-rose-500/5 px-1.5 py-0.5 rounded">No website present</span>
                      )}
                    </div>
                    {audit && (
                      <div className="mt-2.5 space-y-1.5 border-t border-border/40 pt-2 font-sans">
                        <div className="text-muted-foreground"><span className="font-semibold text-foreground">Gaps:</span> {audit.gaps?.join(", ") || "None"}</div>
                        <div className="text-muted-foreground italic"><span className="font-semibold text-foreground not-italic">Biggest Impact:</span> &ldquo;{audit.biggestGap}&rdquo;</div>
                      </div>
                    )}
                  </div>
                  {audit ? (
                    <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 sm:border-l border-border/50 pt-2 sm:pt-0 sm:pl-4 min-w-[130px] font-sans">
                      <div>
                        <div className="text-[9px] text-muted-foreground/75 uppercase tracking-wider font-bold">PageSpeed</div>
                        <div className="font-mono font-bold text-sm text-right flex items-center gap-1 justify-end mt-0.5 text-foreground">
                          <Gauge className="h-4 w-4 text-primary" />
                          {audit.pageSpeedScore}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-muted-foreground/75 uppercase tracking-wider font-bold">Lost Revenue</div>
                        <div className="font-semibold text-rose-600 mt-0.5">₹{audit.estLostRevenuePerMonth?.toLocaleString("en-IN")}/mo</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground/60 italic flex items-center justify-center min-w-[130px] font-sans">Awaiting audit</div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Rankings Tab */}
        <TabsContent value="rankings" className="pt-4 animate-in fade-in-50 duration-200">
          <div className="border border-border/60 rounded-xl bg-background/40 overflow-hidden max-h-72 overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0">
                <TableRow className="border-b border-border/50">
                  <TableHead className="h-9 text-xs font-semibold text-muted-foreground py-2">Rank</TableHead>
                  <TableHead className="h-9 text-xs font-semibold text-muted-foreground py-2">Business</TableHead>
                  <TableHead className="h-9 text-xs font-semibold text-muted-foreground py-2">Category</TableHead>
                  <TableHead className="h-9 text-xs font-semibold text-muted-foreground py-2">Rating / Reviews</TableHead>
                  <TableHead className="h-9 text-xs font-semibold text-muted-foreground py-2 text-right">Score</TableHead>
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
                    <TableRow key={lead.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                      <TableCell className="py-2.5 text-xs font-bold font-mono text-foreground">
                        {rank.rank !== undefined ? `#${rank.rank}` : "-"}
                      </TableCell>
                      <TableCell className="py-2.5 font-medium text-xs max-w-[180px] truncate text-foreground">{lead.name}</TableCell>
                      <TableCell className="py-2.5 text-xs text-foreground">{lead.category}</TableCell>
                      <TableCell className="py-2.5 text-xs font-mono text-foreground">{lead.rating ? `${lead.rating} ★ (${lead.reviewsCount || 0})` : "-"}</TableCell>
                      <TableCell className="py-2.5 text-xs font-mono font-bold text-primary text-right">{rank.score || "-"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Website Builds Tab */}
        <TabsContent value="builds" className="pt-4 space-y-2.5 animate-in fade-in-50 duration-200">
          <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
            {Object.keys(data.builds).length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground italic font-sans">No website prompts generated in this session.</div>
            ) : (
              Object.values(data.builds).map((build: SessionBuild) => (
                <div key={build.leadId + build.platform} className="border border-border/60 rounded-xl p-3.5 text-xs bg-muted/20">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                    <span className="font-semibold text-xs text-foreground">{build.leadName}</span>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-semibold bg-background rounded-lg">{build.platform}</Badge>
                  </div>
                  <div className="bg-background/80 border border-border/50 rounded-xl p-3.5 max-h-24 overflow-y-auto font-mono text-[10px] whitespace-pre-wrap leading-relaxed text-foreground/80 scrollbar-thin">
                    {build.prompt}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
        
        {/* Outreach Tab */}
        <TabsContent value="outreach" className="pt-4 animate-in fade-in-50 duration-200">
          <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
            {Object.keys(data.outreach).length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground italic font-sans">No outreach drafts generated in this session.</div>
            ) : (
              Object.values(data.outreach).map((outr: SessionOutreach) => (
                <div key={outr.leadId + outr.channel} className="border border-border/60 rounded-xl p-3.5 text-xs bg-muted/20">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                    <span className="font-semibold text-xs text-foreground">{outr.leadName}</span>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-semibold bg-background rounded-lg">{outr.channel}</Badge>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-semibold bg-background rounded-lg">{outr.language}</Badge>
                      <Badge className="text-[9px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20">{outr.status || "draft"}</Badge>
                    </div>
                  </div>
                  {outr.subject && (
                    <div className="font-sans font-medium text-xs mb-2 text-muted-foreground">Subject: <span className="text-foreground font-semibold">{outr.subject}</span></div>
                  )}
                  <div className="bg-background/80 border border-border/50 rounded-xl p-3.5 max-h-24 overflow-y-auto whitespace-pre-wrap text-foreground/80 font-mono text-[10px] leading-relaxed scrollbar-thin">
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
