"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function PhaseShell({
  title,
  subtitle,
  children,
  onPrev,
  onNext,
  nextLabel = "Next phase",
  nextDisabled = false,
  prevDisabled = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  prevDisabled?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-7xl mx-auto px-4 sm:px-6 pb-36"
    >
      <header className="mb-8 md:mb-10">
        <h1 className="font-display text-3xl sm:text-4.5xl text-foreground tracking-tight leading-[1.1]">{title}</h1>
        <p className="text-muted-foreground/95 mt-3 text-sm sm:text-base max-w-2xl leading-relaxed font-sans">
          {subtitle}
        </p>
      </header>
      <div>{children}</div>
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/80 backdrop-blur-md shadow-[0_-8px_30px_rgba(44,38,32,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onPrev}
            disabled={prevDisabled || !onPrev}
            aria-label="Go to previous phase"
            className="h-10 px-4 rounded-xl border-border bg-card/50 text-foreground transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4 mr-1.5 text-muted-foreground group-hover/button:-translate-x-0.5 transition-transform" strokeWidth={2} /> Back
          </Button>
          <Button
            onClick={onNext}
            disabled={nextDisabled || !onNext}
            aria-label={nextLabel}
            className="h-10 px-5 rounded-xl transition-all duration-200"
          >
            {nextLabel} <ChevronRight className="h-4 w-4 ml-1.5 group-hover/button:translate-x-0.5 transition-transform" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
