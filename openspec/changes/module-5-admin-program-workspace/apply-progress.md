# Apply Progress: module-5-admin-program-workspace

## Mode

Standard

## Workload Boundary

- Mode: stacked PR slice
- Current work unit: PR 3 / Work Unit 3 — Admin program workflows + protected applications + rollout updates
- Chain strategy: stacked-to-main
- Start state: PR 2 persistence foundation already completed on top of the auth/session slice
- End state: admin program actions/editor/overview, protected application routes, and rollout updates completed

## Completed Tasks

### Previously completed
- [x] 1.1 Create `src/lib/admin-session.ts` for signed cookies, allowed-email checks, safe `next` parsing, and `requireAdminSession()`.
- [x] 1.2 Create `src/app/api/admin/auth/google/route.ts` and `src/app/api/admin/auth/google/callback/route.ts`; add logout handling for the admin session.
- [x] 1.3 Update `src/proxy.ts`, `src/app/[locale]/admin/layout.tsx`, `src/app/[locale]/admin/login/page.tsx`, and `src/components/layout/admin-shell.tsx` to enforce localized admin login and signed-in state.

### Completed in this slice
- [x] 2.1 Create `src/models/program.ts` and extend `src/types/program.ts` with `workflowState`, `draftSnapshot`, `publishedSnapshot`, and first-publish metadata.
- [x] 2.2 Refactor `src/validators/program.ts` into snapshot/admin validators with publish-required field checks and post-publish slug immutability.
- [x] 2.3 Replace mock-only `src/services/programs/program-repository.ts` with Mongo editorial CRUD; keep `src/services/programs/program-source.ts` only for seed/bootstrap input.
- [x] 2.4 Update `src/services/programs/program-service.ts` so public reads resolve only `publishedSnapshot` and archived/unpublished routes return `null`.
- [x] 3.1 Add server actions under `src/app/[locale]/admin/programs/` for save draft, publish, archive, and reactivate with revalidation and status redirects.
- [x] 3.2 Rework `src/features/programs/components/admin-program-form-shell.tsx` into a persisted editor that keeps edits inside `/admin/programs` and preserves one pending draft.
- [x] 3.3 Update `src/features/programs/components/admin-programs-overview.tsx`, `src/app/[locale]/admin/programs/page.tsx`, `new/page.tsx`, and `[id]/edit/page.tsx` for persisted rows, archived badges, empty state, and action entry points.
- [x] 3.4 Guard `src/app/[locale]/admin/applications/**`, including `[id]/actions.ts` and curriculum routes, with the shared admin session checks.
- [x] 4.1 Update `messages/es.json` and env/setup docs with admin auth labels, publish/archive states, callback origin, allowed email, and session secret requirements.

## Files Changed

- `src/models/program.ts` — added the Mongo program model and snapshot schemas
- `src/types/program.ts` — added editorial record, snapshot, workflow, and mutation contract types
- `src/validators/program.ts` — split structural snapshot parsing from publish validation and slug immutability checks
- `src/services/programs/program-repository.ts` — replaced the mock repository with Mongo bootstrap/read/write editorial persistence
- `src/services/programs/program-service.ts` — resolved admin reads from draft snapshots and public reads from published snapshots only
- `src/features/programs/components/admin-programs-overview.tsx` — added archived status styling for the expanded workflow state union
- `src/app/[locale]/admin/programs/actions.ts` — added guarded save/publish/archive/reactivate server actions with path revalidation and status redirects
- `src/features/programs/components/admin-program-form-shell.tsx` — replaced preview-only panels with the persisted program editor and workflow controls
- `src/app/[locale]/admin/programs/page.tsx` — added direct create entry point in the workspace header
- `src/app/[locale]/admin/programs/new/page.tsx` — surfaced create-flow status feedback inside the persisted editor
- `src/app/[locale]/admin/programs/[id]/edit/page.tsx` — loaded the protected editor state and surfaced workflow feedback
- `src/app/[locale]/admin/applications/page.tsx` — rechecked the admin session before rendering the applications overview
- `src/app/[locale]/admin/applications/[id]/actions.ts` — protected status mutations with the shared admin session guard
- `src/app/[locale]/admin/applications/[id]/page.tsx` — rechecked the admin session before rendering application details
- `src/app/[locale]/admin/applications/[id]/curriculum/route.ts` — redirected anonymous curriculum downloads into the localized admin login flow
- `src/app/[locale]/admin/login/page.tsx` — moved runtime login copy into `messages/es.json`
- `src/components/layout/admin-shell.tsx` — aligned runtime admin session labels with the real Google auth flow
- `messages/es.json` — updated Spanish-only runtime copy for admin auth, publish/archive states, and the persisted program workflow
- `README.md` — documented callback origin, allowed email, session secret, and related admin environment requirements

## Verification

- ✅ `./node_modules/.bin/tsc --noEmit`
- ✅ `./node_modules/.bin/eslint .`
- ℹ️ `pnpm` was not available in the shell, so equivalent local binaries were used instead of `pnpm exec tsc --noEmit` and `pnpm lint`
- ℹ️ Automated test coverage is unavailable in this repo because no test runner or coverage tool is configured in `openspec/config.yaml`.

### Remediation note — 2026-07-08 verify refresh

- Fixed the current runtime parser failure by normalizing legacy `programs` collection documents that still use the pre-Module-5 flat shape (`slug`, `title`, `description`, `active`, etc.) instead of the editorial `draftSnapshot` / `publishedSnapshot` contract.
- Added repository-side legacy mapping plus one-time bootstrap/index reconciliation so public and authenticated admin overview routes stop crashing when older records are present.
- Targeted post-fix runtime checks now pass for `GET /es`, `GET /es/programs`, `GET /es/admin` with a valid signed admin session cookie, and `GET /es/admin/programs` with the same cookie.
- `GET /es/programs/community-learning-volunteer` still returns `404` in the current local dataset because the collection currently contains only normalized legacy records and not the expected seeded Module 5 sample slug; verify should re-check whether that route is expected to exist in the target environment.

### Remediation note — 2026-07-09 verify refresh

- Fixed the partial-seed bootstrap gap in `src/services/programs/program-repository.ts` so missing `program-source.ts` entries are restored with idempotent collection upserts instead of a best-effort bulk insert that could leave gaps hidden behind existing data.
- Mirrored the legacy top-level program fields (`title`, `slug`, `description`, `active`, etc.) onto bootstrap seed inserts because the current Atlas `programs` collection still enforces the pre-Module-5 JSON schema validator for new documents.
- Re-ran the local Next dev server, re-hit the public programs catalog/detail routes, and confirmed the bootstrap restored all four seed entries into the partial dataset without breaking the normalized legacy records.
- `GET /es/programs/community-learning-volunteer` now returns `200`, and the local `programs` collection now contains six records total: the two normalized legacy published entries plus the four Module 5 seed/bootstrap entries.

### Remediation note — 2026-07-09 create-flow compatibility refresh

- Fixed the remaining non-bootstrap create-path validator failure by adding the same legacy compatibility fields to normal repository writes and by declaring those fields on `src/models/program.ts`, so Mongoose no longer strips them before Atlas validation.
- Re-verified the real create flow with a new record (`verify-create-1783645208842` / `6a50441b13c596e2dabf998b`): create succeeded as `draft`, save kept the record off the public route, publish exposed it publicly, archive hid it again, and reactivate returned it to `draft` while public reads stayed `null`.
- Re-confirmed the public published-read routes still answer correctly in the live app: `GET /es/programs -> 200` and `GET /es/programs/community-learning-volunteer -> 200`.

### Remediation note — 2026-07-10 focused roadmap step 2 batch

- Split repository maintenance from seed backfill in `src/services/programs/program-repository.ts` so admin reads no longer auto-create seed programs during normal overview access.
- Kept public catalog assumptions explicit by running seed backfill only on public program reads (`listPublicPrograms()` and slug-based public lookup), which preserves the seeded public catalog contract without making the admin empty state unreachable.
- Reviewed `/[locale]/admin/programs/[id]/edit` again and confirmed the route still returns `notFound()` when `getAdminProgramById(id)` resolves `null`, including invalid Mongo ObjectId inputs that the repository already short-circuits.
- Extracted the Google callback account-acceptance decision into a small helper so wrong-email and unverified-email denial stays behaviorally identical but easier to reason about and verify deterministically later.

### Remediation note — 2026-07-17 Mongo fast-fail follow-up

- Tightened `src/lib/mongoose.ts` to set `serverSelectionTimeoutMS` to `2000` by default, with an opt-in `MONGODB_SERVER_SELECTION_TIMEOUT_MS` override, so broken Mongo connectivity/config no longer holds public web requests for the Mongoose 30s default.
- Kept the existing behavior split intact: public program reads still degrade to empty/null through `src/services/programs/program-service.ts`, while admin/backend paths still surface the original connection/config error because they do not catch it.
- Planned verification for this follow-up is a focused runtime probe against `/es` with an unreachable local Mongo endpoint plus the existing lint/typecheck checks.

### Manual verification notes

- ✅ Anonymous `/es/admin`, `/es/admin/programs/new`, `/es/admin/applications`, `/es/admin/applications/fake-id`, and `/es/admin/applications/fake-id/curriculum` requests all redirected into the localized login flow with the expected `next` value preserved.
- ✅ Hitting `/api/admin/auth/google?next=%2Fes%2Fadmin%2Fapplications` now leaves the app for Google Accounts, confirming the real OAuth initiation route is healthy in the current environment.
- ⚠️ Wrong-email / unverified-email rejection could not be exercised end-to-end because the local Google OAuth credentials are not fully usable in this environment.
- ✅ Draft-vs-live behavior, archive public 404, and draft reactivation were re-proved directly against Atlas through the service/runtime layer in this focused pass, even though a full browser click-through was not repeated.

## Deviations

- None so far — implementation stays inside the planned PR 3 boundary.

## Issues / Follow-ups

- Remaining verify warnings are now limited to Google callback rejection proof plus the empty-overview and unknown-id scenarios.

## Remaining Tasks

- None inside this PR slice for the create-flow blocker. Optional follow-up: close the remaining verify warnings by proving wrong-email / unverified-email callback rejection plus the empty-overview and unknown-id scenarios.

## Status

14/14 tasks complete. Focused verify-remediation blocker is fixed, and the report now has real create/save/publish/archive/reactivate evidence; remaining gaps are warning-level scenario coverage only.
