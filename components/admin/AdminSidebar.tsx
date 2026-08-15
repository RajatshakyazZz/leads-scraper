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
    <div className="flex flex-col h-full bg-slate-950/95 border-r border-slate-800/80 w-64 shrink-0 backdrop-blur-xl">
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
        <Image
          src="/icon.png"
          alt="ClientForge"
          width={36}
          height={36}
          priority
          className="h-9 w-9 object-contain rounded-xl border border-lime-500/40 bg-slate-900 p-1 shadow-sm shadow-lime-500/10"
        />
        <div>
          <div className="font-sans font-bold text-base tracking-tight leading-none text-white flex items-center gap-1">
            CLIENT<span className="text-lime-400 font-extrabold">FORGE</span>
          </div>
          <div className="text-[9px] text-lime-400/90 leading-tight tracking-[0.16em] uppercase mt-1 font-sans font-bold">
            Admin Workspace
          </div>
        </div>
        <Badge variant="secondary" className="ml-auto text-[9px] uppercase font-mono tracking-wider px-2 py-0.5 bg-lime-500/10 text-lime-400 border border-lime-500/30">
          PRO
        </Badge>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
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
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-lime-500/15 to-emerald-500/10 text-lime-400 border border-lime-500/30 shadow-sm shadow-lime-500/10 font-semibold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent"
              )}
            >
              <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-lime-400" : "text-slate-400")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2 text-slate-400 group-hover:text-rose-400" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="bg-slate-900 border-slate-800 text-slate-100 shadow-md rounded-full">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0">
        {renderSidebarContent()}
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md" onClick={() => setMobileOpen(false)}>
          <div className="fixed inset-y-0 left-0" onClick={e => e.stopPropagation()}>
            {renderSidebarContent()}
          </div>
        </div>
      )}
    </>
  );
}
