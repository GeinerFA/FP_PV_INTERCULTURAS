# Tasks: Admin Program Form Spacing

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 30-110 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Add validator-aligned required markers on top of the completed spacing pass and finish verification | PR 1 | Single PR; keep validator, shell, messages, and verification together |

## Phase 1: Completed Spacing Baseline

- [x] 1.1 Update `src/features/programs/components/admin-program-form-shell.tsx` outer wrapper, feedback banner, intro card, and `<form>` stack spacing to create a calmer top-to-bottom rhythm.
- [x] 1.2 Loosen localized presentation, operational details, cover-image, requirements, included, SEO, workflow, editorial-meta, and boundaries spacing in `src/features/programs/components/admin-program-form-shell.tsx` without reordering fields.
- [x] 1.3 Re-check `src/features/admin/components/admin-workspace-section.tsx` and keep the spacing refinement shell-local because shared section hooks were not needed.

## Phase 2: Required Marker Refinement

- [x] 2.1 Export a narrow publish-required field contract from `src/validators/program.ts` that mirrors `validateProgramSnapshotForPublish` for user-entered fields only.
- [x] 2.2 Update `src/features/programs/components/admin-program-form-shell.tsx` to render `* Obligatorio` on publish-required labels and add compact legend/help copy without changing field order or workflow actions.
- [x] 2.3 Add the `AdminProgramForm` required-marker strings in `messages/es.json`, and keep category, featured, audit metadata, and other draft-valid/defaulted controls unmarked.

## Phase 3: Verification

- [x] 3.1 Run `pnpm lint` and `pnpm exec tsc --noEmit` after the validator, shell, and translation updates.
- [x] 3.2 Manually review `/[locale]/admin/programs/new` to confirm the vertical spacing remains improved and only publish-required public fields show `* Obligatorio`.
- [x] 3.3 Manually review `/[locale]/admin/programs/{id}/edit` to confirm prefilled content keeps the same spacing rhythm, markers stay truthful, and save/publish/archive/reactivate actions behave the same.
- [x] 3.4 Smoke-test draft save plus publish validation to confirm marker coverage matches real publish requirements while route, persistence, and non-visual messaging behavior stay unchanged.
