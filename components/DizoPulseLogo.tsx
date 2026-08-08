"use client";

import Image from "next/image";

export function LeadForgeLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div className={`relative group cursor-pointer ${className}`}>
      {/* Glow aura */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-lime-500 via-emerald-400 to-lime-300 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Outer gradient border */}
      <div className="relative h-full w-full rounded-2xl bg-gradient-to-tr from-lime-500 via-lime-400 to-emerald-400 p-[1.5px] shadow-lg shadow-lime-500/30 transition-transform duration-300 group-hover:scale-105">
        <div className="h-full w-full rounded-[14.5px] bg-slate-950 flex items-center justify-center relative overflow-hidden p-1">
          {/* Glass sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          
          <img
            src="/icon.png"
            alt="LeadForge Logo"
            className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(132,204,22,0.8)]"
          />

          {/* Glowing pulse dot */}
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-lime-400 animate-ping" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-lime-400" />
        </div>
      </div>
    </div>
  );
}

// Alias export for backward compatibility
export const DizoPulseLogo = LeadForgeLogo;
