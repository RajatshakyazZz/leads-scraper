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
    <div className="max-w-4xl mx-auto px-4 pb-3 pt-2" role="navigation" aria-label="Pipeline progress">
      {/* Micro progress bar */}
      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-3 border border-slate-800">
        <motion.div
          className="h-full bg-lime-400 shadow-[0_0_12px_rgba(132,204,22,0.6)]"
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(100, Math.max(10, percent))}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-lime-400 font-mono font-black tabular-nums">0{current}</span>
          <span className="text-slate-600">/</span>
          <span>05</span>
          <span className="mx-1.5 text-slate-600">•</span>
          <span className="text-white font-black tracking-wider uppercase">{STEPS[current - 1]?.label} PHASE</span>
        </div>
        <div className="tabular-nums font-extrabold text-[10px] uppercase tracking-widest text-slate-400">
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
                aria-label={`Phase ${step.id} of ${STEPS.length}: ${step.label}`}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 group focus-visible:outline-none rounded-xl py-1 px-2 cursor-pointer transition-all duration-200",
                  !isCurrent && !isDone && "opacity-50 hover:opacity-100",
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center text-xs font-mono transition-all duration-300 relative",
                    isCurrent
                      ? "bg-lime-400 text-slate-950 font-black shadow-md shadow-lime-400/30 ring-2 ring-lime-300"
                      : isDone
                        ? "bg-slate-800 text-lime-400 font-bold border border-lime-500/30"
                        : "bg-slate-900 text-slate-400 font-bold border border-slate-800",
                  )}
                >
                  {isDone && !isCurrent ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : step.id}
                </motion.div>
                <span
                  className={cn(
                    "text-[12px] font-sans transition-colors duration-200 hidden sm:inline-block uppercase tracking-wider",
                    isCurrent ? "text-lime-400 font-black" : "text-slate-400 font-bold group-hover:text-white",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-[2px] mx-2 bg-slate-800 relative overflow-hidden rounded-full">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isDone ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{ originX: 0 }}
                    className="absolute inset-0 bg-lime-400"
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
