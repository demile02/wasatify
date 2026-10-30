# WASATIFY Agent Instructions

## Project

WASATIFY is a microlearning app for Islam Wasathiyah education, with student, teacher, and admin access. Its tagline is **Wasathiyah Smart Learning for Youth**.

Read `README.md` for setup and `docs/audit-2026-10-29.md` for the latest audit evidence and limitations. Confirm current behavior in source before relying on an old audit or chat summary.

## Stack and Commands

- Next.js 16 App Router, TypeScript, React 18. Check `package.json` and the lockfile for exact versions.
- Tailwind CSS, shadcn/ui, lucide-react, Poppins via `next/font/google`.
- Supabase Auth, PostgreSQL, and Storage; Vercel deployment.
- Install: `npm ci`.
- Dev: `npm run dev`; local port used during recent work: `npm run dev -- --port 3100`.
- Lint: `npm run lint`.
- Build: `npm run build`.
- Regression tests: `node --test tests/audit-regression.test.mjs`.
- Production preview: `npm run build`, then `npm run start -- --port 3100`.

React 18 support is deprecated by Next.js 16. Do not assume async `useTransition` behavior from React 19. Use `src/hooks/use-async-action.ts` for pending mutations and duplicate-click prevention; transitions remain suitable for navigation.

## Project Map

- `src/app`: routes, server pages, layouts, route handlers, loading/error boundaries.
- `src/components`: shared, student, teacher, auth, admin, and media interfaces.
- `src/lib/student`, `src/lib/teacher`: domain queries and server actions.
- `src/lib/auth`, `src/lib/supabase`, `proxy.ts`: authentication, clients, and cookie refresh.
- `src/lib/media`: crop configuration and media helpers.
- `supabase/migrations`: versioned database changes, including learning and editor RPCs.
- `tests`: pure-code regressions and rollback-only database regression scripts.
- `db/feedback.json`: local developer comments; ignored by Git.

## Design Rules

- Preserve emerald, mint, cream, white, gold accents, rounded cards, and spacious layout.
- Reuse shared components before creating page-specific variants. Keep body and learning content readable.
- Every listed feature must complete its user flow from the shared interface to a saved result and a clear success/error state. Keep the same role's production and demo layouts aligned through shared components; demo actions may use isolated browser storage where they must not write real records.
- Keep pages within the same role visually consistent: shared page headers, cards, form spacing, responsive widths, and navigation. Test the actual interaction and visible result, not just whether the route renders.
- Reflection access follows the learning sequence: finish every lesson first, then pass the published quiz if the module has one. Show the next unmet step and link to it in both production and demo; lesson progress alone does not mean the quiz is passed.
- Treat requirements from direct chat and developer comments as equally binding. When a request applies to all pages, roles, or demos, search for every affected route and shared component, then fix the common source. Do not wait for the user to annotate each occurrence.
- Demo workspaces must reuse the production role shell and page components. Demo fixtures and safe demo actions may differ, but the layout and core interactions should not become a separate lookalike app.
- For the Islam Wasathiyah demo, use grade X MA as the confirmed audience. Do not label its sample classes as SMP or assume the material applies to SMA without confirmation.
- Keep the current page label in the shared student/teacher header on desktop and mobile, with account identity in the profile menu and class/school context on desktop. Apply the same route labels to production and demo shells. Let global search fill the remaining desktop width without a max-width gap; avoid duplicating it in page content.
- Do not display PageHeader eyebrow, title, or description inside page content. Keep its title as a screen-reader heading, remove descriptions from the rendered UI, and retain any action buttons. Put essential error/empty explanations in visible state components such as EmptyState. Standalone pages without a role shell may show their page title in their own top header.
- Match the role-shell top inset to its horizontal inset at each breakpoint. A quiet PageHeader (screen-reader title only, no actions) must not leave its old title margin above content; apply this across student, teacher, and demo pages.
- Keep the student dashboard focused on continuing learning; do not show announcement previews there. Keep the announcement page and navigation available. Limit student activity/recommendation and teacher class/activity/announcement dashboard previews to three items, with a destination link for each full list. Avoid stretching a short card to a neighboring section's height when it creates large empty areas.
- Keep Sertifikat out of the student sidebar and mobile quick-access choices; the existing route remains available directly.
- Apply preview limits only to summary surfaces: teacher dashboard class/activity/announcement previews max 3, student dashboard activity/recommendations max 3, student badge preview max 4, teacher class-detail student/module previews max 5, chart rankings max 6 or 8 as the chart defines, and header notifications max 16. Keep counts in the shared data/view component so production and demo cannot drift.
- Full-list pages must not silently reuse dashboard preview limits. For growing datasets, filter the complete authorized result set and paginate the visible rows; the teacher roster uses 20 students per page. Keep pagination totals/ranges and disabled boundary controls accurate. Exports and aggregates must use the full authorized dataset, not only the visible page.
- Keep lesson body text and key points dark enough to read. In quiz review, keep correct answers green and the student's incorrect choice red in both collapsed and expanded states. Show below-KKM scores in red.
- Desktop app uses a sidebar. Mobile navigation follows the existing student/teacher shell; do not add duplicate navigation.
- Preserve explicit home/return actions such as “Beranda” when simplifying navigation or page content.
- Check phone layouts and desktop 1280×720 when responsive verification is requested. Inspect the actual viewport, overflow, spacing, dialog margins, tap targets, and long text.
- Keep lesson content and media within their parent cards at every breakpoint; long text and intrinsic image widths must not create horizontal overflow.
- Preserve the single-original-image model. Store crop coordinates for desktop hero, mobile hero, and thumbnail; render actual selected pixels without stretching. The saved crop must match its preview for module covers, thumbnails, and profile photos. Use a 4:3 desktop hero, 16:9 mobile hero, and 1:1 thumbnail where those variants are shown. Uploaded images use the existing WebP conversion pipeline.
- Paginate long quiz question lists in the editor and review/results views. Make page size and the displayed question range clear, and keep paging controls usable on mobile.
- Form completion indicators must reflect validated required values. Numeric inputs may be temporarily empty while edited; do not coerce an in-progress empty field to zero before validation or save.
- Use one coherent loading state per region. Include meaningful empty/error states; do not show demo content when a configured database request fails.
- Keep feedback buttons clear of bottom navigation and other floating actions.

## Engineering Rules

- Use strict TypeScript, typed props, and small reusable components. Keep domain logic in `lib` or server actions; split large components when practical (roughly 250 lines is a review signal).
- Never hardcode or print credentials. Client Supabase code uses only the public anon key. Service-role operations and secrets stay on the server.
- Use `src/lib/browser-storage.ts` for best-effort storage access. Scope personal drafts by user ID. Storage failure must not prevent navigation after a successful server save.
- Preserve cookie propagation through both normal responses and redirects in `proxy.ts`. Protected layouts/actions enforce roles; do not rely on UI tabs or client guards for authorization.
- Keep confirmation, onboarding, and password-recovery routes reachable during authentication flows. Email and Google registration must reach clear confirmation/onboarding states with a resend path.
- Preserve the approved password-reset states: identify an unregistered email with the typo/Spam-folder guidance, and scope resend throttling to the requesting IP so one user's cooldown does not block other users.
- Auth redirects must follow an explicitly trusted origin. For tunnel/domain changes, check `src/lib/site.ts`, callback trusted origins, `next.config.ts`, and Supabase redirect settings together. A phone's localhost is not the development server.
- Bound feed queries; aggregate counts in SQL where possible. Use stable ordering and `readAllRows` for complete report datasets that can exceed the REST row limit. Do not fetch full report datasets for header notifications.

## Database Invariants

- Read `supabase/schema.sql`, `supabase/rls.sql`, and relevant migrations. The schema/RLS files alone do not represent the complete deployed database.
- Use versioned migrations for DDL/RLS/RPC changes. Check remote migration history before applying; do not rewrite already-applied migrations to imply the database changed.
- Student learning writes go through `complete_learning_lesson`, `submit_learning_quiz`, `submit_learning_reflection`, and `claim_learning_achievements`. Do not reintroduce direct writes to scores, XP, streaks, progress, or earned achievements from student clients/actions.
- Preserve transaction boundaries, student locks, attempt idempotency, attempt limits, prerequisite checks, and server-side grading. SECURITY DEFINER routines must validate identity, role, and module access and must not be executable by anon.
- Quiz question points normalize to a maximum total of 100. Existing valid integer weights totaling 100 remain unchanged. The current editor supports 1–100 multiple-choice questions with options A–E.
- A raw progress value of 100 does not independently prove completion. Use explicit completion state and required lesson/quiz conditions.
- New quiz attempts preserve question snapshots. Historical review must use the saved snapshot when available, with fallback only for older attempts without one.
- Teacher save/duplicate uses `save_teacher_module` atomically. Preserve existing lesson/question IDs on edits and crop/duration metadata on copies. Test reorder conflicts and rollback when verification is requested.
- Student module access follows the student's class teacher and published modules. Keep UI queries, RLS, and RPC checks consistent.
- Seed data is for development/demo only. Do not reset, reseed, or bulk-modify real user learning records to make a test pass.

## Developer Feedback Workflow

When the user says “cek komen” or asks to work on comments:

1. Read this project's `db/feedback.json` or development `GET /api/feedback`; select `status: "open"`.
2. Use the comment, selector, page URL, and viewport to locate the problem. Inspect surrounding code and behavior instead of implementing the wording blindly.
3. Check `AGENTS.md` and earlier direct instructions in the current task for existing project-wide decisions. Search all affected routes and role/demo variants; implement the correction in the shared component when possible instead of only fixing the selected element.
4. Check both mobile and desktop when the change affects shared layout and verification is requested.
5. Mark the comment done only after addressing it, through `POST /api/feedback/<id>/done` or a targeted update preserving all other records. `/reopen` restores open status.

The widget, `/feedback`, and feedback APIs are development-only. Comments are stored on the server running WASATIFY, not in Supabase or another project's directory. Do not deploy this file-based queue as persistent Vercel storage.

## Verification and Delivery

- For implementation work when verification is requested, run lint, build, relevant regressions, and browser checks for affected flows. Report exactly what ran and what remains unverified.
- SQL regression scripts in `tests/` require matching fixture accounts and run inside transactions ending in `ROLLBACK`. Never change them to `COMMIT` or expose fixture credentials.
- For documentation-only work, check source accuracy, paths, commands, and the diff; do not claim new runtime verification.
- Confirm responsive behavior, loading/empty/error states, console output, and secret handling for the surfaces actually checked. Remove temporary test routes/assets before delivery.
- A browser viewport check does not establish physical-phone FPS; one EXPLAIN result does not establish production load capacity. Record measurements and limits in the audit notes.
- Do not commit or deploy unless requested. Keep user changes intact.

<!-- antislop:start -->
## antislop

For UI, copy, accessibility, responsive-layout, or code-comment work, read the antislop core and the relevant skill before making changes:
- Core: `/root/.agents/skills/antislop/SKILL.md`
- UI / visual: `/root/.agents/skills/antislop-ui/SKILL.md`
- Copy & text: `/root/.agents/skills/antislop-copywriting/SKILL.md`
- Accessibility / people: `/root/.agents/skills/antislop-human/SKILL.md`
- Mobile / responsive: `/root/.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `/root/.agents/skills/antislop-code/SKILL.md`

Use antislop in `during` mode when the user selects it; otherwise follow the saved global preference. If no preference exists or it says `ask`, ask whether to use antislop during or after the work before applying it. A session choice overrides the global preference. Announce the resolved mode and its source once before applying antislop. For UI work, follow the selected skill's workflow and delivery checks.
<!-- antislop:end -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
