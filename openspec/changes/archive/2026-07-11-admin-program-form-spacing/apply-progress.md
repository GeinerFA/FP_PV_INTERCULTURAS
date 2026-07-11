# Apply Progress: admin-program-form-spacing

## Mode

Standard

## Workload Boundary

- Mode: single PR
- Current work unit: Unit 1 — local shell spacing refinement plus publish-required markers
- Chain strategy: pending
- Start state: the admin program create/edit form already used the correct vertical flow, but it still needed truthful publish-required markers backed by the validator contract
- End state: the shell spacing pass, validator-backed marker UI, manual visual acceptance, and publish-alignment smoke test are all complete without application-code changes

## Completed Tasks

### Completed in this batch
- [x] 1.1 Update `src/features/programs/components/admin-program-form-shell.tsx` outer wrapper, feedback banner, intro card, and `<form>` stack spacing to create a calmer top-to-bottom rhythm.
- [x] 1.2 Adjust localized presentation and operational-details blocks in `src/features/programs/components/admin-program-form-shell.tsx` by loosening locale card padding, inner field gaps, and dense control spacing without reordering fields.
- [x] 1.3 Refine cover-image, requirements, included, SEO, workflow, editorial-meta, and boundaries sections in `src/features/programs/components/admin-program-form-shell.tsx` so helper copy, previews, actions, and audit metadata have clearer separation.
- [x] 2.1 Re-check `src/features/admin/components/admin-workspace-section.tsx` during implementation and only add shared spacing hooks there if repeated shell overrides prove necessary; otherwise keep the change shell-local.
- [x] 2.2 Avoid changes to actions, translations, routes, or persistence wiring in `src/app/[locale]/admin/programs/actions` and related program services while applying the spacing pass.
- [x] 2.3 Export a validator-backed publish-required field contract from `src/validators/program.ts` for user-entered fields only.
- [x] 2.4 Annotate only publish-required labels in `src/features/programs/components/admin-program-form-shell.tsx` with `* Obligatorio` and add compact legend/help copy while preserving field order, routes, and workflow actions.
- [x] 2.5 Add the required-marker strings in `messages/es.json` and keep category, featured, audit metadata, status, and internal ID unmarked.
- [x] 3.1 Run `pnpm lint` and `pnpm exec tsc --noEmit` to confirm the validator export, required-marker UI, and translation updates compile cleanly.
- [x] 3.2 Accept the create-route visual result using the user's manual confirmation that `/[locale]/admin/programs/new` looks correct after the required-marker refinement.
- [x] 3.3 Accept the edit-route visual result using the user's manual confirmation that `/[locale]/admin/programs/{id}/edit` looks correct, while preserving the existing workflow controls and route behavior.
- [x] 3.4 Smoke-test authenticated draft save plus publish failure on missing publish-required fields to confirm marker coverage still matches real publish validation without changing route or persistence behavior.

## Files Changed

- `src/features/programs/components/admin-program-form-shell.tsx` — increased shell-local spacing, padding, and grouping rhythm across intro, localized cards, operational fields, media, workflow, metadata, and boundaries while preserving field order and behavior
- `src/validators/program.ts` — exported the publish-required UI contract so the form shell can mirror publish validation without hardcoding an unrelated list
- `src/features/programs/components/admin-program-form-shell.tsx` — added validator-backed `* Obligatorio` badges plus compact legend/help copy while keeping non-required controls unmarked and the spacing pass intact
- `messages/es.json` — added Spanish copy for the required-marker badge, legend, and help text
- `openspec/changes/admin-program-form-spacing/tasks.md` — marked completed apply and static-verification tasks
- `openspec/changes/admin-program-form-spacing/apply-progress.md` — recorded cumulative apply progress for this change

## Verification

- ✅ `pnpm lint`
- ✅ `pnpm exec tsc --noEmit`
- ✅ User manually reviewed the create route and confirmed the result is correct (`"PERFECTO"`), which closes task 3.2 for `/[locale]/admin/programs/new`.
- ✅ User manually reviewed the edit route and confirmed the result is correct (`"PERFECTO"`), which closes the visual acceptance portion of task 3.3 for `/[locale]/admin/programs/{id}/edit`.
- ✅ Authenticated HTTP smoke test on the live Next admin routes proved draft save still succeeds with a unique slug and blank publish-required fields, while publish redirects back with `status=publish-failed` and unchanged failure messaging.
- ✅ The same smoke test re-confirmed that required markers stay visible on the publish-required fields, while category and featured remain unmarked.

## Deviations

- None — implementation stays shell-local as designed, and `src/features/admin/components/admin-workspace-section.tsx` did not need shared overrides.

## Issues / Follow-ups

- A pre-existing repository constraint prevents creating multiple draft-only programs with a blank slug because `src/models/program.ts` keeps a unique index on `draftSnapshot.slug`; the smoke test used a unique slug and confirmed the current change does not alter that behavior.

## Remaining Tasks

- None.

## Status

13/13 tracked tasks complete across the spacing baseline and required-marker follow-up. The change is ready for `sdd-verify`.
