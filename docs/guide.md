# Hey Podcast — Project Guide

> **Purpose of this file:** a single source of truth for any LLM or assistant working on this project. Read this first. It explains what the product is, the strategy behind it, the architecture, the tech stack, the prototype, the roadmap, and the economics.
>
> **Working name:** "Hey Podcast" — a *placeholder* for the prototype only. Not final. See [Naming status](#3-naming-status).

---

## 1. What it is

Hey Podcast is an AI-powered pocket app that **generates** short, listenable podcast episodes on demand and builds the user a personal feed of fresh episodes around the topics they follow.

One-sentence pitch:

> A pocket app that turns any topic you're curious about into a short two-host podcast episode on demand — and delivers a daily feed of fresh episodes on the topics you follow.

The defining behavior is **topic-first, not document-first**: the user types a curiosity (or follows a topic) and the app produces an episode with zero uploads. Two AI "hosts" hold a lively spoken conversation about it.

The product is a **generator + feed**, not a podcast *player*. It does not host or stream human-made shows; it creates new audio with AI.

---

## 2. The wedge & positioning

**The generation capability is commoditized.** Google NotebookLM does free two-host "Audio Overviews," and many tools (Nuton, Jalp, Recast) do variants. So the product cannot *be* "AI makes podcasts" — that's the engine, not the moat. It must win a specific wedge.

**Chosen wedge: the daily digest.** Each user follows topics and receives a fresh ~8-minute episode per day, plus on-demand generation. This is the most "app-like" (daily habit) and is the one this project is currently designed and costed around.

Other wedges considered (kept as future directions): a Bangla/Banglish audio wedge (underserved, founder has local-market fit) and a learning/exam-prep wedge.

**Key differentiator vs NotebookLM:** NotebookLM is document-first (upload sources). Hey Podcast is topic-first, on-demand, and feed-based — a daily habit rather than a tool you visit.

---

## 3. Naming status

- "Hey Podcast" is a **temporary working name** chosen to unblock prototype development. Trademark/branding deferred by decision.
- Known issues with the working name (to be resolved before launch): the word "podcast" is generic (very poor store discoverability, no trademark protection, mis-positions the app as a player rather than a generator).
- **Action item:** pick a final, distinctive, ownable name + a clear tagline ("AI podcasts on anything you're curious about") before public launch. The name should not need to contain the word "podcast."

---

## 4. How it works (the core loop)

Everything in the product is built around one pipeline:

```
topics in → fetch fresh content → write two-host script → synthesize voices → assemble MP3 → deliver / play
```

Generation is **asynchronous**: a request (user tap or daily cron) enqueues a job; a worker runs the pipeline; the finished episode lands on a CDN; the app streams it. Users never wait on a live request while generation runs.

---

## 5. Architecture (MVP)

Components and how they connect:

- **Client (React Native / Expo app):** follow topics, browse the feed, play episodes (background playback, lock-screen controls, scrub, speed). Uses expo-router for file-based routing and NativeWind for styling.
- **Backend + queue (Supabase + QStash):** accepts generation requests, stores users / topic-follows / episode metadata, and drops jobs on a queue.
- **Trigger:** a daily cron (the "digest" behavior) **and** an on-demand path ("generate this now"). The cron is gated so episodes are only generated for users likely to listen — a key cost control.
- **Generation worker (the 4-stage pipeline):**
  1. *Fetch content* — Gemini + Google Search grounding (or RSS) pulls fresh material.
  2. *Write script* — Gemini Flash turns the brief into a two-host dialogue (JSON).
  3. *Synthesize voices* — Kokoro renders multi-speaker audio (one voice per host).
  4. *Assemble* — ffmpeg stitches turns into one MP3.
- **Storage + CDN (Cloudflare R2):** stores MP3s and serves them; chosen for cheap/free egress (matters when episodes are replayed).

Design rule: keep generation behind the queue, cache aggressively (see cost levers), and generate-on-demand rather than blindly daily.

---

## 6. Tech stack (free-first)

The entire pipeline can be built and prototyped for $0. The stack defers cost until real traffic forces it.

| Layer | Tool | Notes |
|---|---|---|
| LLM (content + script) | **Google Gemini Flash** | Free tier ~1,500 requests/day, 15 RPM. Use Flash/Flash-Lite, **not** Pro (paid-only on free tier). |
| TTS (voices) | **Kokoro** (open-source) | Free, multi-speaker, runs on modest GPU/CPU. Premium alternative: ElevenLabs v3 for top quality (expensive). |
| Audio assembly | **ffmpeg** | Free; stitch + encode MP3. |
| Storage + delivery | **Cloudflare R2** | Free tier + free egress. |
| Backend / DB / auth | **Supabase** | Postgres, auth, storage. |
| Job queue | **Upstash QStash** / Cloudflare Queues | Decouple request from generation. |
| Mobile app | **React Native (Expo)** | One codebase (iOS/Android/web), expo-router + NativeWind, native audio player. |
| Prototype/dev compute | **Google Colab / Kaggle (free GPU)** | Where the Phase 0 notebook runs. |

What breaks "free" at scale: TTS compute (a 24/7 generation server needs a rented GPU or per-character API spend) and Gemini's daily request cap (fine for one dev, exceeded by real users → cheap-paid Flash).

---

## 7. The prototype (Phase 0)

A self-contained **Colab notebook** (`hey_podcast_prototype.ipynb`) that runs the full pipeline locally: topics in → MP3 out. It runs on Colab's free T4 GPU with a free Gemini key.

**Pipeline functions (the codebase shape):**

- `fetch_brief(topics)` — Gemini + Google Search → factual bullet brief.
- `write_script(brief, minutes)` — Gemini Flash → `{"title", "turns": [{"speaker": "A"/"B", "text"}]}` JSON. **This prompt is where episode quality lives.**
- `synth_turn(text, voice)` — Kokoro → numpy audio for one speaker turn.
- `stitch(segments)` / `export(audio, name)` — insert pauses, concatenate, write WAV, ffmpeg → MP3.
- `generate_episode(topics)` — orchestrates all of the above and returns the MP3 path.

**Config knobs (notebook cell 3):** `model`, `minutes`, host names, host voices (Kokoro: `af_heart`, `am_michael`, etc.), `lang_code` (`a`=US English, `b`=British), `sample_rate` (24000), `pause_ms`.

**Phase 0 gate (the only question that matters now):** *Would you actually want to listen to what this produces?* If yes, proceed. If it sounds flat, tune the script prompt and voices before building anything else. The two highest-leverage knobs are the script prompt and the voice pairing.

---

## 8. Roadmap: scratch → MVP

Five phases, each ending at a **gate** that must pass before the next is worth doing.

1. **Phase 0 — Prove the engine.** Local notebook: topics → MP3.
   *Gate:* would you personally listen to it?
2. **Phase 1 — Wrap as a service.** Endpoint enqueues a job; worker runs the pipeline; output to R2.
   *Gate:* fire a request, reliably get a playable episode URL.
3. **Phase 2 — Persistence + daily loop.** Supabase (auth, users, topic-follows, episodes) + daily scheduler.
   *Gate:* a test user's feed fills with relevant new episodes on schedule, no manual steps.
4. **Phase 3 — The pocket app.** React Native (Expo): onboarding (pick topics), feed, real audio player.
   *Gate:* someone who isn't you can install, pick topics, and listen with no explanation.
5. **Phase 4 — Gates + small beta.** Generation caps, hybrid caching, light analytics, paywall stub. Ship to 20–50 people.
   *Gate:* do people return on day 2 and day 7? (Retention is the real product question.)

Sequencing rule: build in this order. The app (Phase 3) is the cheapest part to get right; the engine quality (Phase 0) is the riskiest. Resist starting with the app.

---

## 9. Cost model (daily digest)

TTS dominates cost; LLM script is rounding error. The wedges differ mainly by episode length, voice quality needed, and cache reuse.

**Per 8-min episode (~7,000 TTS chars):**

| TTS tier | Per-episode cost |
|---|---|
| Budget (Google/Polly neural) | ~$0.06 |
| Mid (Cartesia/MiniMax) | ~$0.31 |
| Premium (ElevenLabs v3) | ~$0.81 |

**Per active user / month** (the big variable is generation policy, not unit price):

| Policy | Eff. episodes/mo | Mid-tier cost |
|---|---|---|
| Naive (daily for everyone) | 30 | ~$9.30 |
| Smart (on-demand / active users) | ~15 | ~$4.65 |
| Smart + hybrid caching (60% shared) | ~6 | ~$1.86 |

**Cost levers, by impact:**
1. Generate on-demand, not blindly daily (~50% saving).
2. Hybrid caching — share the general-news segment across all users; generate once (~60% on the remainder).
3. TTS tier choice (5–25× swing).
4. Shorter episodes (linear saving).
5. Cheap LLM for summarization.

**Pricing implication:** daily digest must be subscription from day one. At ~$9.99/mo (≈$6.99 net after store cut), the smart+hybrid mid-tier config (~$1.86/user) yields a healthy margin; naive+premium (~$24/user) is deeply unprofitable. **Viable config is essentially fixed: on-demand generation + hybrid caching + mid/budget TTS + paid subscription.**

Most-uncertain assumptions to stress-test: engagement rate (how many subscribers listen daily) and shared-content ratio (how much of a digest can be cached across users).

---

## 10. MVP definition

> A user opens the app, picks the topics they care about, and each day finds a fresh ~8-minute episode in their feed that they actually enjoy listening to.

That is the whole MVP. Post-MVP (do not build for the MVP): interactivity ("pause and ask the hosts"), voice customization, sharing/audiograms, Bangla wedge, source-grounding uploads.

---

## 11. Go-to-market / distribution note

Early installs are expected to come through the founder's **own channels** (professional audience, personal site, direct links), not organic store discovery. This matters: it softens the discoverability downside of a weak/working name, and it means the first retention test (Phase 4) can run with a hand-picked beta rather than paid acquisition. Target audience spans Bangladesh and global.

---

## 12. Key decisions & open questions

**Decided:**
- Wedge: daily digest.
- Build order: Phase 0 → MVP, gated.
- Free-first stack (Gemini Flash + Kokoro + ffmpeg + R2 + Supabase + React Native/Expo).
- Prototype runs on Colab free GPU.
- Working name "Hey Podcast" (temporary).

**Open:**
- Final product name + tagline (and trademark check).
- Whether budget TTS quality is acceptable for a digest (test vs mid-tier).
- Exact engagement and shared-content-ratio assumptions (drive the cost model).
- Subscription price and free-tier caps.

---

## 13. Conventions for assistants

- This is an early-stage, small-team build. Favor the cheapest viable path and validate before scaling.
- Protect the unit economics: any feature that increases per-user generation needs a caching or gating story.
- The script-generation prompt is the highest-leverage artifact for perceived quality — treat changes to it carefully.
- Keep the word "podcast" out of the final brand name; let the tagline do the explaining.
