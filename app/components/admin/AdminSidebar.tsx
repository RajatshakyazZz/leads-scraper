"use client";

import { LayoutDashboard, Users, Settings, BarChart3, ScrollText, LogOut, Sparkles, Menu, X } from "lucide-react";
import { useAdmin } from "./AdminProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

type AdminSidebarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { logout } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "logs", label: "Logs", icon: ScrollText },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border w-64 shrink-0">
      <div className="p-6 flex items-center gap-2">
        <div className="bg-primary/10 p-1.5 rounded-lg">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <span className="font-display text-xl font-bold tracking-tight">Lead <span className="text-muted-foreground font-normal font-sans">→</span> Launch</span>
        <Badge variant="secondary" className="ml-auto text-[10px] uppercase font-mono tracking-widest px-1.5 py-0">Admin</Badge>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="bg-card shadow-sm rounded-full">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="fixed inset-y-0 left-0" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
