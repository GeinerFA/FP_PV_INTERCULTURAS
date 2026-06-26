# Tasks: Module 2 Application Flow

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 700-1000 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 foundation/persistence → PR 2 public intake → PR 3 admin operations |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Add Atlas + application domain foundation | PR 1 | `package.json`, `src/lib/mongoose.ts`, `src/{types,validators,models,services}/applications/*`; include lint/typecheck for the new domain |
| 2 | Deliver public `/apply` submit + `/apply/success` | PR 2 | Depends on PR 1; `src/app/[locale]/(public)/apply/*`, `src/features/applications/components/public-*`, `messages/es.json`; include manual submit/failure checks |
| 3 | Deliver admin inbox/detail/status flow | PR 3 | Depends on PR 2; `src/app/[locale]/admin/applications/*`, `src/features/applications/components/admin-*`, `messages/es.json`; include list/detail/status/not-found checks |

## Phase 1: Foundation

- [x] 1.1 Update `package.json` and create `src/lib/mongoose.ts` for cached `mongoose` connection and `MONGODB_URI` guard.
- [x] 1.2 Create `src/types/application.ts` and update `src/types/index.ts` with the baseline record, one `applicationType`, and allowed statuses.
- [x] 1.3 Create `src/validators/application.ts` for submission/status parsing and `src/models/application.ts` for the `applications` schema and list index.
- [x] 1.4 Create `src/services/applications/application-repository.ts` and `application-service.ts` for create/list/find/update-status mapping and history append rules.

## Phase 2: Public Intake Slice

- [x] 2.1 Create `src/app/[locale]/(public)/apply/actions.ts` and `src/features/applications/components/public-application-form.tsx` using `useActionState` for validation, errors, and pending submit.
- [x] 2.2 Replace `src/app/[locale]/(public)/apply/page.tsx` with the real form composition and localized metadata.
- [x] 2.3 Create `src/features/applications/components/public-application-success.tsx` and update `src/app/[locale]/(public)/apply/success/page.tsx` to gate on the success cookie.
- [x] 2.4 Update `messages/es.json` with Spanish-only apply labels, validation copy, recovery errors, and success messaging.

## Phase 3: Admin Operations Slice

- [x] 3.1 Create `src/features/applications/components/admin-applications-overview.tsx` and update `src/app/[locale]/admin/applications/page.tsx` for list and empty-state rendering.
- [x] 3.2 Create `src/features/applications/components/admin-application-detail.tsx` and update `src/app/[locale]/admin/applications/[id]/page.tsx` to load the record and `notFound()` on misses.
- [x] 3.3 Create `src/app/[locale]/admin/applications/[id]/actions.ts` for status updates, service validation, history append, and list/detail revalidation.
- [x] 3.4 Extend `messages/es.json` with admin summary labels, status labels, empty state, not-found handling, and status-change feedback.

## Phase 4: Verification

- [x] 4.1 Run `pnpm lint` and `pnpm exec tsc --noEmit`; fix any application-flow regressions before review.
- [x] 4.2 Run `pnpm build` and manually verify `/apply` success/failure flows against Atlas-backed env plus `/apply/success` direct-access gating.
- [x] 4.3 Manually verify admin list, empty state, detail, status changes, and unknown-id behavior at `/admin/applications`.
