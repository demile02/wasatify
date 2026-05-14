# WASATIFY Agent Instructions

## Project
WASATIFY is a Next.js + Supabase microlearning web app for Islam Wasathiyah education.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react
- Supabase Auth, PostgreSQL, Storage
- Vercel deployment

## Commands
- Dev: npm run dev
- Lint: npm run lint
- Build: npm run build

## Design Rules
- Use emerald green, mint, cream, white, and gold accents.
- Use Poppins via next/font/google.
- Use rounded cards, subtle shadows, spacious layout.
- Use reusable components before creating page-specific UI.
- Keep UI responsive.
- Desktop app uses sidebar.
- Student mobile uses bottom navigation.

## Engineering Rules
- Use TypeScript strictly.
- Do not hardcode secrets.
- Use Supabase client only with public anon key on client.
- Server-only operations must stay in server files/actions.
- Prefer typed props and small components.
- Keep business logic in lib or server actions where appropriate.
- Avoid huge files. Split components if page exceeds roughly 250 lines.

## Data Rules
- Use Supabase tables from supabase/schema.sql.
- Use RLS policies from supabase/rls.sql.
- Use seed data only for development/demo.
- Prefer real Supabase queries over hardcoded UI data after auth/schema exist.

## Done Definition
A task is done only if:
- npm run lint passes
- npm run build passes
- UI is responsive
- Loading and empty states exist where needed
- No console errors
- No exposed secrets