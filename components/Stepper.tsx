"use client";

import { motion } from "framer-motion";
import { Check, Search, FileSearch, Trophy, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Scrape", icon: Search },
  { id: 2, label: "Audit", icon: FileSearch },
  { id: 3, label: "Rank", icon: Trophy },
  { id: 4, label: "Build", icon: Sparkles },
  { id: 5, label: "Outreach", icon: Send },
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
  return (
    <div className="max-w-5xl mx-auto px-4 pb-5 pt-3" role="navigation" aria-label="Pipeline progress">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 text-center mb-4 font-sans font-semibold">
        Step <span className="font-mono text-foreground font-bold">{String(current).padStart(2, "0")}</span> <span className="text-muted-foreground/40">/</span> <span className="font-mono text-muted-foreground/60">05</span> · <span className="text-foreground">{STEPS[current - 1]?.label}</span>
      </div>
      <div className="w-full flex items-center justify-between gap-2">
      {STEPS.map((step, i) => {
        const isDone = completed.has(step.id);
        const isCurrent = current === step.id;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => onJump(step.id)}
              aria-label={`Phase ${step.id} of ${STEPS.length}: ${step.label}${isCurrent ? " (current)" : isDone ? " (completed)" : " (preview)"}`}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex flex-col items-center gap-2.5 group transition-all duration-300 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-1.5 cursor-pointer relative",
                !isCurrent && !isDone && "opacity-60 hover:opacity-100",
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.08 : 1,
                  backgroundColor: isCurrent ? "var(--primary)" : isDone ? "var(--secondary)" : "var(--card)",
                  boxShadow: isCurrent ? "var(--shadow-accent)" : "none",
                }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center border transition-colors duration-300",
                  isCurrent
                    ? "border-primary text-primary-foreground"
                    : isDone
                      ? "border-secondary-foreground/10 text-primary"
                      : "border-border text-muted-foreground/75",
                )}
              >
                {isDone && !isCurrent ? <Check className="h-4.5 w-4.5" strokeWidth={2} /> : <Icon className="h-4 w-4" strokeWidth={1.75} />}
              </motion.div>
              <span className={cn("text-[9px] tracking-[0.12em] uppercase font-sans transition-colors duration-300", isCurrent ? "text-foreground font-bold" : "text-muted-foreground font-medium")}>
                {step.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-[2px] mx-1 relative overflow-hidden bg-border/50 rounded-full">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isDone ? 1 : 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  style={{ originX: 0 }}
                  className="absolute inset-0 bg-primary"
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
