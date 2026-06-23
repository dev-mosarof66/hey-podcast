# Hey Podcast — Landing page

A self-contained B2B marketing page (`index.html`) that sells the "branded daily
AI podcast" offering from [`docs/market-and-gtm.md`](../docs/market-and-gtm.md).
No build step — it's one HTML file using the Tailwind CDN.

## Preview locally

Just open it:

```bash
# any of these
start landing/index.html              # Windows
npx serve landing                     # serves at http://localhost:3000
python -m http.server -d landing 8080 # http://localhost:8080
```

## Deploy (pick one — all free)

- **Vercel:** `cd landing && npx vercel --prod` (or drag the folder into vercel.com).
- **Netlify:** drag the `landing` folder onto app.netlify.com/drop.
- **GitHub Pages / Cloudflare Pages:** point it at this folder.

Use a separate project/domain from the admin panel (e.g. `heypodcast.app` for
marketing, the admin stays on its own Vercel project).

## Before you send it to prospects — customize

1. **Contact email** — replace every `hello@heypodcast.app` with your real address
   (the two CTA buttons + footer use `mailto:` so the form works with zero backend).
   Optionally swap for a Calendly/Tally/Typeform link.
2. **Pricing** — the tiers ($99 / $499 / Custom) come straight from the GTM doc;
   adjust to taste.
3. **Proof** — once you have a sample/first client, add a real episode embed or a
   logo/quote to the trust strip.

## Going further (later)

The Tailwind CDN is perfect for a fast launch but isn't ideal long-term (no purge,
slight flash). When it's converting, port it into a small Next.js/Astro site for
real SEO, an embedded sample player, and a proper lead form that posts to the
server. The copy and structure here transfer directly.
