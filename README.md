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
- Firebase Web config values for Google login
- Firebase Admin service account for secure quota tracking
- Firebase Storage bucket for export files

Without them, the app serves the seeded demo dataset of 12 Bandra dentists — perfect for a reel.

## Firebase setup

1. Create a Firebase project.
2. Enable Authentication → Google provider.
3. Create a Firestore database.
4. Add a Web App in Firebase and copy its public config into `app/.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
5. Create a Firebase Admin service account and add it to `app/.env.local` as `FIREBASE_SERVICE_ACCOUNT_KEY`.
   Use base64 JSON for the cleanest deploy setup.
6. Add `FIREBASE_STORAGE_BUCKET` to `app/.env.local`. It is usually the same value as `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.
7. Deploy Firestore and Storage rules from this folder:

```bash
firebase deploy --only firestore:rules,storage
```

Free quota is controlled on the server with Firestore transactions. Default values:
- `FREE_LEAD_LIMIT=15`
- `SCRAPE_RATE_LIMIT_REQUESTS=5`
- `SCRAPE_RATE_LIMIT_WINDOW_SECONDS=60`

To increase one user's limit, edit their Firestore document at `users/{uid}` and set `leadLimit` to the new number.

Saved data:
- User leads are stored in Firestore at `users/{uid}/leads/{leadId}`.
- Generated prompts are stored in Firestore at `users/{uid}/prompts/{promptId}`.
- CSV exports are downloaded by the browser and also saved to Firebase Storage at `users/{uid}/exports/*.csv` when `FIREBASE_STORAGE_BUCKET` is configured.

## Run the skill

The same logic, packaged as a Claude Code skill:

```
.claude/skills/lead-to-launch/SKILL.md
```

In Claude Code: ask `run /lead-to-launch` (or just describe the goal — the skill description triggers it).
# Leads-scraper
