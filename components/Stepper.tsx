"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Scrape" },
  { id: 2, label: "Audit" },
  { id: 3, label: "Rank" },
  { id: 4, label: "Build" },
  { id: 5, label: "Outreach" },
];

export function Stepper({
  current,
  completed,
  onJump,
}: {
  current: number;
  completed: Set<number>;
  onJump: (n: number) => void;
}) {
  const percent = Math.round(((completed.size + (completed.has(current) ? 0 : 0.5)) / STEPS.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 pb-4 pt-2" role="navigation" aria-label="Pipeline progress">
      {/* Top micro progress bar */}
      <div className="w-full h-1.5 bg-sky-100 rounded-full overflow-hidden mb-3.5 shadow-inner">
        <motion.div
          className="h-full bg-gradient-to-r from-sky-500 via-sky-400 to-sky-600 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(100, Math.max(10, percent))}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-3">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-sky-600 font-bold tabular-nums">0{current}</span>
          <span className="text-slate-300">/</span>
          <span>05</span>
          <span className="mx-1.5 text-slate-300">•</span>
          <span className="text-slate-800 font-sans font-semibold tracking-tight">{STEPS[current - 1]?.label} Phase</span>
        </div>
        <div className="tabular-nums font-medium text-[10px] uppercase tracking-wider text-slate-400">
          {completed.size} of 5 Completed
        </div>
      </div>

      <div className="w-full flex items-center justify-between gap-2">
        {STEPS.map((step, i) => {
          const isDone = completed.has(step.id);
          const isCurrent = current === step.id;
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => onJump(step.id)}
                aria-label={`Phase ${step.id} of ${STEPS.length}: ${step.label}${isCurrent ? " (current)" : isDone ? " (completed)" : " (preview)"}`}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl py-1 px-2 cursor-pointer transition-all duration-200",
                  !isCurrent && !isDone && "opacity-60 hover:opacity-100",
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  animate={isCurrent ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={isCurrent ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" } : { duration: 0.2 }}
                  className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center text-xs font-mono transition-all duration-300 relative",
                    isCurrent
                      ? "bg-sky-500 text-white font-bold shadow-md shadow-sky-500/30 ring-2 ring-sky-300"
                      : isDone
                        ? "bg-sky-100 text-sky-700 font-semibold border border-sky-200"
                        : "bg-slate-100 text-slate-500 font-medium border border-slate-200",
                  )}
                >
                  {isCurrent && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-lg bg-sky-400/40 -z-10 blur-xs"
                    />
                  )}
                  {isDone && !isCurrent ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : step.id}
                </motion.div>
                <span
                  className={cn(
                    "text-[12px] font-sans transition-colors duration-200 hidden sm:inline-block",
                    isCurrent ? "text-sky-900 font-bold" : "text-slate-600 font-medium group-hover:text-slate-900",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-[2px] mx-2 bg-slate-200 relative overflow-hidden rounded-full">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isDone ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{ originX: 0 }}
                    className="absolute inset-0 bg-sky-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


