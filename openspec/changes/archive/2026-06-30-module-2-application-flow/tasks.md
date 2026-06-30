# Tasks: Module 2 Application Flow

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 120-220 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR: optional-message + admin-shell home control + verification refresh |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Finish the two missing accepted behaviors | Single PR | `src/app/[locale]/(public)/apply/*`, `src/components/layout/admin-shell.tsx`, `src/app/[locale]/admin/applications/*`, `src/{types,validators,services}/applications/*`, `messages/es.json`; keep curriculum handling unchanged |
| 2 | Refresh runtime proof for the shipped slice | Same PR | Re-run static checks plus manual Atlas-backed verification for submit, admin review, curriculum download, and shared shell home navigation |

## Phase 1: Foundation

- [x] 1.1 Update `package.json` and create `src/lib/mongoose.ts` for cached `mongoose` connection and `MONGODB_URI` guard.
- [x] 1.2 Create `src/types/application.ts` and update `src/types/index.ts` with the baseline record, one `applicationType`, and allowed statuses.
- [x] 1.3 Create `src/validators/application.ts` for submission/status parsing and `src/models/application.ts` for the `applications` schema and list index.
- [x] 1.4 Create `src/services/applications/application-repository.ts` and `application-service.ts` for create/list/find/update-status mapping and history append rules.

## Phase 2: Public Intake Slice

- [x] 2.1 Create `src/app/[locale]/(public)/apply/actions.ts` and `src/features/applications/components/public-application-form.tsx` using `useActionState` for validation, errors, and pending submit.
- [x] 2.2 Replace `src/app/[locale]/(public)/apply/page.tsx` with the real form composition and localized metadata.
- [x] 2.3 Create `src/features/applications/components/public-application-success.tsx` and update `src/app/[locale]/(public)/apply/success/page.tsx` to gate on the success cookie.
- [x] 2.4 Update `src/features/applications/public-application-form-contract.ts`, `src/app/[locale]/(public)/apply/actions.ts`, `src/validators/application.ts`, `src/types/application.ts`, and `src/services/applications/application-service.ts` so blank or omitted `message` is accepted and normalized to `null` without changing curriculum rules.
- [x] 2.5 Update `messages/es.json` and public form guidance so `message/comment` is explicitly optional and required-field copy stays accurate.

## Phase 3: Admin Operations Slice

- [x] 3.1 Create `src/features/applications/components/admin-applications-overview.tsx` and update `src/app/[locale]/admin/applications/page.tsx` for list and empty-state rendering.
- [x] 3.2 Create `src/features/applications/components/admin-application-detail.tsx` and update `src/app/[locale]/admin/applications/[id]/page.tsx` to load the record and `notFound()` on misses.
- [x] 3.3 Create `src/app/[locale]/admin/applications/[id]/actions.ts` for status updates, service validation, history append, and list/detail revalidation.
- [x] 3.4 Update `src/components/layout/admin-shell.tsx` to render one top-left house-icon `Link` to `/${locale}` for every admin page without changing `siteConfig.adminNavigation`.
- [x] 3.5 Remove the applications-only home CTA from `src/app/[locale]/admin/applications/page.tsx` and `src/app/[locale]/admin/applications/[id]/page.tsx`, then align `messages/es.json` with the shared shell control copy.

## Phase 4: Verification

- [x] 4.1 Run `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`; static checks already pass on the current slice.
- [x] 4.2 Re-run `/es/apply` manual checks for submit with message, submit without message, invalid curriculum rejection, and `/es/apply/success` cookie gating.
- [x] 4.3 Re-run Atlas-backed persistence checks for compatible create, blank-message acceptance, legacy-read normalization, and status-history append/reject rules.
- [x] 4.4 Re-run `/es/admin`, `/es/admin/applications`, and `/es/admin/applications/[id]` manual checks for the shared top-left house-icon home control, empty/non-empty inbox, detail with curriculum metadata, curriculum download, status change visibility, and unknown-id 404s.
