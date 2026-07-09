# Tasks: Module 5 Admin Program Workspace

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 780-1080 |
| Session review budget | 800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 auth/session → PR 2 program model/repository → PR 3 admin workflows + verification |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Land the admin auth boundary and redirect-back session flow | PR 1 | First slice from main; includes login, callback, proxy/layout guard, logout, lint/typecheck |
| 2 | Land persisted program record contracts and repository/service split | PR 2 | Starts after PR 1 merges to main; includes model, validators, repository, public/admin read rules |
| 3 | Land admin program actions, UI wiring, guarded applications, and verification | PR 3 | Starts after PR 2 merges to main; includes editor/actions, i18n/env docs, manual verification |

## Phase 1: Admin auth foundation
- [x] 1.1 Create `src/lib/admin-session.ts` for signed cookies, allowed-email checks, safe `next` parsing, and `requireAdminSession()`.
- [x] 1.2 Create `src/app/api/admin/auth/google/route.ts` and `src/app/api/admin/auth/google/callback/route.ts`; add logout handling for the admin session.
- [x] 1.3 Update `src/proxy.ts`, `src/app/[locale]/admin/layout.tsx`, `src/app/[locale]/admin/login/page.tsx`, and `src/components/layout/admin-shell.tsx` to enforce localized admin login and signed-in state.

## Phase 2: Program persistence foundation
- [x] 2.1 Create `src/models/program.ts` and extend `src/types/program.ts` with `workflowState`, `draftSnapshot`, `publishedSnapshot`, and first-publish metadata.
- [x] 2.2 Refactor `src/validators/program.ts` into snapshot/admin validators with publish-required field checks and post-publish slug immutability.
- [x] 2.3 Replace mock-only `src/services/programs/program-repository.ts` with Mongo editorial CRUD; keep `src/services/programs/program-source.ts` only for seed/bootstrap input.
- [x] 2.4 Update `src/services/programs/program-service.ts` so public reads resolve only `publishedSnapshot` and archived/unpublished routes return `null`.

## Phase 3: Admin program workflows
- [x] 3.1 Add server actions under `src/app/[locale]/admin/programs/` for save draft, publish, archive, and reactivate with revalidation and status redirects.
- [x] 3.2 Rework `src/features/programs/components/admin-program-form-shell.tsx` into a persisted editor that keeps edits inside `/admin/programs` and preserves one pending draft.
- [x] 3.3 Update `src/features/programs/components/admin-programs-overview.tsx`, `src/app/[locale]/admin/programs/page.tsx`, `new/page.tsx`, and `[id]/edit/page.tsx` for persisted rows, archived badges, empty state, and action entry points.
- [x] 3.4 Guard `src/app/[locale]/admin/applications/**`, including `[id]/actions.ts` and curriculum routes, with the shared admin session checks.

## Phase 4: Verification and rollout
- [x] 4.1 Update `messages/es.json` and env/setup docs with admin auth labels, publish/archive states, callback origin, allowed email, and session secret requirements.
- [x] 4.2 Run `pnpm lint` and `pnpm exec tsc --noEmit`; record that automated test coverage is unavailable in this repo.
- [x] 4.3 Manually verify login redirect-back, wrong/unverified email rejection, draft-vs-live behavior, archive public 404, draft reactivation, and protected application routes.
