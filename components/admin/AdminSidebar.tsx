"use client";

import Image from "next/image";
import { LayoutDashboard, Users, Settings, BarChart3, ScrollText, LogOut, Menu, X, Globe } from "lucide-react";
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
    { id: "previews", label: "Published Previews", icon: Globe },
    { id: "users", label: "Users", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "logs", label: "Logs", icon: ScrollText },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-sky-100 w-64 shrink-0">
      <div className="p-5 flex items-center gap-2.5 border-b border-sky-100/60">
        <Image
          src="/icon.png"
          alt="ClientForge"
          width={36}
          height={36}
          priority
          className="h-9 w-9 object-contain rounded-xl border border-lime-500/30 bg-slate-950 p-1"
        />
        <div>
          <div className="font-sans font-bold text-base tracking-tight leading-none text-slate-900 flex items-center gap-1">
            CLIENT<span className="text-lime-600 font-extrabold">FORGE</span>
          </div>
          <div className="text-[9px] text-lime-600/90 leading-tight tracking-[0.14em] uppercase mt-0.5 font-sans font-bold">
            Admin Panel
          </div>
        </div>
        <Badge variant="secondary" className="ml-auto text-[9px] uppercase font-mono tracking-wider px-1.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200">Admin</Badge>
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
        {renderSidebarContent()}
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="fixed inset-y-0 left-0" onClick={e => e.stopPropagation()}>
            {renderSidebarContent()}
          </div>
        </div>
      )}
    </>
  );
}
