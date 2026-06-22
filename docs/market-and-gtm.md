# Hey Podcast — Market Analysis & Go-To-Market

_Last updated: June 2026_

A strategy reference for positioning, monetization, and the fastest path to first
revenue. This is a business document, not a spec — see `guide.md` / the codebase for
the engine details.

---

## 1. What the product actually is

Hey Podcast turns current news into a **personalized, two-host ~10-minute daily audio
digest**:

- **Per-user digests** built from the topics a user follows.
- **Shared "global" per-topic digests** generated once for everyone (hybrid caching).
- Pipeline: **Gemini** (grounded brief via Google Search → two-host script) →
  **Deepgram** TTS → stitched WAV → **Cloudinary** CDN → mobile feed.
- React Native (Expo) app + Express/Postgres API + Next.js admin.
- Freemium: free daily digest, premium for unlimited on-demand + offline downloads.
  Billing is **not live yet** — premium is unlocked via promo codes for now.

The correct framing: this is **personalized AI audio news**, a sub-segment of the
AI-audio wave — *not* a "podcast creation tool."

---

## 2. Competitive landscape

Three tiers; the top one is the real pressure.

**Platform incumbents (the threat):**
- **Google NotebookLM "Audio Overviews"** — the same two-host conversational format,
  free, hugely popular, built on Gemini (our own model).
- **Google "Daily Listen"** (Search Labs) — a *personalized daily AI news audio digest*
  from your interests. Nearly identical to our core feature, from the company that owns
  Android, Search, and the model.
- **Spotify AI DJ** — personalized audio + AI voice commentary, inside an app 600M+
  people already have.

**Creator tools (adjacent, not our fight):** Wondercraft, Podcastle, ElevenLabs Studio,
Jellypod, Descript — they help people *make* podcasts; we auto-generate *for* listeners.

**AI news apps (closest peers):** Particle, Bulletin, News Minimalist, ElevenReader,
the remnants of Artifact (sold to Yahoo). Mostly text-first; few nail conversational audio.

**Blunt finding:** "generic personalized AI news podcast for everyone, in English" is
being commoditized by Google and Spotify, who have zero-CAC distribution and own the
model. A standalone app doing the same generic thing has no moat and loses on cost and reach.

---

## 3. Business gaps (where the consumer-generic model breaks)

1. **Differentiation** — the core loop is already shipped by Google (Daily Listen).
   No defensible "why us, not the free pre-installed option."
2. **Unit economics** — daily LLM+TTS generation *per user* is expensive (the engine
   even comments on the "naive daily-for-everyone" cost; we've already hit Gemini's free
   quota wall). At ~$9/mo, COGS can eat the margin. Shared caching helps but is partial.
3. **Monetization** — consumers have repeatedly proven they won't pay much for news audio
   (subscription fatigue; Artifact died partly on this).
4. **Trust** — in news, credibility *is* the product. Opaque AI news risks
   hallucination/bias — a liability, but also an opening (see §4).
5. **Distribution** — a new app fighting for installs against Google/Spotify surfaces is brutal.

---

## 4. The whitespace (where to compete)

Incumbents go **broad, shallow, English, US, consumer-free.** The opening is the inverse:

- **Vertical depth** — "daily AI brief for fintech / biotech / a dev ecosystem / a sports
  league / a stock watchlist." Google won't curate domain-credible depth for a niche;
  professionals there have real willingness to pay.
- **Localized / non-English / regional** — Daily Listen is English/US-first. A personalized
  daily news pod in an underserved language/region (e.g. Bangla / South Asia — already our
  own context; the cron runs on `Asia/Dhaka`) is genuine whitespace with low competition.
- **Trust as a feature** — we already have Google Search grounding + per-turn transcripts.
  Show sources/citations per claim: "the AI news you can verify" — hard for opaque
  incumbents to copy.
- **B2B / white-label (largest under-contested gap)** — the engine (topic → grounded brief
  → two-host script → TTS → distributable feed) is reusable. Sell "daily AI audio briefings"
  to publishers, brands, and internal-comms teams. Real budgets, far less competition,
  turns a cost center into per-seat revenue.

---

## 5. Is it sellable?

**The consumer-generic framing is the weak business; the underlying product is genuinely
sellable** — aimed at buyers who have budget and an unmet need, not at competing with free
Google in the open consumer market.

| Path | Who buys | Why they pay | Rough model |
|---|---|---|---|
| **B2B / white-label** | Publishers, brands, fintech/biotech, internal comms | Want a daily branded audio brief; can't build it | $500–5k/mo per client, or per-seat |
| **Niche vertical** | Professionals (traders, doctors, devs, lawyers) | Generic apps can't go deep; pay for depth + trust | $15–30/mo, low churn |
| **Regional / language** | Underserved markets (e.g. Bangla / South Asia) | Nobody serves them well | Ads + low-price premium, high volume |

---

## 6. How to sell it

### Three principles
1. **Sell the outcome, not the app** — "a daily 7-minute audio brief on *my* world, done
   for me," not "an AI podcast generator."
2. **Pre-sell before building** — a verbal LOI from 3 buyers beats 1,000 downloads.
3. **Deliver concierge-first** — the admin "Generate pod" button is already a production
   line. Generate manually, hand-deliver a private feed/link. No app-store or billing infra
   needed to make the first $1k.

### Sharpest cold-start wedge: "Newsletter → daily podcast"
Hundreds of thousands of newsletter writers (Substack, beehiiv, Ghost) already have a
paying audience and want an audio version but won't record daily. The engine does exactly
this. Why it wins:
- Buyers are identifiable and reachable (public email/socials).
- Proven willingness to pay (creators buy growth tools).
- They bring the distribution → zero CAC.
- B2B supplier, not consumer competitor → sidesteps Google/Spotify.

_(A specific industry or region/language angle beats this if one exists.)_

### First two weeks
1. Pick **one niche** of newsletters; list 30 with a real audience.
2. Generate **one free sample episode** from 5 targets' last issues via the admin panel.
3. Personalized outreach: _"I turned your last issue into a 6-minute podcast — here's the
   link. I can auto-produce one for every issue. Want it?"_
4. First 3 who say yes → onboard manually, deliver via a private RSS feed (publishable to
   Spotify/Apple) or a daily link. **Charge now.**
5. Only after 3 paying → automate the repeatable parts (their RSS in → pipeline → feed out).

### Pricing — anchor on replacement cost, not COGS
- Creators / newsletters: **$99–299/mo** per feed.
- Companies (internal brief, IR, brand): **$500–2,000/mo**.
- Avoid "$9 consumer" — the margin trap.

### Existing assets that are sales assets
- **Admin "Generate pod"** → concierge production line (no new code to land a customer).
- **Search grounding + transcripts** → the trust pitch (verifiable, with sources).
- **The consumer app** → keep as the demo + future funnel, not the first thing sold.

---

## 7. Open product bets that support the GTM

- **Bring-your-RSS → auto-podcast feed**: ingest a feed, generate, expose a podcast RSS.
  Small addition on top of the existing engine; unlocks the newsletter wedge.
- **Source/citation display** per claim → the trust differentiator.
- **Engagement-gated generation** + caching → fix unit economics before scaling.
- **Billing** (only once a paying motion is validated) — likely B2B invoicing first, not
  consumer IAP.

---

## 8. This-week action

Generate 5 sample episodes from 5 target newsletters and send 5 personalized DMs.
Zero new engineering; the market answers "is it sellable" in days.
