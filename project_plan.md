# Baby photo generator — project plan

A website that generates baby photos and short videos from two parent photos. Core differentiator: resemblance / age / skin-tone controls rather than one-shot generation like most competitors. Monetization via credit packs.

## Rough timeline

Assuming one developer working part-time (~12 hrs/week): **7–9 weeks to public launch**. Full-time: 3–4 weeks. The gating risk on timeline is Phase 5 (legal + safety) — everything before it can be rushed, that phase cannot.

## Stack

- Frontend / API: Next.js 15 on Vercel
- Auth: Clerk, with session auto-resume (no visible sign-in button on landing)
- DB: Postgres on Neon
- Storage: Cloudflare R2 — two buckets (`uploads-ephemeral` with 24h lifecycle rule, `outputs-permanent`)
- Queue: Inngest (managed, has retries + observability for free)
- Payments: Stripe (credit-pack model, not subscription)
- Image gen: InstantID + InsightFace on Replicate
- Video gen: Kling 2.x API, with Runway Gen-4 as fallback
- Moderation: Hive Moderation API or a hosted NSFW classifier on Replicate
- Analytics: PostHog

Everything serverless. No VMs, no Kubernetes, no Redis to manage.

## Pricing

Two tiers plus one-click top-ups. No subscription.

- Starter: $5 → 10 photos, no watermark
- Family (most popular): $15 → 30 photos + 5 videos
- Top-up: $5 → 10 more photos (offered inline when balance hits 0)

Video costs 3 photo credits if the user is on Starter and runs out of video credits — one credit pool keeps logic simple.

---

## Phase 0 — Foundation

Goal: accounts, hosting, and the skeleton of a production app.

- Buy domain. Cloudflare for DNS + R2
- Accounts: Vercel, Neon, Clerk, Stripe, Inngest, Replicate, PostHog
- Create R2 buckets. Set lifecycle rule on uploads bucket (delete after 24h — verify this actually fires)
- Scaffold Next.js with Tailwind + shadcn/ui
- DB schema: `users`, `generations`, `credit_transactions`, `upload_references`
- Wire Clerk auth — configure so sessions auto-resume from cookie without showing a sign-in button
- Deploy hello-world; confirm CI and preview deploys work

Done when: you can sign up via the upload flow, log in via a returning cookie, and see your credit balance on a deployed URL.

## Phase 1 — MVP generation

Goal: end-to-end pipeline with hardcoded defaults. Ugly UI is fine.

- Landing page with no sign-in button: just the "Try it free" CTA
- Upload screen: two file inputs with thumbnails, consent checkbox ("I have the right to use these photos")
- Account creation happens implicitly on first upload — user enters email to claim results, not to "sign up"
- `POST /api/uploads/sign` → returns 2 signed PUT URLs for R2
- `POST /api/generations` → creates DB row, enqueues Inngest job, returns `generation_id`
- Inngest worker pipeline:
  - Download both photos from R2
  - Face detection + count check (reject if no face or >1 face per photo)
  - Age classifier — reject if either subject looks under 18
  - ArcFace embedding extraction
  - Hardcoded 50/50 linear blend
  - Call InstantID on Replicate with fixed prompt: "studio portrait of a 6-month-old baby, soft lighting, neutral background"
  - Store output in R2 outputs bucket, update DB
- Result page polls `GET /api/generations/:id` every 2s
- Delete upload keys from R2 as soon as the worker finishes (not on a schedule — immediately)

Done when: upload two adult photos, get a baby photo back in 30–60 seconds, without ever clicking a "sign in" button.

## Phase 2 — Sliders and controls

Goal: the feature that makes this worth paying for.

- Customization panel UI: resemblance slider (bounded 20–80), age pills (5 buckets: newborn, 6mo, 1yr, 3yr, 5yr), skin tone slider (±2 steps)
- Extend job payload: `{mom_key, dad_key, resemblance_weight, age_bucket, skin_tone_offset}`
- Worker updates:
  - Embedding blend uses `resemblance_weight`: `blend = (1-w) * mom + w * dad`
  - Age bucket → one of 5 hand-written prompt templates (don't try to dynamically template; write all five)
  - Skin tone offset injected as mild prompt modifier
- Cache face detection + embeddings per upload. Second generation from same uploads should skip the expensive steps and only re-run diffusion
- "Variations" grid: sample resemblance at 30/50/70 in one click, show 3 outputs
- "Regenerate" button: same uploads, new settings, new generation
- Credit cost is labeled inline on every action button ("Regenerate · 1 credit")

Done when: moving any slider visibly changes output, and the variations grid is noticeably faster than a cold start.

## Phase 3 — Payments

Goal: money comes in.

- Two Stripe Products: Starter ($5 / 10 credits), Family ($15 / 30 credits + 5 video credits), plus a Top-up ($5 / 10 credits) triggered from the in-app out-of-credits prompt
- Webhook on `checkout.session.completed` → add credits, insert `credit_transactions` row (idempotent on session ID)
- Worker credit guard: check balance before generation starts, decrement on success, refund on failure
- Failure refund on every rejection path (no face, multiple faces, age gate, NSFW trigger, provider error) — users lose trust fast if they get charged for a model refusal
- Watermark step: free output (the 1 free credit on signup) gets a visible bottom-right mark via `sharp`; paid outputs don't
- Account page: balance, transaction history, top-up CTA. Accessible via a small avatar menu inside `/generate` — not from the landing page
- Out-of-credits state inside the app: inline "Add 10 more for $5" button rather than redirecting to a pricing page

Done when: you can buy credits, spend them, see balance update. Manually re-fire a webhook and verify no double-credit. Run out of credits and confirm the top-up flow works without leaving the app.

## Phase 4 — Video

Goal: shareable short clips.

- Video is paid-only, never free tier (cost floor is too high, and video misuse is worse than image misuse)
- Worker video step: after image stored, if `want_video`, call Kling image-to-video with motion prompt ("baby looks at camera and smiles softly, gentle movement")
- Fallback to Runway Gen-4 on Kling failure. Log which provider served
- Result page: image appears immediately; video appears as second state after ~60–120s
- Store mp4 in R2 outputs
- Share buttons: direct download, X, Instagram, TikTok. Pre-fill caption with site URL
- Add site branding in the corner of all videos (not a watermark for gating, but for attribution) — shareable content should carry your logo. This is also your free marketing channel.

Done when: one click produces a 3–5s clip of the baby photo moving, end-to-end within 2 minutes.

## Phase 5 — Safety, legal, launch prep

Goal: be ready for real users without getting sued.

- NSFW classifier on every output. Auto-reject, refund, offer regeneration
- C2PA metadata on every output (provenance signal — cheap to add, increasingly expected)
- Consent modal copy (have a lawyer review this specifically): "I confirm I have permission to use both photos. Photos are deleted within 24 hours. Outputs are AI-generated entertainment, not a prediction of a real child."
- Terms of Service + Privacy Policy. Start from a template (e.g., Termly, iubenda), get a lawyer to review — budget $500–1,500. Be specific about photo retention and that you don't train on user data
- Layered minor-protection:
  - Client-side: consent checkbox specifically asks about adult subjects
  - Server-side: age classifier rejects probable minors in either photo
  - Manual review queue for flagged items
- Rate limits: per-IP upload cap, per-account generation rate cap (prevents automated abuse)
- Report button on every output → moderator queue. Someone needs to actually monitor this
- PostHog dashboards: upload rate, generation success rate, refund rate, report rate. Alert on anomalies
- Hostile user review: walk the full flow as if you were trying to misuse the site. Every attack vector needs a response

Done when: you've done the hostile walkthrough and fixed everything it surfaced.

## Phase 6 — Launch

Goal: people use it.

- Landing page final polish:
  - One clear before/after example (synthetic or self-generated — never real users), real examples not placeholders
  - Two-tier pricing visible on the landing page (no separate pricing route)
  - No sign-in button. Returning users auto-resume via Clerk session cookie, or reach the app via purchase receipt email link
- Basic SEO: title tags, meta description, Open Graph card
- Seed a Reddit / X / TikTok account with sample outputs. TikTok is the highest-leverage channel for this category
- Skip paid ads until you have a working organic funnel. Meta ads in this space have brutal CAC before you've tuned the conversion page
- Soft launch to friends: fix the 10 things that break in the first 24h
- Public launch: Product Hunt + TikTok organic. Prepare moderation capacity for the spike

---

## Risks and unknowns

- Model deprecation: InstantID is a community model — if it's delisted, you need a backup in place. Keep PhotoMaker + Nano Banana 2 warm as alternates.
- Policy tightening: Replicate has been tightening identity-preserving model policy. Have a plan B provider before you need it.
- Viral misuse: one screenshot of someone generating a tasteless output can end the brand. Moderation has to be ready at launch, not added after the first crisis.
- Video unit economics: margin on videos is thin. Family at $15 with 5 videos means ~$2.50–4 of video cost per sale; watch Kling pricing monthly.
- Category competition: at least 15 sites already do this. The slider UX plus output quality is your wedge — it has to be obvious in the first 10 seconds of the landing page, or bounce rate will kill you.
- Two-tier pricing risk: without a third "big" tier, you're capping revenue per user at $15. The top-up flow is the pressure valve — if top-up conversion is low (under 15% of Starter buyers), you have a margin problem and should revisit tier structure.

## Launch checklist

- Privacy policy + ToS reviewed by a lawyer
- Uploads bucket lifecycle rule actually deleting files (verify manually)
- Stripe webhook idempotent (re-fire a webhook, check for double-credit)
- Refund tested on every failure path
- NSFW classifier tested on adversarial inputs
- Age gate tested on edge cases (teenagers, ambiguous photos)
- Free-tier watermark actually visible in all output formats
- Load tested to ~100 concurrent generations
- Report button works and someone actually sees reports
- Support email with a response SLA
- Session auto-resume tested (returning users don't see a sign-in page)
- Top-up flow tested end-to-end (out-of-credits → $5 top-up → next generation works)
- Analytics funnel: landing → upload → pay → top-up → repeat visit

## Success metrics (first 60 days)

- Landing → upload conversion: target 8–15%
- Upload → first paid conversion: target 3–6%
- Starter → top-up conversion: target 15%+ (this is the lever for revenue per user given the capped $15 ceiling)
- Repeat generation rate (same user, same session): target > 40% (this is what the slider UX is for — if it's under 20%, the slider isn't adding perceived value)
- Video attach rate (of paid users): target 25%+
- Refund rate on failed generations: should be <5% once the pipeline stabilizes
- Report rate on outputs: should be <0.5%. Higher = you have a moderation problem

---

## First week concrete list

Rather than "start Phase 0," the actual first week of work looks like:

1. Buy domain, set up Cloudflare
2. Create all accounts (Vercel, Neon, Clerk, Stripe, Replicate, Inngest, PostHog)
3. `npx create-next-app` with Tailwind + shadcn, push to GitHub, deploy to Vercel
4. Add Clerk, configure so sessions auto-resume and no sign-in button is required on the landing
5. Set up Neon DB, write the three tables, verify Drizzle/Prisma can read them
6. Create R2 buckets with lifecycle rules, test an upload via signed URL from a local script
7. Run InstantID on Replicate manually with two test photos — confirm the output and the latency before you commit to the architecture around it
