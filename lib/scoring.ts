import type { Lead, AuditResult, RankedLead } from "./types";

const HIGH_FIT_NICHES = ["dentist", "salon", "clinic", "spa", "gym", "restaurant", "cafe", "lawyer", "doctor", "coaching"];

export function scoreLead(lead: Lead, audit: AuditResult): RankedLead {
  const noOrBadSite = !audit.hasWebsite ? 25 : audit.pageSpeedScore < 50 ? 20 : audit.pageSpeedScore < 70 ? 10 : 0;
  const reviews = lead.reviewsCount ?? 0;
  const reviewVolume = Math.min(20, Math.round(reviews / 5));
  const rating = (lead.rating ?? 0) >= 4 ? 15 : (lead.rating ?? 0) >= 3.5 ? 8 : 0;
  const recency = reviews > 20 ? 10 : reviews > 5 ? 5 : 0;
  const reachable = (lead.phone ? 5 : 0) + (lead.whatsapp ? 5 : 0) + (lead.email ? 5 : 0);
  const fit = HIGH_FIT_NICHES.some((n) => lead.category.toLowerCase().includes(n)) ? 15 : 8;
  const score = noOrBadSite + reviewVolume + rating + recency + reachable + fit;
  return {
    ...lead,
    audit,
    score: Math.min(100, score),
    scoreBreakdown: {
      noOrBadSite,
      reviewVolume,
      rating,
      recency,
      reachable,
      industryFit: fit,
    },
  };
}

/** Formats single lead monthly loss as a realistic estimated assumption range (e.g. ~₹20k – ₹35k/mo) */
export function formatRevenueRange(amount: number): string {
  if (!amount || amount <= 0) return "—";
  // Cap single lead estimated loss between ₹15,000 and ₹45,000
  const normalized = Math.min(45000, Math.max(15000, amount));
  const minEst = Math.round((normalized * 0.8) / 1000);
  const maxEst = Math.round((normalized * 1.25) / 1000);
  return `~₹${minEst}k – ₹${maxEst}k`;
}

/** Formats total lead revenue loss sum as a realistic total assumption range in Lakhs (e.g. ~₹1.8L – ₹3.2L/mo) */
export function formatTotalRevenueRange(totalAmount: number): string {
  if (!totalAmount || totalAmount <= 0) return "—";
  const numLeads = Math.max(1, Math.round(totalAmount / 30000));
  const minLakhs = ((numLeads * 18000) / 100000).toFixed(1);
  const maxLakhs = ((numLeads * 35000) / 100000).toFixed(1);
  return `~₹${minLakhs}L – ₹${maxLakhs}L`;
}
