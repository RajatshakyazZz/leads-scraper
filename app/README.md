# Lead → Launch

Local-first dashboard + Claude Code skill that runs a 5-phase freelance website pipeline:

**Scrape** Google Maps → **Audit** sites (PageSpeed + gaps) → **Rank** by conversion score → **Build** site prompt for any platform → **Outreach** Hinglish/English with day-3 follow-up.

## Run the dashboard

```bash
cd app
npm run dev
# open http://localhost:3000
```

Optional — for live data, copy `app/.env.local.example` to `app/.env.local` and add:
- `APIFY_TOKEN` (Google Maps scraping)
- `GOOGLE_PAGESPEED_KEY` (PageSpeed audits)

Without them, the app serves the seeded demo dataset of 12 Bandra dentists — perfect for a reel.

## Run the skill

The same logic, packaged as a Claude Code skill:

```
.claude/skills/lead-to-launch/SKILL.md
```

In Claude Code: ask `run /lead-to-launch` (or just describe the goal — the skill description triggers it).
# Leads-scraper
