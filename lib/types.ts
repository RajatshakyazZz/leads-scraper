export type Lead = {
  id: string;
  sourceLeadId?: string;
  name: string;
  category: string;
  address: string;
  city: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviewsCount?: number;
  lat: number;
  lng: number;
  photosCount?: number;
  yearsInBusiness?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AuditResult = {
  leadId: string;
  pageSpeedScore: number;
  hasWebsite: boolean;
  mobileFriendly: boolean;
  https: boolean;
  hasSchema: boolean;
  loadTimeMs: number;
  gaps: string[];
  biggestGap: string;
  estLostRevenuePerMonth: number;
};

export type RankedLead = Lead & {
  audit: AuditResult;
  score: number;
  scoreBreakdown: {
    noOrBadSite: number;
    reviewVolume: number;
    rating: number;
    recency: number;
    reachable: number;
    industryFit: number;
  };
};

export type ScrapeInput = {
  niche: string;
  city: string;
  count: number;
};

export type AccountQuota = {
  leadLimit: number;
  leadsUsed: number;
  remaining: number;
};

export type AccountProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type OutreachChannel = "whatsapp" | "email" | "instagram";
export type OutreachLanguage = "english" | "hinglish";

export type SavedPrompt = {
  id: string;
  leadId: string;
  leadName: string;
  platform: string;
  prompt: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ScrapeSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  niche: string;
  city: string;
  countRequested: number;
  countReceived: number;
  source: "apify" | "seed" | "seed-fallback";
  status: "scraping" | "completed" | "failed";
  creditsUsed: number;
  durationMs: number;
  error?: string;
  pipeline: {
    scrapeComplete: boolean;
    auditComplete: boolean;
    rankComplete: boolean;
    buildComplete: boolean;
    outreachComplete: boolean;
  };
};

export type SessionLead = Lead & {
  sessionId: string;
  googleMapsUrl?: string;
  businessStatus?: string;
  socialLinks?: Record<string, string>;
};

export type SessionAudit = AuditResult & {
  sessionId: string;
  createdAt?: string;
};

export type SessionRanking = {
  leadId: string;
  sessionId: string;
  score: number;
  scoreBreakdown: {
    noOrBadSite: number;
    reviewVolume: number;
    rating: number;
    recency: number;
    reachable: number;
    industryFit: number;
  };
  rank: number;
  createdAt?: string;
};

export type SessionBuild = {
  id: string;
  sessionId: string;
  leadId: string;
  leadName: string;
  platform: string;
  prompt: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
};

export type SessionOutreach = {
  id: string;
  sessionId: string;
  leadId: string;
  leadName: string;
  channel: OutreachChannel;
  language: OutreachLanguage;
  subject?: string;
  body: string;
  followUp?: string;
  status: "draft" | "sent" | "replied";
  createdAt?: string;
  updatedAt?: string;
};
