# Design: Module 3 Public Layout Refresh

## Technical Approach

Keep the refresh inside the three existing server components that already read `next-intl` messages and render inside the shared public shell. This change is presentation-only: preserve message shapes, route ownership, metadata flow, and static localized content, but recompose each page toward a more editorial reading rhythm with fewer `surface-soft` wrappers and fewer uniform three-card grids.

The implementation should follow the calmer patterns already visible in `PublicHomePage` and `PublicFaqPage`: open text blocks, timeline/bullet treatment, split layouts only where they help scanability, and a single restrained accent section per page.

## Architecture Decisions

| Decision | Options considered | Tradeoff | Decision |
|----------|--------------------|----------|----------|
| Scope the refresh to page-local presentation | Rework only `public-about-page.tsx`, `public-impact-page.tsx`, `public-privacy-page.tsx` vs. introduce shared shell redesign | Shared-shell work would widen review surface and violate proposal scope | Modify only the three page components; shared shell stays unchanged |
| Preserve existing message contracts | Reuse current `messages.Pages.*` structures vs. reshape content models | Model changes add risk with no user value for this change | Keep all message types and `Object.entries(...)` loops intact |
| Minimize new shared styling | Inline existing utility classes vs. add reusable CSS abstraction | Shared abstractions are only worth it if duplication is undeniable | Default to page-local markup changes; allow at most one tiny helper/class only if repeated accent styling becomes noisy |
| Treat Privacy gradient fix as design debt inside the refresh | Ignore malformed class until later vs. correct it when that section is touched | Leaving known broken styling behind weakens the refresh | Replace the malformed gradient string with a valid accent treatment if the commitments section is updated |

## Data Flow

No behavioral flow changes are introduced.

`getMessages()` → page-local message object → existing section loops (`history`, `pillars`, `steps`, `entries`, `items`) → server-rendered JSX inside current public shell

The refresh changes only how those sections are grouped and styled.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/public/components/public-about-page.tsx` | Modify | Recompose history, mission, and methodology into lighter editorial sections with fewer boxed groupings. |
| `src/features/public/components/public-impact-page.tsx` | Modify | Convert story/testimonials/gallery/principles from repeated card blocks into a mixed editorial layout with one accent section. |
| `src/features/public/components/public-privacy-page.tsx` | Modify | Replace boxed intro/section grid with clearer long-form informational flow and fix the malformed commitments gradient. |
| `src/app/globals.css` | Optional modify | Only if one tiny shared utility clearly reduces duplicated accent/background classes across the three refreshed pages. |

## Interfaces / Contracts

No new interfaces are required. Existing server-component props and message types remain unchanged.

## Page Reshape Plan

### About
- Keep the current hero structure.
- Move `history` closer to the `PublicHomePage` timeline pattern: descriptive copy on one side, milestones rendered as an open vertical list rather than inside a `surface-soft` panel.
- Change `mission.pillars` from three equal cards into a simple list or staggered two-column bullet treatment anchored by the existing mission heading.
- Keep `methodology` as the page’s single accent section, but render `steps` as a numbered editorial sequence with lighter separators instead of boxed mini-cards.

### Impact
- Keep the hero copy, but soften `story` into a text companion block rather than a separate soft card.
- Render `testimonials.entries` as quotes in an editorial list/grid with minimal chrome; emphasis should come from typography and spacing, not repeated panels.
- Keep `gallery.items` visual, but reduce frame heaviness: preserve the gradient image placeholders and captions while removing unnecessary border/card weight.
- Use `principles` as the single accent section and present items as a concise list with markers, not three boxed cards.

### Privacy
- Keep the hero and `intro` content, but merge them into a calmer top section so the page reads like guidance, not a feature grid.
- Convert `sections` from three equal soft cards into a reading-first stack or split list with clearer heading hierarchy for long-form explanation.
- Keep `commitments` as the single accent block, but replace the malformed gradient class with a valid gradient/background treatment and simplify items into a list pattern.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Lint | JSX/classname/type safety after markup edits | `pnpm lint` |
| Typecheck | Message typing and server-component contracts | `pnpm exec tsc --noEmit` |
| Manual review | Editorial flow, hierarchy, localized routes, no CTA expansion, valid Privacy accent | Browser review of `/es/about`, `/es/impact`, `/es/privacy` |

## Migration / Rollout

No migration required.

## Open Questions

- [ ] None at design time; implementation should only add a shared CSS helper if duplication is obvious after reshaping the three pages.
