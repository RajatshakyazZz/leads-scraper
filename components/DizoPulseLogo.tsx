"use client";

export function DizoPulseLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div className={`relative group cursor-pointer ${className}`}>
      {/* Glow aura */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-sky-600 via-cyan-400 to-sky-300 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Outer gradient border */}
      <div className="relative h-full w-full rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 p-[1.5px] shadow-lg shadow-sky-500/30 transition-transform duration-300 group-hover:scale-105">
        <div className="h-full w-full rounded-[14.5px] bg-gradient-to-b from-slate-900 via-slate-900 to-sky-950 flex items-center justify-center relative overflow-hidden">
          {/* Glass sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          
          {/* Pulse SVG icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
          >
            {/* Electric Pulse Wave */}
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>

          {/* Glowing pulse dot */}
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400" />
        </div>
      </div>
    </div>
  );
}
