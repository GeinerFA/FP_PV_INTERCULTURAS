# Tasks: Module 3 Public Layout Refresh

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 260-360 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Refresh About, Impact, and Privacy presentation plus verification | Single PR | Keep all three page slices and review evidence together; run the app after apply for visual review |

## Phase 1: About page refresh

- [x] 1.1 Recompose `src/features/public/components/public-about-page.tsx` history into an open editorial split that keeps the current hero copy and `history.milestones` loop intact.
- [x] 1.2 Replace the `mission.pillars` three-card grid in `src/features/public/components/public-about-page.tsx` with a lighter list/two-column reading pattern without changing messages.
- [x] 1.3 Keep `methodology` as the single accent section in `src/features/public/components/public-about-page.tsx`, but restyle `steps` as a numbered sequence with lighter separators.

## Phase 2: Impact page refresh

- [x] 2.1 Rework `src/features/public/components/public-impact-page.tsx` hero + `story` so the story reads as an editorial companion block instead of a separate soft card.
- [x] 2.2 Restyle `testimonials.entries` in `src/features/public/components/public-impact-page.tsx` as a low-chrome quote list/grid that emphasizes typography over repeated panels.
- [x] 2.3 Lighten `gallery.items` framing in `src/features/public/components/public-impact-page.tsx` while preserving gradient placeholders, captions, and localized alt text.
- [x] 2.4 Use `principles` as the only accent section in `src/features/public/components/public-impact-page.tsx` and convert items from boxed cards to a concise marked list.

## Phase 3: Privacy page refresh

- [x] 3.1 Merge the hero and `intro` treatment in `src/features/public/components/public-privacy-page.tsx` into a calmer top section without changing content or route behavior.
- [x] 3.2 Convert `privacy.sections` in `src/features/public/components/public-privacy-page.tsx` from equal soft cards into a reading-first stack/split layout with clearer heading hierarchy.
- [x] 3.3 Restyle `commitments` in `src/features/public/components/public-privacy-page.tsx` as the page’s single accent block and replace the malformed gradient utility with a valid class string.
- [x] 3.4 Only if duplicated accent styling becomes undeniable across the three pages, add one tiny helper in `src/app/globals.css`; otherwise keep styling page-local.

## Phase 4: Verification and review

- [x] 4.1 Run `pnpm lint` and `pnpm exec tsc --noEmit` to catch JSX/classname/type regressions from the presentation-only edits.
- [x] 4.2 Run the project locally after apply and visually review `/es/about`, `/es/impact`, and `/es/privacy` for editorial flow, scope discipline, and the fixed Privacy accent.
