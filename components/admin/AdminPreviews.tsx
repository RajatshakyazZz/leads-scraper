"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./AdminProvider";
import {
  Eye,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Loader2,
  Globe,
  Sparkles,
  RefreshCw,
  Building2,
  Calendar,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type PublishedPreview = {
  id: string;
  lead?: {
    name?: string;
    category?: string;
    city?: string;
    phone?: string;
  };
  viewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export function AdminPreviews() {
  const { token } = useAdmin();
  const [previews, setPreviews] = useState<PublishedPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPreviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/previews", {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load published previews");
      setPreviews(data.previews || []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreviews();
  }, [token]);

  const handleDelete = async (previewId: string, name?: string) => {
    if (!confirm(`Are you sure you want to delete preview for "${name || previewId}"? This will free up database storage.`)) {
      return;
    }

    try {
      setDeletingId(previewId);
      const res = await fetch(`/api/admin/previews?id=${previewId}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete preview");

      setPreviews((prev) => prev.filter((p) => p.id !== previewId));
      toast.success(`Deleted preview "${name || previewId}" from database.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPreviews = previews.filter((p) => {
    const query = searchQuery.toLowerCase();
    const name = p.lead?.name?.toLowerCase() || "";
    const cat = p.lead?.category?.toLowerCase() || "";
    const city = p.lead?.city?.toLowerCase() || "";
    const id = p.id.toLowerCase();
    return name.includes(query) || cat.includes(query) || city.includes(query) || id.includes(query);
  });

  const totalViews = previews.reduce((acc, p) => acc + (p.viewsCount || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-lime-400 uppercase tracking-widest mb-1">
            <Globe className="w-3.5 h-3.5" /> Client Landing Page Deployments
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Published Previews
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage live website preview links stored in Cloud Firestore. Delete inactive links to optimize storage.
          </p>
        </div>

        <Button
          onClick={fetchPreviews}
          disabled={loading}
          size="sm"
          variant="outline"
          className="bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 rounded-xl"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-lime-400 ${loading ? "animate-spin" : ""}`} /> Refresh List
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl rounded-2xl">
          <CardHeader className="py-3.5 px-5 flex flex-row items-center justify-between border-b border-slate-800/60">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Saved Previews</CardTitle>
            <Database className="h-4 w-4 text-lime-400" />
          </CardHeader>
          <CardContent className="p-5">
            <div className="text-3xl font-black text-white">{previews.length}</div>
            <p className="text-xs text-slate-400 mt-1">Active Firestore documents</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl rounded-2xl">
          <CardHeader className="py-3.5 px-5 flex flex-row items-center justify-between border-b border-slate-800/60">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Prospect Views</CardTitle>
            <Eye className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent className="p-5">
            <div className="text-3xl font-black text-white">{totalViews}</div>
            <p className="text-xs text-slate-400 mt-1">Client link opens recorded</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl rounded-2xl">
          <CardHeader className="py-3.5 px-5 flex flex-row items-center justify-between border-b border-slate-800/60">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Database Health</CardTitle>
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="p-5">
            <div className="text-3xl font-black text-emerald-400 flex items-center gap-1.5">
              <span>Healthy</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Collection: published_previews</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table List */}
      <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-bold text-white">
            Saved Previews List ({filteredPreviews.length})
          </CardTitle>
          <div className="relative max-w-xs w-full">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by business name, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9.5 h-10 rounded-xl bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-lime-500/30"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-lime-400 mb-2" />
              <p className="text-xs font-medium">Loading published previews from Firestore...</p>
            </div>
          ) : filteredPreviews.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Globe className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-200">No published previews found</p>
              <p className="text-xs text-slate-500 mt-1">Generate a client link in Phase 4 to see previews listed here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {filteredPreviews.map((preview) => {
                const leadName = preview.lead?.name || "Business Preview";
                const city = preview.lead?.city || "Unknown";
                const category = preview.lead?.category || "Local Business";
                const shareUrl = `${window.location.origin}/preview/${preview.id}`;
                const createdDate = preview.createdAt ? new Date(preview.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A";

                return (
                  <div key={preview.id} className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-start gap-3 overflow-hidden">
                      <div className="h-10 w-10 rounded-xl bg-slate-800 text-lime-400 flex items-center justify-center font-bold shrink-0 border border-slate-700 mt-0.5 shadow-sm">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-100 truncate">{leadName}</h4>
                          <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700 font-mono">
                            {category}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] bg-slate-800 text-lime-400 border-lime-500/30 font-mono">
                            {city}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" /> {createdDate}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-cyan-400">
                            <Eye className="h-3.5 w-3.5" /> {preview.viewsCount || 0} views
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">ID: {preview.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl);
                          toast.success("Preview link copied!");
                        }}
                        className="h-8 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 rounded-lg"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1 text-slate-400" /> Copy
                      </Button>

                      <a href={`/preview/${preview.id}`} target="_blank" rel="noopener noreferrer">
                        <Button size="xs" variant="outline" className="h-8 text-xs bg-slate-800 hover:bg-slate-700 text-lime-400 border-slate-700 rounded-lg">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                        </Button>
                      </a>

                      <Button
                        size="xs"
                        variant="ghost"
                        disabled={deletingId === preview.id}
                        onClick={() => handleDelete(preview.id, preview.lead?.name)}
                        className="h-8 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                      >
                        {deletingId === preview.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
