# Design: Module 3 Public Layout Refresh

## Technical Approach

Keep the change inside the existing localized public routes and their three server-rendered feature components, but document the REAL implemented scope: the refresh combines editorial layout changes with page-local `next-intl` message-contract reshaping for About, Impact, and Privacy. Route ownership, metadata generation, public-shell placement, and informational behavior stay unchanged.

The implementation relies on inline page-local message types plus `Object.entries(...)` iteration over nested localized groups. The design therefore treats `messages/es.json` as an intentional part of the change, not as accidental drift.

## Architecture Decisions

| Decision | Options considered | Tradeoff | Decision |
|----------|--------------------|----------|----------|
| Keep scope page-local to Module 3 | Touch only About/Impact/Privacy vs. broaden into home/shell work | Broader public-page work would violate approved scope | Limit changes to the three feature components plus their page-local messages |
| Accept localized contract reshaping | Force old flat/highlight contracts vs. document nested page-specific structures | Old contracts do not match the implemented editorial sections | Use nested page contracts: `history/mission/methodology`, `story/testimonials/gallery/principles`, `intro/sections/commitments` |
| Preserve server-first composition | Add client state/interactivity vs. keep `getMessages()` server components | Client boundaries would add unnecessary behavior and review surface | Keep all three pages as server components with static informational rendering |
| Keep styling page-local | Add shared CSS helper vs. repeat utility-based section styling | Shared abstraction is not justified by the current implementation | Keep accent/timeline/list styling inline; no `globals.css` helper is required |

## Data Flow

Localized routing and metadata stay stable:

`/[locale]/about|impact|privacy` page entry → `getTranslations("Pages.*")` for metadata → feature component → `getMessages()` → typed `messages.Pages.*` slice → `Object.entries(...)` loops for nested sections → server-rendered editorial sections inside the current public shell

The only contract change is inside each page namespace in `messages/es.json`; no new service, persistence, or client flow is introduced.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/public/components/public-about-page.tsx` | Modify | Defines `PublicAboutMessages` inline and renders hero, split history timeline, mission pillar list, and methodology numbered sequence. |
| `src/features/public/components/public-impact-page.tsx` | Modify | Defines `PublicImpactMessages` inline and renders story companion copy, testimonial quote grid, gradient gallery placeholders, and principles accent list. |
| `src/features/public/components/public-privacy-page.tsx` | Modify | Defines `PublicPrivacyMessages` inline and renders intro companion copy, numbered long-form sections, and a valid commitments accent block. |
| `messages/es.json` | Modify | Supplies the approved page-local nested content groups consumed directly by the three components. |

## Interfaces / Contracts

No shared TypeScript interface is introduced. Each page keeps a local message contract cast from `messages.Pages`:

- About: root copy plus `history.milestones`, `mission.pillars`, `methodology.steps`
- Impact: root copy plus `story`, `testimonials.entries`, `gallery.items`, `principles.items`
- Privacy: root copy plus `intro`, `sections`, `commitments.items`

These contracts are localized-content structures only; they do not create new domain entities or APIs.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Lint | JSX, class strings, and server-component edits | `pnpm lint` |
| Typecheck | Local message casts and nested section access after generating Next route-aware types | `pnpm exec next typegen && pnpm exec tsc --noEmit` |
| Build | Route + metadata integration under App Router | `pnpm build` |
| Manual review | `/es/about`, `/es/impact`, `/es/privacy` rendering, informational scope, valid Privacy accent | Browser/HTTP inspection of localized routes |

## Migration / Rollout

No migration required. This is a static content-and-presentation refresh within existing localized namespaces.

## Open Questions

- [ ] None.
