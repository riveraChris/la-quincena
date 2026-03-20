# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

La Quincena is a family finance PWA that replaces a shared Excel spreadsheet. It organizes budgets by **quincenas** (Q1 = days 1-15, Q2 = days 16-end of month) — each quincena is an independent budget unit with its own income, expenses, and surplus. Two users (Christian and Aracelis) share a single family with real-time sync.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run check` — TypeScript type checking via svelte-check
- `npm run lint` — prettier + eslint
- `npm run format` — auto-format with prettier

## Tech Stack

- **SvelteKit** (Svelte 5 with runes mode enabled) + TypeScript
- **Supabase** (Auth, PostgreSQL, Realtime, Edge Functions)
- **Tailwind CSS v4** (via @tailwindcss/vite plugin)
- **PWA** with Web Push notifications (planned: vite-plugin-pwa)
- **Deploy target:** Vercel (adapter-auto)

## Architecture

### Svelte 5 Runes

This project uses Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`). Runes mode is enforced in `svelte.config.js` for all non-node_modules files. Do not use legacy Svelte reactive syntax (`$:`, `export let`).

### Route Structure (planned)

- `(auth)/` — login, register (unprotected)
- `(app)/` — main app shell with auth guard and bottom nav
  - `/` — Dashboard
  - `/quincena/[year]/[month]/[period]` — budget view for a specific quincena
  - `/deudas` — debt management
  - `/config` — settings

### Supabase Client

SSR-safe client goes in `src/lib/supabase.ts` using `@supabase/ssr`. Path alias `$lib` maps to `src/lib/`.

### Key Data Concepts

- **Quincena = budget unit.** The central organizing concept is the quincena, not the month.
- **Expense amounts are stored as negative** in the DB, displayed as positive in the UI.
- **Surplus (sobrante):** `sum(incomes) + sum(expenses) + sum(savings)` — expenses and savings are negative.
- **`our_minimum_payment`** on debts is the family's self-set minimum, never the bank's minimum.
- **Three expense/debt types:**
  1. `fixed` — recurring utilities/bills, no accumulated balance
  2. `operational_card` — dual tracking: period expense + historical carried balance
  3. `installment_no_interest` — large purchases with interest-free deadline and auto-recalculation of minimum payment
- **An `expense_item` can link to a `debt`** via nullable `debt_id`.

### Real-time Sync

Supabase Realtime subscriptions on `expense_items`, `debts`, and `budgets` tables — changes by one user appear instantly for the other.

## Environment Variables

```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...    # server/edge functions only
PRIVATE_VAPID_KEY=...            # server only
PUBLIC_VAPID_KEY=...
```

## Important Conventions

- Language: UI text and labels are in **Spanish**. Code (variables, comments, commits) in English.
- Always ask before making structural changes to the DB schema or data flow.
- The full data model and MVP spec are in `MVP.md` — consult it for schema details, screen specs, and business logic.
