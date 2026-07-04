## Exploration: module-1-public-home

### Current State
Module 0 already established localized public and admin routing with `next-intl`, but the public landing experience is still a placeholder. The localized home route at `src/app/[locale]/(public)/page.tsx` renders the generic `PublicPageTemplate`, which itself wraps a reusable `PageCard` with translation-driven eyebrow/title/description/highlights only. The shared public shell exists in `src/components/layout/public-site-shell.tsx` with localized navigation, locale switching, tagline, and footer, but it is still framed as an architectural base rather than a user-ready public experience.

The strongest existing public content is the seeded program catalog. `src/services/programs/program-source.ts` contains bilingual in-memory program data, `program-service.ts` already filters published programs and localizes them, and the public programs list/detail pages already consume that service. There is no CMS, database, or test runner yet.

### Affected Areas
- `src/app/[locale]/(public)/page.tsx` — current home route placeholder that should become the dedicated landing entry.
- `src/app/[locale]/(public)/layout.tsx` — public shell wrapper for the full localized public experience.
- `src/components/layout/public-site-shell.tsx` — shared header/footer/navigation shell that Module 1 should harden for real public use.
- `src/features/public/components/public-page-template.tsx` — currently drives most placeholder public pages; home likely needs to stop depending on this generic wrapper.
- `src/components/common/page-card.tsx` — reusable placeholder frame whose role should stay limited to secondary placeholder pages.
- `src/services/programs/program-service.ts` — existing public program data access that can power a home featured-programs section without new persistence.
- `src/services/programs/program-source.ts` — current seeded bilingual content source for featured programs and credibility content.
- `messages/en.json` and `messages/es.json` — primary content source for shell labels and page copy; Module 1 will need substantial new home/shell copy here.
- `src/config/site.ts` — current shared navigation/site identity config; likely small updates if shell wording or footer structure changes.
- `src/lib/metadata.ts` — existing metadata helper reused by the home page; may need richer home metadata inputs later but no structural blocker now.

### Approaches
1. **Dedicated Home Feature + keep generic template for secondary pages** — Create a real home/landing component for `/[locale]`, refine the shared public shell, and leave `PublicPageTemplate` as the lightweight placeholder pattern for the remaining public routes.
   - Pros: Clean separation between the flagship landing page and generic placeholder pages; keeps Module 1 focused; reuses existing program service and localized routing cleanly; lower coupling.
   - Cons: Introduces one more public component path instead of forcing one template for all pages.
   - Effort: Medium

2. **Expand `PublicPageTemplate` into a universal marketing-page builder** — Keep home on the same abstraction and add slots/variants for hero, CTA bands, featured programs, and richer sections.
   - Pros: One abstraction for every public page.
   - Cons: Over-engineers the first slice; pushes home-specific complexity into a generic component; higher risk of unclear props and reviewer noise.
   - Effort: Medium/High

### Recommendation
Use **Approach 1**.

Module 1 should be a complete, reviewable public slice centered on two outcomes: **(a)** a credible shared public shell and **(b)** a real localized home page that demonstrates the MVP value proposition. The home page should become a dedicated feature component composed from existing server-first patterns and current bilingual content sources.

Recommended Module 1 scope:
- Replace the generic home placeholder with a dedicated landing page component.
- Upgrade the public shell header/footer/navigation so all public routes feel intentional, not scaffolding.
- Add home sections that can be verified visually in the running app, using only existing data sources:
  - hero/value proposition
  - primary CTAs to programs/apply/contact
  - featured programs preview sourced from existing published/featured program data
  - trust/organization summary blocks sourced from translations
  - footer/contact/privacy cues inside the shared shell
- Keep `about`, `impact`, `contact`, `privacy`, and `apply` routes as localized placeholders for now, but ensure they inherit the improved shell.

This gives the next phase a single reviewable slice with visible user value, no new persistence dependency, and a natural handoff to later modules for program/application depth.

### Risks
- Translation copy volume can inflate the diff quickly even if component code stays small.
- If the shell tries to absorb too much future scope (newsletter, social links, full contact system), the slice will exceed the review budget.
- Homepage featured-program logic should stay read-only and derived from existing services; introducing new repository behavior here would create unnecessary scope creep.
- There is still no automated test runner, so verification will rely on `pnpm lint`, `pnpm build`, and manual browser review.

### Ready for Proposal
Yes — proposal should frame Module 1 as the first public-facing MVP slice: a localized public shell plus a dedicated localized home/landing page powered by existing translations and seeded published programs, intentionally excluding application workflow, admin/auth, and persistence changes.
