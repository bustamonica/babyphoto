# babyphoto

Generate baby photos and short videos from two parent photos. Scaffold for the build described in [`project_plan.md`](./project_plan.md).

This repo is currently at **Phase 0** — production skeleton only. No upload pipeline, no generation, no payments, no video.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbustamonica%2Fbabyphoto&env=DATABASE_URL,NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,CLERK_WEBHOOK_SECRET&envDescription=Phase%200%20requires%20a%20Neon%20DATABASE_URL%20and%20three%20Clerk%20keys.%20Use%20any%20non-empty%20placeholder%20for%20CLERK_WEBHOOK_SECRET%20until%20Phase%201.&project-name=babyphoto&repository-name=babyphoto)

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind + shadcn/ui
- Clerk for auth (session auto-resume, no sign-in button on landing)
- Drizzle ORM + Neon serverless Postgres
- GitHub Actions CI

## Local setup

```bash
pnpm install
cp .env.example .env.local
# paste real values for the Phase 0 keys (DATABASE_URL + all CLERK_*)
pnpm db:push          # pushes schema to Neon
pnpm dev
```

Open http://localhost:3000.

### Required env for Phase 0

- `DATABASE_URL` — Neon connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — Clerk
- `CLERK_WEBHOOK_SECRET` — Clerk webhook signing secret (svix)

Everything else in `.env.example` is for later phases.

### Clerk webhook (local dev)

The `/api/webhooks/clerk` route handles `user.created` and grants the signup bonus credit. To test locally:

1. Run `pnpm dev` and expose it via `ngrok http 3000`.
2. In Clerk Dashboard → Webhooks, add an endpoint at `https://<ngrok>/api/webhooks/clerk` subscribed to `user.created`. Copy the signing secret into `CLERK_WEBHOOK_SECRET`.

## Manual prerequisites (not code)

These must be done outside the repo before the app fully works:

- [ ] Domain purchased, DNS on Cloudflare
- [ ] Accounts created: Vercel, Neon, Clerk, Stripe, Inngest, Replicate, PostHog
- [ ] Vercel project linked to this repo, env vars pasted into Vercel
- [ ] R2 buckets `uploads-ephemeral` (24h lifecycle rule) and `outputs-permanent` created
- [ ] Clerk webhook endpoint configured in production
- [ ] Stripe Products + Prices created (Starter $5 / Family $15 / Top-up $5)

## Verification (Phase 0 done-when)

1. `pnpm typecheck && pnpm build` passes locally and in CI.
2. With real credentials: `pnpm dev` → visit `/` → signed-out users are redirected to Clerk sign-up; signed-in users see the app directly.
3. Complete sign-up → land back on `/` showing `1 credit`.
4. Close browser, reopen, visit `/` → session cookie auto-resumes, no sign-in prompt.
5. `curl localhost:3000/api/health` returns `{ ok: true, db: true }`.

## Next phases

See `project_plan.md`. Phase 1 adds the R2 → Inngest → Replicate pipeline; phases 2–6 layer sliders, payments, video, safety, and launch polish on top.
