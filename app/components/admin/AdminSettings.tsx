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
import { Save, Loader2 } from "lucide-react";

export function AdminSettings() {
  const { adminFetch } = useAdmin();
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
      } catch (e) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [adminFetch]);

  const handleChange = (key: string, value: any) => {
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
    } catch (e) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Card><CardContent className="p-6 h-96"><Skeleton className="h-full w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="font-display text-3xl">Global Settings</h1>
        <p className="text-muted-foreground mt-1">Configure limits and feature flags across the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Limits</CardTitle>
          <CardDescription>Default limits for different user tiers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="freeLeadLimit">Free Lead Limit</Label>
              <Input 
                id="freeLeadLimit" type="number" 
                value={settings.freeLeadLimit} 
                onChange={(e) => handleChange("freeLeadLimit", Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proLeadLimit">Pro Lead Limit</Label>
              <Input 
                id="proLeadLimit" type="number" 
                value={settings.proLeadLimit} 
                onChange={(e) => handleChange("proLeadLimit", Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyScrapeLimit">Daily Scrape Limit</Label>
              <Input 
                id="dailyScrapeLimit" type="number" 
                value={settings.dailyScrapeLimit} 
                onChange={(e) => handleChange("dailyScrapeLimit", Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyExportLimit">Monthly Export Limit</Label>
              <Input 
                id="monthlyExportLimit" type="number" 
                value={settings.monthlyExportLimit} 
                onChange={(e) => handleChange("monthlyExportLimit", Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageSpeedDailyLimit">PageSpeed Daily Limit</Label>
              <Input 
                id="pageSpeedDailyLimit" type="number" 
                value={settings.pageSpeedDailyLimit} 
                onChange={(e) => handleChange("pageSpeedDailyLimit", Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apifyDailyLimit">Apify Daily Limit</Label>
              <Input 
                id="apifyDailyLimit" type="number" 
                value={settings.apifyDailyLimit} 
                onChange={(e) => handleChange("apifyDailyLimit", Number(e.target.value))} 
              />
            </div>
          </div>
        </CardContent>
        
        <Separator />
        
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Enable or disable core platform features instantly.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              { key: "allowRegistration", label: "Allow New Registrations", desc: "If disabled, new users cannot sign up." },
              { key: "maintenanceMode", label: "Maintenance Mode", desc: "If enabled, the app shows a maintenance screen." },
              { key: "enableScraping", label: "Enable Scraping", desc: "Allow users to scrape new leads from Google Maps." },
              { key: "enableExport", label: "Enable CSV Export", desc: "Allow users to export leads to CSV." },
              { key: "enableOutreach", label: "Enable Outreach AI", desc: "Allow users to generate outreach messages." },
              { key: "enableAiBuild", label: "Enable AI Website Builder", desc: "Allow users to generate website prompts." },
              { key: "enableRanking", label: "Enable Lead Ranking", desc: "Allow users to rank leads." },
            ].map((flag) => (
              <div key={flag.key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={flag.key} className="text-base">{flag.label}</Label>
                  <p className="text-sm text-muted-foreground">{flag.desc}</p>
                </div>
                <Switch 
                  id={flag.key} 
                  checked={settings[flag.key] === true}
                  onCheckedChange={(checked) => handleChange(flag.key, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t border-border flex justify-end py-4">
          <Button onClick={handleSave} disabled={!dirty || saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
