"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Globe, Gauge, AlertTriangle } from "lucide-react";
import type { Lead, AuditResult } from "@/lib/types";
import { formatRevenueRange } from "@/lib/scoring";

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
        <Loader2 className="h-6 w-6 text-lime-400 animate-spin" />
        <span className="text-xs font-mono text-slate-400 ml-2">Loading pipeline details...</span>
      </div>
    );
  }

  if (!data || data.leads.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 font-mono">
        No pipeline data stored for this session.
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-[#0D1322] text-white">
      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-9 rounded-xl border border-slate-800 bg-slate-950 p-1">
          <TabsTrigger value="leads" className="text-xs font-mono font-bold rounded-lg py-1 data-[state=active]:bg-lime-500 data-[state=active]:text-slate-950">Leads ({data.leads.length})</TabsTrigger>
          <TabsTrigger value="audits" className="text-xs font-mono font-bold rounded-lg py-1 data-[state=active]:bg-lime-500 data-[state=active]:text-slate-950">Audits</TabsTrigger>
          <TabsTrigger value="rankings" className="text-xs font-mono font-bold rounded-lg py-1 data-[state=active]:bg-lime-500 data-[state=active]:text-slate-950">Rankings</TabsTrigger>
          <TabsTrigger value="builds" className="text-xs font-mono font-bold rounded-lg py-1 data-[state=active]:bg-lime-500 data-[state=active]:text-slate-950">Builds</TabsTrigger>
          <TabsTrigger value="outreach" className="text-xs font-mono font-bold rounded-lg py-1 data-[state=active]:bg-lime-500 data-[state=active]:text-slate-950">Outreach</TabsTrigger>
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads" className="pt-3 animate-in fade-in-50 duration-200">
          <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden max-h-72 overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-900 sticky top-0 border-b border-slate-800">
                <TableRow className="border-b border-slate-800 hover:bg-transparent">
                  <TableHead className="h-8 text-xs font-black text-slate-400 py-2 uppercase font-mono">Name</TableHead>
                  <TableHead className="h-8 text-xs font-black text-slate-400 py-2 uppercase font-mono">Category</TableHead>
                  <TableHead className="h-8 text-xs font-black text-slate-400 py-2 uppercase font-mono">Website</TableHead>
                  <TableHead className="h-8 text-xs font-black text-slate-400 py-2 uppercase font-mono">Phone</TableHead>
                  <TableHead className="h-8 text-xs font-black text-slate-400 py-2 uppercase font-mono">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.leads.map((lead) => (
                  <TableRow key={lead.id} className="border-b border-slate-800/60 hover:bg-slate-900/60 transition-colors">
                    <TableCell className="py-2.5 font-serif font-black text-xs max-w-[180px] truncate text-white">{lead.name}</TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-400 font-mono">{lead.category}</TableCell>
                    <TableCell className="py-2.5 text-xs font-mono">
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-lime-400 hover:underline inline-flex items-center gap-1 font-bold">
                          <Globe className="h-3 w-3" />
                          Link
                        </a>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-300 font-mono tabular-nums">{lead.phone || "-"}</TableCell>
                    <TableCell className="py-2.5 text-xs font-mono tabular-nums text-white">{lead.rating ? `${lead.rating} ★ (${lead.reviewsCount || 0})` : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Audits Tab */}
        <TabsContent value="audits" className="pt-3 space-y-2.5 animate-in fade-in-50 duration-200">
          <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
            {data.leads.map((lead) => {
              const audit = data.audits[lead.id];
              return (
                <div key={lead.id} className="border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row justify-between gap-3 text-xs bg-slate-950">
                  <div className="flex-1">
                    <div className="font-serif font-black text-sm text-white">{lead.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                      {lead.website ? (
                        <span className="inline-flex items-center gap-1 text-lime-400"><Globe className="h-3 w-3 text-lime-400" />{lead.website}</span>
                      ) : (
                        <Badge variant="outline" className="text-[9px] font-extrabold h-4 px-1.5 text-red-400 border-red-500/40 bg-red-500/10 font-mono uppercase">No website present</Badge>
                      )}
                    </div>
                    {audit && (
                      <div className="mt-2 space-y-1 border-t border-slate-800 pt-2 font-sans">
                        <div className="text-slate-400 font-mono text-[11px]"><span className="font-bold text-white uppercase">Gaps:</span> {audit.gaps?.join(", ") || "None"}</div>
                        <div className="text-slate-300 italic text-[11px]"><span className="font-bold text-white not-italic uppercase font-mono">Biggest Impact:</span> &ldquo;{audit.biggestGap}&rdquo;</div>
                      </div>
                    )}
                  </div>
                  {audit ? (
                    <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3.5 min-w-[140px] font-mono">
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider font-black">PageSpeed</div>
                        <div className="font-mono font-black text-sm text-right flex items-center gap-1 justify-end mt-0.5 text-lime-400 tabular-nums">
                          <Gauge className="h-3.5 w-3.5 text-lime-400" />
                          {audit.pageSpeedScore}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider font-black">Est. Lost Revenue</div>
                        <div className="font-mono font-black text-xs text-red-400 mt-0.5 tabular-nums">{formatRevenueRange(audit.estLostRevenuePerMonth)}/mo</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic flex items-center justify-center min-w-[130px] font-mono">Awaiting audit</div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Rankings Tab */}
        <TabsContent value="rankings" className="pt-3 animate-in fade-in-50 duration-200">
          <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden max-h-72 overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-900 sticky top-0 border-b border-slate-800">
                <TableRow className="border-b border-slate-800 hover:bg-transparent">
                  <TableHead className="h-8 text-xs font-black text-slate-400 py-2 uppercase font-mono">Rank</TableHead>
                  <TableHead className="h-8 text-xs font-black text-slate-400 py-2 uppercase font-mono">Business</TableHead>
                  <TableHead className="h-8 text-xs font-black text-slate-400 py-2 uppercase font-mono">Category</TableHead>
                  <TableHead className="h-8 text-xs font-black text-slate-400 py-2 uppercase font-mono">Rating / Reviews</TableHead>
                  <TableHead className="h-8 text-xs font-black text-slate-400 py-2 text-right uppercase font-mono">Score</TableHead>
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
                    <TableRow key={lead.id} className="border-b border-slate-800/60 hover:bg-slate-900/60 transition-colors">
                      <TableCell className="py-2.5 text-xs font-black font-mono tabular-nums text-white">
                        {rank.rank !== undefined ? `#${rank.rank}` : "-"}
                      </TableCell>
                      <TableCell className="py-2.5 font-serif font-black text-xs max-w-[180px] truncate text-white">{lead.name}</TableCell>
                      <TableCell className="py-2.5 text-xs text-slate-400 font-mono">{lead.category}</TableCell>
                      <TableCell className="py-2.5 text-xs font-mono tabular-nums text-slate-300">{lead.rating ? `${lead.rating} ★ (${lead.reviewsCount || 0})` : "-"}</TableCell>
                      <TableCell className="py-2.5 text-xs font-mono font-black tabular-nums text-lime-400 text-right">{rank.score || "-"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Website Builds Tab */}
        <TabsContent value="builds" className="pt-3 space-y-2.5 animate-in fade-in-50 duration-200">
          <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
            {Object.keys(data.builds).length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-mono">No website prompts generated in this session.</div>
            ) : (
              Object.values(data.builds).map((build: SessionBuild) => (
                <div key={build.leadId + build.platform} className="border border-slate-800 rounded-xl p-3 text-xs bg-slate-950">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="font-serif font-black text-xs text-white">{build.leadName}</span>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-extrabold bg-slate-900 text-lime-400 border-lime-500/30 rounded-md font-mono">{build.platform}</Badge>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 max-h-28 overflow-y-auto font-mono text-[10px] whitespace-pre-wrap leading-relaxed text-slate-200 scrollbar-thin">
                    {build.prompt}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
        
        {/* Outreach Tab */}
        <TabsContent value="outreach" className="pt-3 animate-in fade-in-50 duration-200">
          <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
            {Object.keys(data.outreach).length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-mono">No outreach drafts generated in this session.</div>
            ) : (
              Object.values(data.outreach).map((outr: SessionOutreach) => (
                <div key={outr.leadId + outr.channel} className="border border-slate-800 rounded-xl p-3 text-xs bg-slate-950">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="font-serif font-black text-xs text-white">{outr.leadName}</span>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-extrabold bg-slate-900 text-lime-400 border-lime-500/30 rounded-md font-mono">{outr.channel}</Badge>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-extrabold bg-slate-900 text-slate-300 border-slate-800 rounded-md font-mono">{outr.language}</Badge>
                      <Badge className="text-[9px] uppercase tracking-wider font-black bg-lime-500/10 text-lime-400 rounded-md border border-lime-500/30 font-mono">{outr.status || "draft"}</Badge>
                    </div>
                  </div>
                  {outr.subject && (
                    <div className="font-mono text-xs mb-1.5 text-slate-400">Subject: <span className="text-white font-bold">{outr.subject}</span></div>
                  )}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 max-h-28 overflow-y-auto whitespace-pre-wrap text-slate-200 font-mono text-[10px] leading-relaxed scrollbar-thin">
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
