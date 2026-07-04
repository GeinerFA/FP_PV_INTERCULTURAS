# Tasks: Module 4 Admin Experience

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 520-760 |
| Session review budget | 800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 shell parity → PR 2 dashboard/programs → PR 3 preview copy + verification |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Next apply slice: Work Unit 1 / PR 1

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Refine the shared admin workspace without breaking the shipped applications flow | PR 1 | **NEXT APPLY SLICE**; merge to main before PR 2 |
| 2 | Ship the real dashboard and stronger programs overview from existing services | PR 2 | Stacked after PR 1; includes the new dashboard component |
| 3 | Clarify preview-only program routes and finish verification | PR 3 | Stacked after PR 2; copy, preview boundary, and regression pass |

## Phase 1: Shared shell parity (Work Unit 1 / PR 1)

- [x] 1.1 Update `src/features/admin/components/admin-page-template.tsx` with `variant`, placeholder/workspace branching, and cleaner header framing for real admin pages.
- [x] 1.2 Refresh `src/components/layout/admin-shell.tsx` spacing, sidebar rhythm, and container polish while preserving the shared home control and navigation.
- [x] 1.3 Switch `src/app/[locale]/admin/applications/page.tsx` and `src/app/[locale]/admin/applications/[id]/page.tsx` to workspace-mode template usage and confirm the current applications flow still renders inside the shared shell.

## Phase 2: Dashboard and programs overview (Work Unit 2 / PR 2)

- [x] 2.1 Create `src/features/admin/components/admin-dashboard-overview.tsx` from `listApplications()` and `listAdminPrograms()` with honest summary cards and quick links.
- [x] 2.2 Replace placeholder dashboard content in `src/app/[locale]/admin/page.tsx` with the new overview inside workspace mode.
- [x] 2.3 Strengthen `src/features/programs/components/admin-programs-overview.tsx` with catalog metrics, denser row summaries, and explicit empty-state/create-entry messaging.
- [x] 2.4 Update `src/app/[locale]/admin/programs/page.tsx` to use workspace-mode framing around the stronger overview.

## Phase 3: Preview route honesty (Work Unit 3 / PR 3)

- [x] 3.1 Refine `src/features/programs/components/admin-program-form-shell.tsx` so create/edit states clearly say preview-only and do not imply save, publish, or auth-backed actions exist.
- [x] 3.2 Update `src/app/[locale]/admin/programs/new/page.tsx` and `src/app/[locale]/admin/programs/[id]/edit/page.tsx` to use workspace mode while preserving not-found behavior for unknown ids.
- [x] 3.3 Rewrite affected admin copy in `messages/es.json` for `AdminShell`, `AdminPages`, `AdminProgramsOverview`, and `AdminProgramForm` so real pages stop sounding like placeholders.

## Phase 4: Verification and cleanup

- [x] 4.1 Run `pnpm lint` and `pnpm exec tsc --noEmit`; this project has no automated test runner, so static checks are the required quality gate for these component and prop changes.
- [x] 4.2 Manually verify `/es/admin`, `/es/admin/programs`, `/es/admin/programs/new`, `/es/admin/programs/{id}/edit`, `/es/admin/applications`, and `/es/admin/applications/{id}` for real summaries, preview boundaries, and applications parity.
- [x] 4.3 Remove any stale placeholder sections or copy paths left unreachable after workspace-mode adoption.
