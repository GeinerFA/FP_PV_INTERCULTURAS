# Proposal: Module 4 Admin Experience

## Intent
Deliver the first trustworthy admin slice: replace placeholder-heavy entry points with a real workspace landing and a stronger programs management overview, without implying full CRUD persistence or auth hardening already exist.

## Scope

### In Scope
- Refine the shared admin shell so admin pages feel intentional, consistent, and operational.
- Turn `/[locale]/admin` into a real dashboard using existing application and program summaries.
- Strengthen `/[locale]/admin/programs` as a real management overview over existing catalog data.
- Keep create/edit program routes visible but explicitly non-persistent.

### Out of Scope
- Program create/edit persistence, validation workflows, or repository writes.
- Admin auth, authorization, or session hardening.
- Full redesign of every placeholder admin route.

## Capabilities

### New Capabilities
- `admin-program-operations`: Define the admin dashboard and program-overview experience using existing real data, including honest non-persistent create/edit boundaries.

### Modified Capabilities
- `admin-application-operations`: Expand the shared admin workspace contract so existing application pages stay consistent inside the refined shell and navigation model.

## Approach
Use the exploration recommendation: refine the workspace shell, ship a real dashboard, and make programs the first credible management surface. Borrow public-page hierarchy and spacing, but keep dark admin surfaces, dense scanning, and explicit actions.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/layout/admin-shell.tsx` | Modified | Shared admin workspace structure and visual rhythm |
| `src/app/[locale]/admin/page.tsx` | Modified | Real dashboard landing |
| `src/features/programs/components/admin-programs-overview.tsx` | Modified | Stronger management overview from existing data |
| `src/features/admin/components/admin-page-template.tsx` | Modified | Reduce generic placeholder treatment |
| `src/app/[locale]/admin/programs/*` | Modified | Honest framing for list/create/edit routes |
| `messages/es.json` | Modified | Copy no longer implies pure placeholder states |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope drifts into full CRUD | Med | Keep non-persistent boundary explicit in specs |
| Visual polish hurts scan speed | Low | Favor admin density and contrast over decorative cards |
| Shell changes affect applications flow | Med | Treat existing applications routes as compatibility baseline |

## Rollback Plan
Revert the admin shell, dashboard, and programs overview together, restoring the current placeholder-driven admin pages while keeping locale-aware routing and existing applications behavior unchanged.

## Dependencies
- Existing Next.js localized admin routing and current program/application service data.

## Success Criteria
- [ ] `/[locale]/admin` is a real admin landing page instead of a placeholder.
- [ ] `/[locale]/admin/programs` feels operational with existing real catalog data.
- [ ] Reviewers can confirm create/edit remain clearly non-persistent.
- [ ] Existing applications admin flow still works inside the refined shared shell.

## Proposal question round
- Should dashboard summaries prioritize program health, application workload, or both equally?
- Does the first slice need quick filters or status grouping on programs, or only a stronger overview?
- Should create/edit pages say preview, coming soon, or draft workspace?
