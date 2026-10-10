# FrontCanvas

Restaurant websites worth walking into.

FrontCanvas is a small design studio that rebuilds restaurant websites so the first thing a hungry
stranger sees does the kitchen justice. We design the concept first and show it to the restaurant
before any money changes hands.

**[frontcanvas.com](https://frontcanvas.com)**

## What this repository is

The public website: marketing pages, pricing, the concept viewer that restaurants land on from our
outreach, and the checkout that turns a concept into a real project.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Neon Postgres
- Clerk for sign-in (email code only — no passwords)
- Stripe for payments
- Cloudflare R2 for image storage
- Deployed on Vercel

## Running locally

```bash
npm install
npm run dev
```

Environment variables are documented in `.env.example`. Copy it to `.env.local` and fill in your own
credentials.

```bash
npm run build    # production build
npm run migrate  # apply the database schema
```

## About this repository

This is the public face of FrontCanvas. Development happens in a private
repository; this one is kept in sync automatically and carries only what we
intend to publish.

## Contact

[contact@frontcanvas.com](mailto:contact@frontcanvas.com)

3120 Oak Valley Dr, Ann Arbor, MI 48103
