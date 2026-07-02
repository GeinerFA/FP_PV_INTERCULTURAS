# Design: Module 3 Public Content Pages

This amendment keeps the approved Module 3 scope unchanged (`about`, `impact`, `privacy`) and refines the implementation plan so these pages feel closer to the existing shell’s editorial flow, with fewer boxed panels and fewer card grids.

## Technical Approach

The route files already follow the right App Router pattern: `generateMetadata()` stays in `src/app/[locale]/(public)/.../page.tsx`, each route renders a dedicated server component, and localized copy remains in `messages/es.json`. The design change is inside the three page components: reduce repeated `surface-soft` wrappers, flatten nested container-on-container layouts, and convert several grid-of-card sections into more open text-led sections that match `PublicHomePage` and `PublicFaqPage` more closely.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Scope control | Amend only `PublicAboutPage`, `PublicImpactPage`, and `PublicPrivacyPage` visuals | Expand to other public pages or shell-level restyling | The product direction is explicitly Module 3-only. `PublicSiteShell` already provides the fluid page background and spacing. |
| Composition style | Prefer editorial sections, timelines, bullet-led lists, and text/image bands over repeated tiled cards | Keep current card-heavy layouts | The segmented feel comes from page-level composition, especially `surface-soft` panels and 3-column card blocks. |
| Styling changes | Reuse current utilities first; add global CSS only if repeated patterns cannot be expressed cleanly in-page | Introduce a new component library or broad token refactor | This keeps the amendment small, code-local, and aligned with current Tailwind + utility usage. |
| Component boundary | Keep all three pages as server components with static localized content | Add client animation or interactive gallery behavior | Specs still require static informational pages with no CTA/conversion behavior. |

## Data Flow

`/[locale]/about|impact|privacy`
→ `generateMetadata()` reads `Pages.*` title/description
→ route renders existing dedicated page component
→ component reads typed branch from `getMessages()`
→ static sections render inside existing `PublicSiteShell`
→ visual hierarchy comes from section spacing, typography, bullets, and restrained accent surfaces

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `openspec/changes/module-3-public-content-pages/design.md` | Modify | Record the visual-fluidity amendment without changing functional scope. |
| `src/features/public/components/public-about-page.tsx` | Likely modify | Remove the milestone panel wrapper, soften the mission 3-card block into lighter text-led columns, and keep methodology as the main accent section instead of stacking multiple framed sections. |
| `src/features/public/components/public-impact-page.tsx` | Likely modify | Turn the intro story panel into a more open split layout, reduce testimonial tile treatment, and make the gallery/principles sections rely more on spacing and typography than boxed cards. |
| `src/features/public/components/public-privacy-page.tsx` | Likely modify | Replace the uniform 3-card privacy section with simpler editorial blocks or list rows, keep one restrained commitments accent section, and deliberately fix the malformed gradient utility if this section is touched. |
| `src/app/globals.css` | Possible modify | Add a small shared utility only if repeated “editorial section” or divider treatment appears across all three pages. |
| `messages/es.json` | No structural change expected | Existing content structure should remain sufficient because this amendment targets presentation, not capability or copy model expansion. |

## Interfaces / Contracts

No route, metadata, or localization contract changes are required. Existing typed message shapes in the three page components remain the source of truth, and no client boundary or new data source is introduced.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Static analysis | TSX/class updates preserve typing and message access | `pnpm lint` and `pnpm exec tsc --noEmit` |
| Build integration | Route metadata and server component rendering still compile | `pnpm build` during verify |
| Manual visual review | `/es/about`, `/es/impact`, `/es/privacy` feel less segmented, remain static, and keep localized content intact | Browser review against current Module 3 pages |

## Migration / Rollout

No migration required. This is a presentation-only refinement inside the existing localized public route structure.

## Open Questions

- [ ] None blocking. If implementation reveals repeated editorial-section markup across all three pages, a tiny shared utility class is acceptable, but only if it reduces duplication without widening scope.
