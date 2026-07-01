# Proposal: Module 3 Public Content Pages

## Intent

Replace the localized placeholder public routes for `about`, `impact`, and `privacy` with real static content pages that explain the organization clearly without adding conversion-heavy behavior.

## Scope

### In Scope
- Deliver a real `/[locale]/about` page covering history, mission, and methodology.
- Deliver a real `/[locale]/impact` page centered on testimonials and photos.
- Deliver a basic informational `/[locale]/privacy` page for MVP data-use context.
- Keep the slice Spanish-first within the existing localized routing architecture.

### Out of Scope
- Program/admin flows, CMS, persistence, or application-form changes.
- Formal legal-policy drafting, consent logging, or new CTA funnels.
- Re-scoping to `admin/programs` or broader marketing redesign.

## Capabilities

### New Capabilities
- `public-about`: Localized institutional page for organization history, mission, and methodology.
- `public-impact`: Localized impact page for testimonial-led proof and photo storytelling.
- `public-privacy`: Localized basic privacy information page for MVP visitors.

### Modified Capabilities
- None.

## Approach

Keep the current locale-aware route entries and metadata pattern, but replace the generic placeholder experience with dedicated public-page implementations and translation content per route. Reuse shared public styling where helpful, keep pages static, and avoid CTA-first or legal/compliance overbuilding in this slice.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/[locale]/(public)/about/page.tsx` | Modified | Replace placeholder rendering with real About content. |
| `src/app/[locale]/(public)/impact/page.tsx` | Modified | Replace placeholder rendering with real Impact content. |
| `src/app/[locale]/(public)/privacy/page.tsx` | Modified | Replace placeholder rendering with basic Privacy content. |
| `src/features/public/components/` | New/Modified | Add dedicated page components or section composition. |
| `messages/es.json` | Modified | Add structured copy for the three public pages. |
| `src/lib/metadata.ts` | Modified (possible) | Extend only if richer per-page metadata needs support. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Testimonials/photos are not yet curated | Medium | Keep spec flexible on source format and allow static seeded content first. |
| Privacy scope drifts into legal-policy work | Medium | Lock the contract to basic informational content only. |
| Public-page spec naming drifts from unarchived Module 1 public work | Low | Treat these as new public-page capabilities and avoid assuming missing main public specs. |

## Rollback Plan

Restore the three routes to `PublicPageTemplate`, remove any dedicated page components/content keys added for this slice, and fall back to the current placeholder metadata/copy.

## Dependencies

- Existing Module 0 localized routing and `next-intl` message structure.
- Current public shell/navigation from earlier public MVP work.

## Success Criteria

- [ ] `/[locale]/about` presents history, mission, and methodology clearly.
- [ ] `/[locale]/impact` presents testimonials and photos without introducing conversion behavior.
- [ ] `/[locale]/privacy` explains basic privacy handling in simple MVP language.
- [ ] All three pages remain static and aligned with the current Spanish-first public architecture.
