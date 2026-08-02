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
      <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(100, Math.max(10, percent))}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-3">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-foreground font-bold tabular-nums">0{current}</span>
          <span className="text-muted-foreground/40">/</span>
          <span>05</span>
          <span className="mx-1.5 text-muted-foreground/30">•</span>
          <span className="text-foreground font-sans font-semibold tracking-tight">{STEPS[current - 1]?.label} Phase</span>
        </div>
        <div className="tabular-nums font-medium text-[10px] uppercase tracking-wider text-muted-foreground/80">
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
                  "flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg py-1 px-2 cursor-pointer transition-all duration-150",
                  !isCurrent && !isDone && "opacity-50 hover:opacity-100",
                )}
              >
                <div
                  className={cn(
                    "h-6 w-6 rounded-md flex items-center justify-center text-xs font-mono transition-colors duration-200",
                    isCurrent
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : isDone
                        ? "bg-primary/10 text-primary font-medium"
                        : "bg-secondary text-muted-foreground font-medium border border-border/60",
                  )}
                >
                  {isDone && !isCurrent ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : step.id}
                </div>
                <span
                  className={cn(
                    "text-[12px] font-sans transition-colors duration-200 hidden sm:inline-block",
                    isCurrent ? "text-foreground font-semibold" : "text-muted-foreground font-medium",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-[1px] mx-2 bg-border/60 relative overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isDone ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    style={{ originX: 0 }}
                    className="absolute inset-0 bg-primary/40"
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

