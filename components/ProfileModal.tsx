"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User,
  Building2,
  Briefcase,
  Globe,
  Phone,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Zap,
  Save,
  Loader2,
  X,
  Sparkles,
  Layers,
  CheckCircle2,
  ExternalLink,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";

type ProfileModalProps = {
  onClose: () => void;
};

const WHATSAPP_LIMIT_URL = `https://wa.me/917895317940?text=${encodeURIComponent("Hi, I want to upgrade my ClientForge Account & Increase Lead Quota.")}`;

export function ProfileModal({ onClose }: ProfileModalProps) {
  const { getIdToken, user, quota } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("identity");

  const [formData, setFormData] = useState({
    displayName: "",
    agencyName: "",
    professionalRole: "",
    phone: "",
    whatsapp: "",
    portfolioUrl: "",
    calComLink: "",
    pitchSignature: "",
    photoURL: "",
  });

  const [stats, setStats] = useState({
    totalSessions: 0,
    totalLeads: 0,
    leadsUsed: 0,
    leadLimit: 15,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = await getIdToken();
        const res = await fetch("/api/account", {
          headers: { authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.profile) {
          setFormData({
            displayName: data.profile.displayName || user?.displayName || "ClientForge Specialist",
            agencyName: data.profile.agencyName || "Growth Forge Studio",
            professionalRole: data.profile.professionalRole || "Freelance Web Specialist & Outreach Strategist",
            phone: data.profile.phone || "+91 98765 43210",
            whatsapp: data.profile.whatsapp || "+91 98765 43210",
            portfolioUrl: data.profile.portfolioUrl || "https://clientforge.app",
            calComLink: data.profile.calComLink || "https://cal.com/agency/30min",
            pitchSignature: data.profile.pitchSignature || `Best regards,\n${data.profile.displayName || "Rajat Shakya"} | ClientForge Team`,
            photoURL: data.profile.photoURL || user?.photoURL || "/icon.png",
          });
          if (data.stats) {
            setStats(data.stats);
          }
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [getIdToken, user]);

  async function handleSave() {
    setSaving(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/account", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success("Profile & Agency settings updated!");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0B0F19] text-white shadow-2xl overflow-hidden"
      >
        {/* Header Profile Hero Card */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-[#0F172A] via-[#111A2E] to-[#0A101C] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-slate-950 border-2 border-lime-400/80 p-1 flex items-center justify-center shadow-lg shadow-lime-500/20 overflow-hidden">
                  <img
                    src={formData.photoURL || "/icon.png"}
                    alt={formData.displayName}
                    className="h-full w-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/icon.png";
                    }}
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 bg-lime-400 border-2 border-slate-950 rounded-full" title="Active Agency Account" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif font-black text-xl text-white tracking-tight">{formData.displayName}</h2>
                  <Badge className="bg-lime-500/15 text-lime-400 border-lime-500/30 font-mono text-[10px] font-black uppercase tracking-wider">
                    PRO AGENCY
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email || "agency@clientforge.app"}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-2">
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3 text-lime-400" /> {formData.agencyName}</span>
                  <span>•</span>
                  <span className="text-slate-300">{formData.professionalRole}</span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-xl h-8.5 w-8.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Modal Body with Tabs */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-lime-400 animate-spin" />
            <span className="text-xs font-mono text-slate-400">Loading agency profile settings...</span>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-10 rounded-xl border border-slate-800 bg-slate-950 p-1">
                <TabsTrigger value="identity" className="text-xs font-mono font-bold rounded-lg py-1.5 data-[state=active]:bg-lime-500 data-[state=active]:text-slate-950">
                  <User className="h-3.5 w-3.5 mr-1.5" /> Identity & Bio
                </TabsTrigger>
                <TabsTrigger value="outreach" className="text-xs font-mono font-bold rounded-lg py-1.5 data-[state=active]:bg-lime-500 data-[state=active]:text-slate-950">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Outreach Settings
                </TabsTrigger>
                <TabsTrigger value="quota" className="text-xs font-mono font-bold rounded-lg py-1.5 data-[state=active]:bg-lime-500 data-[state=active]:text-slate-950">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Quota & Stats
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Identity & Agency Info */}
              <TabsContent value="identity" className="space-y-4 pt-4 animate-in fade-in-50 duration-200">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold flex items-center gap-1.5">
                      <User className="h-3 w-3 text-lime-400" /> Full Display Name
                    </Label>
                    <Input
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="e.g. Rajat Shakya"
                      className="h-10 text-sm rounded-xl border-slate-800 bg-slate-950 text-white font-bold focus-visible:ring-1 focus-visible:ring-lime-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-lime-400" /> Agency / Studio Name
                    </Label>
                    <Input
                      value={formData.agencyName}
                      onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                      placeholder="e.g. ClientForge Agency"
                      className="h-10 text-sm rounded-xl border-slate-800 bg-slate-950 text-white font-bold focus-visible:ring-1 focus-visible:ring-lime-400"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3 text-lime-400" /> Professional Role / Title
                    </Label>
                    <Input
                      value={formData.professionalRole}
                      onChange={(e) => setFormData({ ...formData, professionalRole: e.target.value })}
                      placeholder="e.g. Web Specialist & Cold Outreach Strategist"
                      className="h-10 text-sm rounded-xl border-slate-800 bg-slate-950 text-white font-bold focus-visible:ring-1 focus-visible:ring-lime-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-lime-400" /> Agency Portfolio URL
                    </Label>
                    <Input
                      value={formData.portfolioUrl}
                      onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                      placeholder="e.g. https://clientforge.app"
                      className="h-10 text-sm rounded-xl border-slate-800 bg-slate-950 text-white font-mono font-bold focus-visible:ring-1 focus-visible:ring-lime-400"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Outreach Settings */}
              <TabsContent value="outreach" className="space-y-4 pt-4 animate-in fade-in-50 duration-200">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-lime-400" /> WhatsApp Direct Number
                    </Label>
                    <Input
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="h-10 text-sm rounded-xl border-slate-800 bg-slate-950 text-white font-mono font-bold focus-visible:ring-1 focus-visible:ring-lime-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-lime-400" /> Cal.com / Booking Link
                    </Label>
                    <Input
                      value={formData.calComLink}
                      onChange={(e) => setFormData({ ...formData, calComLink: e.target.value })}
                      placeholder="e.g. https://cal.com/agency/30min"
                      className="h-10 text-sm rounded-xl border-slate-800 bg-slate-950 text-white font-mono font-bold focus-visible:ring-1 focus-visible:ring-lime-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3 text-lime-400" /> Cold Pitch Sign-Off Signature
                  </Label>
                  <Textarea
                    value={formData.pitchSignature}
                    onChange={(e) => setFormData({ ...formData, pitchSignature: e.target.value })}
                    rows={3}
                    placeholder="e.g. Best regards, Rajat Shakya | ClientForge Lead Team"
                    className="font-mono text-xs leading-relaxed rounded-xl border-slate-800 bg-slate-950 text-white p-3 focus-visible:ring-1 focus-visible:ring-lime-400"
                  />
                </div>
              </TabsContent>

              {/* Tab 3: Quota & Account Statistics */}
              <TabsContent value="quota" className="space-y-4 pt-4 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold">Lead Sessions</div>
                    <div className="font-mono text-2xl font-black text-white mt-1 tabular-nums">{stats.totalSessions}</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold">Scraped Businesses</div>
                    <div className="font-mono text-2xl font-black text-lime-400 mt-1 tabular-nums">{stats.totalLeads}</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-mono font-extrabold">Leads Quota Used</div>
                    <div className="font-mono text-2xl font-black text-white mt-1 tabular-nums">
                      {quota ? quota.leadsUsed : stats.leadsUsed} / {quota ? quota.leadLimit : stats.leadLimit}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-xs font-mono font-black text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" /> Need Unlimited Leads & Custom Agency Domain?
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-sans">
                      Upgrade to Enterprise Tier to unlock unlimited Google Maps scraping and white-label website previews.
                    </p>
                  </div>
                  <a
                    href={WHATSAPP_LIMIT_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({
                      className: "h-9 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-lime-500/20 cursor-pointer"
                    })}
                  >
                    <MessageCircle className="h-4 w-4 mr-1.5" /> Upgrade Plan
                  </a>
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-[11px] font-mono text-slate-500">Changes persist across sessions in Cloud Firestore</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="h-9 rounded-xl text-xs font-bold border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="h-9 px-5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-lime-500/20 cursor-pointer">
                  {saving ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
