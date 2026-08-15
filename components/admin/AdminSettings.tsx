"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./AdminProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, Loader2, Settings, Shield, Sliders } from "lucide-react";

export function AdminSettings() {
  const { adminFetch } = useAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await adminFetch("/api/admin/settings");
        if (res.ok) {
          setSettings(await res.json());
        }
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [adminFetch]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (key: string, value: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSettings((prev: any) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSettings(await res.json());
        setDirty(false);
        toast.success("Settings saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48 bg-slate-800" />
        <Card className="bg-slate-900 border-slate-800"><CardContent className="p-6 h-96"><Skeleton className="h-full w-full bg-slate-800" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-lime-400 uppercase tracking-widest mb-1">
          <Settings className="w-3.5 h-3.5" /> System Configuration
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Global Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure global platform limits, rate limiting, and system feature toggles.</p>
      </div>

      <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800/80">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-lime-400" /> Tier Usage & Quota Rules
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Default lead generation limits for Free and Pro accounts.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="freeLeadLimit" className="text-xs font-bold text-slate-300">Free Tier Lead Quota</Label>
              <Input 
                id="freeLeadLimit" type="number" 
                value={settings.freeLeadLimit} 
                onChange={(e) => handleChange("freeLeadLimit", Number(e.target.value))}
                className="bg-slate-950 border-slate-800 text-slate-100 text-sm rounded-xl focus-visible:ring-lime-500/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proLeadLimit" className="text-xs font-bold text-slate-300">Pro Tier Lead Quota</Label>
              <Input 
                id="proLeadLimit" type="number" 
                value={settings.proLeadLimit} 
                onChange={(e) => handleChange("proLeadLimit", Number(e.target.value))} 
                className="bg-slate-950 border-slate-800 text-slate-100 text-sm rounded-xl focus-visible:ring-lime-500/30"
              />
            </div>
          </div>

          <Separator className="bg-slate-800/80" />

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-cyan-400" /> Platform Security & Toggles
            </h3>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="space-y-0.5">
                <Label htmlFor="signupAllowed" className="text-sm font-semibold text-slate-200">Public User Registration</Label>
                <p className="text-xs text-slate-400">Allow new users to sign up via Google Auth.</p>
              </div>
              <Switch 
                id="signupAllowed" 
                checked={settings.signupAllowed} 
                onCheckedChange={(checked) => handleChange("signupAllowed", checked)} 
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode" className="text-sm font-semibold text-slate-200">Maintenance Mode</Label>
                <p className="text-xs text-slate-400">Temporarily restrict lead scraping to administrators.</p>
              </div>
              <Switch 
                id="maintenanceMode" 
                checked={settings.maintenanceMode} 
                onCheckedChange={(checked) => handleChange("maintenanceMode", checked)} 
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={!dirty || saving}
            className="bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold px-5 rounded-xl shadow-lg shadow-lime-500/10 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
