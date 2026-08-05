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
  Layers,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6 text-sky-600" /> Published Client Previews
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Manage live website preview links stored in Cloud Firestore. Delete inactive links to free up database load.
          </p>
        </div>

        <Button onClick={fetchPreviews} disabled={loading} size="sm" variant="outline" className="rounded-xl h-9 border-sky-200 text-sky-700 font-semibold hover:bg-sky-50">
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh List
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-sky-100 bg-white shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Saved Previews</CardTitle>
            <Database className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-extrabold text-slate-900">{previews.length}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Active Firestore documents</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-sky-100 bg-white shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Prospect Views</CardTitle>
            <Eye className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-extrabold text-slate-900">{totalViews}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Client link opens recorded</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-sky-100 bg-white shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Database Status</CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-extrabold text-emerald-600 flex items-center gap-1.5">
              <span>Healthy</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Cloud Firestore collection: published_previews</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table List */}
      <Card className="rounded-2xl border-sky-100 bg-white shadow-sm overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-sky-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-bold text-slate-900">
            Saved Previews List ({filteredPreviews.length})
          </CardTitle>
          <div className="relative max-w-xs w-full">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by business name, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl border-sky-200 text-xs focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-600 mb-2" />
              <p className="text-xs font-medium">Loading published previews from Firestore...</p>
            </div>
          ) : filteredPreviews.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Globe className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No published previews found</p>
              <p className="text-xs text-slate-400 mt-1">Generate a client link in Phase 4 to see previews listed here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPreviews.map((preview) => {
                const leadName = preview.lead?.name || "Business Preview";
                const city = preview.lead?.city || "Unknown";
                const category = preview.lead?.category || "Local Business";
                const shareUrl = `${window.location.origin}/preview/${preview.id}`;
                const createdDate = preview.createdAt ? new Date(preview.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A";

                return (
                  <div key={preview.id} className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-start gap-3 overflow-hidden">
                      <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0 border border-amber-200 mt-0.5">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="truncate space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-900 truncate">{leadName}</h4>
                          <Badge variant="outline" className="text-[10px] font-bold border-amber-300 bg-amber-50 text-amber-800 rounded-md py-0">
                            {category}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 text-slate-600 rounded-md py-0">
                            {city}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono truncate">
                          <span>ID: {preview.id}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {preview.viewsCount || 0} views
                          </span>
                          <span>•</span>
                          <span>Created: {createdDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl);
                          toast.success("Client link copied to clipboard!");
                        }}
                        className="h-8 rounded-xl border-sky-200 text-sky-700 text-xs font-semibold hover:bg-sky-50"
                        title="Copy Link"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/preview/${preview.id}`, "_blank")}
                        className="h-8 rounded-xl border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100"
                        title="View Preview"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(preview.id, leadName)}
                        disabled={deletingId === preview.id}
                        className="h-8 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                        title="Delete from Database"
                      >
                        {deletingId === preview.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                        )}
                        Delete
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
