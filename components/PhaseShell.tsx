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
        <h1 className="font-sans font-extrabold text-2xl sm:text-4xl text-white tracking-tight uppercase leading-tight font-black">{title}</h1>
        <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl leading-relaxed font-sans">
          {subtitle}
        </p>
      </header>
      <div>{children}</div>
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-[#0B0F19]/95 backdrop-blur-md shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onPrev}
            disabled={prevDisabled || !onPrev}
            aria-label="Go to previous phase"
            className="h-10 px-5 rounded-xl border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-xs font-extrabold uppercase tracking-wider"
          >
            <ChevronLeft className="h-4 w-4 mr-1 text-lime-400" strokeWidth={2.5} /> Back
          </Button>
          <Button
            onClick={onNext}
            disabled={nextDisabled || !onNext}
            aria-label={nextLabel}
            className="h-10 px-6 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-lime-500/20 cursor-pointer transition-all"
          >
            {nextLabel} <ChevronRight className="h-4 w-4 ml-1" strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
