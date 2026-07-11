# Proposal: Admin Program Form Spacing

## Intent

Refine the Spanish-first admin program create/edit workspace so the existing vertical form feels calmer and easier to scan, without changing routing, validation, persistence, or business rules.

## Scope

### In Scope
- Increase vertical spacing rhythm inside the program form shell.
- Clarify grouping hierarchy between helper copy, field clusters, and section cards.
- Keep create and edit routes visually consistent as one stacked workflow.

### Out of Scope
- Save, publish, draft, or program-data behavior changes.
- Navigation, locale flow, or unrelated admin screen redesign.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `admin-program-operations`: refine the `/[locale]/admin/programs/new` and `/[locale]/admin/programs/{id}/edit` presentation so the form remains a vertical list with roomier spacing and clearer grouping.

## Approach

Use a targeted spacing pass in `admin-program-form-shell.tsx`: widen the outer stack, loosen dense field groups, and apply roomier section content spacing only where the current form feels compressed. Touch shared section or global admin-inner styles only if local overrides become repetitive.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/programs/components/admin-program-form-shell.tsx` | Modified | Main spacing and grouping refinement |
| `src/features/admin/components/admin-workspace-section.tsx` | Modified (optional) | Shared spacing hook only if needed |
| `src/app/globals.css` | Modified (optional) | Shared admin spacing token/utility only if needed |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Extra whitespace makes the form feel longer | Medium | Increase spacing selectively around dense groups |
| Mixed density feels inconsistent | Low | Review the whole shell in one pass on both routes |

## Rollback Plan

Revert the form-shell spacing adjustments and any optional shared spacing helpers to restore the previous compact layout.

## Dependencies

- Existing `admin-program-operations` behavior remains the source of truth.

## Success Criteria

- [ ] Create and edit screens remain a vertical list workflow.
- [ ] Form sections and inputs feel less cramped and easier to scan.
- [ ] No business logic, persistence messaging, or routing behavior changes.
