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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-7xl mx-auto px-4 sm:px-6 pb-36"
    >
      <header className="mb-6 sm:mb-8">
        <h1 className="font-sans font-bold text-2xl sm:text-3xl text-foreground tracking-tight leading-tight">{title}</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-2xl leading-relaxed font-sans font-normal">
          {subtitle}
        </p>
      </header>
      <div>{children}</div>
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-sky-100 bg-white/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onPrev}
            disabled={prevDisabled || !onPrev}
            aria-label="Go to previous phase"
            className="h-9 px-4 rounded-lg border-sky-200 text-foreground hover:bg-sky-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1 text-sky-600" strokeWidth={2} /> Back
          </Button>
          <Button
            onClick={onNext}
            disabled={nextDisabled || !onNext}
            aria-label={nextLabel}
            className="h-9 px-5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-xs transition-colors"
          >
            {nextLabel} <ChevronRight className="h-4 w-4 ml-1" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
