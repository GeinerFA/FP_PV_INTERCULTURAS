# Proposal: Module 1 Public Home

## Intent

Deliver the first reviewable public MVP slice on top of Module 0 localized routing: a Spanish-first home centered on organization story, history, offerings, and clear visitor actions.

## Scope

### In Scope
- Replace the localized home placeholder with a dedicated landing experience.
- Strengthen the shared public shell for intentional navigation/footer behavior.
- Add home sections for organization info, history, offerings, one flexible info block, featured programs, CTAs, and a contact anchor.
- Add a localized FAQs page.
- Keep the active public MVP Spanish-only while preserving the existing locale-aware architecture for later cleanup.

### Out of Scope
- Admin, auth, persistence, CMS, application workflow, or contact backend.
- About/Apply rebuilds beyond inheriting the improved shell.

## Capabilities

### New Capabilities
- `public-home`: Localized landing page with institutional content, history, offerings, featured programs, CTAs, and contact.
- `public-faqs`: Localized FAQ page linked from home.
- `public-site-shell`: Shared localized public header/footer/navigation, including contact jump behavior.

### Modified Capabilities
- None.

## Approach

Use a dedicated home feature instead of expanding the generic placeholder template. Reuse current `next-intl` routing and existing read-only program services. Keep Spanish as the active public language and remove live unsupported-locale compatibility from the runtime surface.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/[locale]/(public)/page.tsx` | Modified | Home entry replaces placeholder. |
| `src/components/layout/public-site-shell.tsx` | Modified | Public nav/footer refinement. |
| `src/features/public/components/` | New/Modified | Dedicated home sections. |
| `src/app/[locale]/(public)/faq*` | New | Localized FAQ route. |
| `src/services/programs/program-service.ts` | Modified (optional) | Read-only featured helper. |
| `messages/es.json` | Modified | Home/shell/FAQ content. |
| `src/config/site.ts` | Modified | FAQ/contact navigation behavior. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Active change artifacts can drift from the Spanish-only product contract | Medium | Keep proposal, design, tasks, and specs aligned with the runtime and seeded-content cleanup. |
| Home scope expands into future marketing needs | Medium | Limit work to agreed Module 1 sections. |
| Routing/nav regressions affect public flow | Low | Preserve locale patterns and change only public links. |

## Rollback Plan

Revert home to `PublicPageTemplate`, remove FAQ and contact-jump navigation changes, and restore prior shell/site config only if the public MVP needs to roll back to its earlier shape.

## Dependencies

- Module 0 localized routing and `next-intl` messages.
- Existing published-program data/service for previews.

## Success Criteria

- [ ] `/[locale]` shows story, history, offerings, flexible info, featured programs, CTAs, and contact.
- [ ] Visitors can reach programs, apply, FAQs, and contact clearly from the public flow.
- [ ] FAQs live on a localized page; contact remains a home jump target.
- [ ] No admin/auth/persistence scope is added; featured content stays read-only.
