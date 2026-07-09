# Lead → Launch — Setup Guide

Find local-business clients, audit their websites, rank them, generate a site-builder prompt, and draft outreach — in one dashboard.

**5 phases:** Scrape Google Maps → Audit (PageSpeed + gaps) → Rank by conversion score → Build site prompt → Outreach (Hinglish/English + day-3 follow-up).

---

## 1. What you need

| Requirement | Needed for | Cost |
|---|---|---|
| **Node.js 18+** | Running the app | Free — [nodejs.org](https://nodejs.org) (download LTS) |
| **Apify API token** | Live Google Maps scraping (Phase 1) | Free tier — $5 monthly credit ≈ 500+ leads |
| **Google PageSpeed API key** | Real site-speed audits (Phase 2) | Free — generous daily quota |

**No keys? No problem.** The app ships with a demo dataset (12 dentists in Bandra, Mumbai) so you can click through all 5 phases before setting anything up.

---

## 2. Install & run

**Mac:**
1. Unzip the folder anywhere (e.g. Desktop).
2. Double-click `Launch.command`.
   - If macOS blocks it: right-click → **Open** → **Open** (one-time).
3. Browser opens at `http://localhost:3000` automatically.

**Windows:**
1. Unzip the folder.
2. Double-click `Launch.bat`.
3. Open `http://localhost:3000` in your browser.

**Manual (any OS):**
```bash
cd app
npm install
npm run dev
# open http://localhost:3000
```

First run installs dependencies (1–2 min). To stop: press `Ctrl + C` in the terminal window, or close it.

---

## 3. Connect live data (10 minutes, both free)

Create your env file first:

```bash
cd app
cp .env.local.example .env.local
```

(Windows: copy `.env.local.example`, rename the copy to `.env.local`.)

### A) Apify — live Google Maps scraping

1. Sign up free at [apify.com](https://apify.com) (no card needed).
2. Go to **Settings → API & Integrations → API tokens**.
3. Copy your token (starts with `apify_api_...`).
4. Paste into `app/.env.local`:
   ```
   APIFY_TOKEN=apify_api_xxxxxxxxxxxx
   ```
5. Leave `APIFY_ACTOR` as is — it uses the **Google Maps Scraper** (`/crawler-google-placcompasses`), no install needed.

Free tier gives $5/month platform credit. Google Maps scraping costs ~$0.007/lead, so ~500–700 leads/month free. Scraping 12–25 leads per run costs a few cents of credit.

### B) Google PageSpeed Insights — real site audits

1. Go to [Google PageSpeed API get-started](https://developers.google.com/speed/docs/insights/v5/get-started).
2. Click **Get a Key** → select/create a project → copy the key.
3. Paste into `app/.env.local`:
   ```
   GOOGLE_PAGESPEED_KEY=AIzaxxxxxxxxxxxx
   ```

Free: 25,000 requests/day. You'll never hit it.

### Restart after adding keys

Stop the server (`Ctrl + C`) and relaunch. The app auto-detects keys:
- **No keys** → demo dataset.
- **Apify only** → live leads, audits based on gaps (no speed score).
- **Both** → fully live pipeline.

---

## 4. Using the tool

1. **Phase 1 — Scrape:** enter niche ("Salon"), city ("Andheri, Mumbai"), count (12–25). Hit scrape.
2. **Phase 2 — Audit:** each lead gets PageSpeed score, gap list, biggest-gap one-liner, and estimated lost ₹/month.
3. **Phase 3 — Rank:** leads sorted by conversion score. Pick your best prospect.
4. **Phase 4 — Build:** copy the generated prompt into Lovable, Bolt, Claude Code, or any builder → get a demo site in minutes. Deploy it free (Vercel/Netlify) and copy the link.
5. **Phase 5 — Outreach:** WhatsApp / Email / Instagram drafts in Hinglish or English, plus a day-3 follow-up. Before sending, replace:
   - `[your-demo-link]` → your deployed demo URL
   - `[Your Name]` → your name

---

## 5. Bonus — Claude Code skill

If you use Claude Code, the same pipeline works as a chat skill — no dashboard needed:

```
.claude/skills/lead-to-launch/SKILL.md
```

Open this folder in Claude Code and say **"run /lead-to-launch"** or just "scrape salons in Indiranagar". Connect the Apify MCP for live scraping inside chat.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `node: command not found` | Install Node.js from nodejs.org, restart terminal |
| Port 3000 busy | Run `PORT=3001 npm run dev` (Mac) / `set PORT=3001 && npm run dev` (Windows) |
| Mac blocks Launch.command | Right-click → Open → Open. Or run `chmod +x Launch.command` in Terminal |
| Scrape returns demo data with token set | Key must be in `app/.env.local` (not the example file); restart server |
| Apify error / empty results | Check token, check credit balance at console.apify.com |
