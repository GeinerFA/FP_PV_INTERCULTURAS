# Proposal: Module 3 Public Layout Refresh

## Intent

Align the change with the implementation that already shipped: Module 3 About, Impact, and Privacy now combine a lighter editorial layout refresh with page-local localized content/message-contract reshaping, while keeping the same localized routes and informational purpose.

## Scope

### In Scope
- Refresh `about`, `impact`, and `privacy` layouts inside the existing public shell.
- Keep the new page-local `messages/es.json` structures required by the current About/Impact/Privacy components.
- Preserve static localized content, server-rendered informational behavior, and the valid Privacy commitments accent.

### Out of Scope
- CTA, conversion, forms, analytics, or new interactive behavior.
- Public-shell redesign, route ownership changes, or rollout beyond Module 3 pages.
- CMS/data persistence work or broader localization model redesign outside these three pages.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `public-page-presentation`: expand the contract from presentation-only refresh to a Module 3 page refresh that also permits page-specific localized content/message-contract reshaping for About, Impact, and Privacy.

## Approach

Treat the current implementation as the approved direction: keep the existing page components and localized message sections (`history`, `mission`, `methodology`, `story`, `testimonials`, `gallery`, `principles`, `intro`, `sections`, `commitments`), and refresh the spec/design follow-up so they describe that narrower-but-real contract truthfully.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/public/components/public-about-page.tsx` | Modified | Editorial About layout driven by nested localized sections. |
| `src/features/public/components/public-impact-page.tsx` | Modified | Editorial Impact layout with testimonial, gallery, and principles sections. |
| `src/features/public/components/public-privacy-page.tsx` | Modified | Reading-first Privacy layout with valid commitments accent. |
| `messages/es.json` | Modified | Page-specific localized content/message contracts for About, Impact, and Privacy. |
| `openspec/changes/module-3-public-layout-refresh/specs/public-page-presentation/spec.md` | To refresh | Must match the approved scope expansion. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope drifts beyond Module 3 pages | Medium | Keep all contract changes limited to About/Impact/Privacy only. |
| Content reshaping is mistaken for broader product expansion | Medium | State clearly that behavior stays informational and page-local. |
| No automated visual regression coverage | Medium | Verify with lint, typecheck, build, and manual route review. |

## Rollback Plan

Revert the three page components and `messages/es.json` page sections to the previous approved contract if the expanded scope is rejected, leaving routes and the shared shell untouched.

## Dependencies

- Existing `next-intl` localized routing and the current implemented Module 3 page/message structures.

## Success Criteria

- [ ] `/[locale]/about`, `/[locale]/impact`, and `/[locale]/privacy` keep the current editorial layouts and render successfully.
- [ ] The approved change explicitly includes the existing About/Impact/Privacy localized message-contract reshaping.
- [ ] No CTA/conversion behavior or broader public-shell redesign is introduced.
- [ ] The next specs refresh can verify this change without pretending it is still presentation-only.
