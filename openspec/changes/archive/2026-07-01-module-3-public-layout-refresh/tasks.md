# Tasks: Module 3 Public Layout Refresh

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 320-390 |
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
| 1 | Refresh Module 3 page layouts and page-local message contracts, then verify the three localized routes | Single PR | Focused scope across `messages/es.json` plus the three public page components; this change does not justify a chained PR |

## Phase 1: About slice

- [x] 1.1 Update `messages/es.json` `Pages.about` to the approved nested contract: `history.milestones`, `mission.pillars`, and `methodology.steps`.
- [x] 1.2 Update `src/features/public/components/public-about-page.tsx` to read the typed About messages and render the hero, split history timeline, mission list, and numbered methodology sequence.

## Phase 2: Impact slice

- [x] 2.1 Update `messages/es.json` `Pages.impact` to the approved nested groups: `story`, `testimonials.entries`, `gallery.items`, and `principles.items`.
- [x] 2.2 Update `src/features/public/components/public-impact-page.tsx` to render the editorial story block, testimonial list, gradient gallery placeholders, and principles accent list without adding CTA behavior.

## Phase 3: Privacy slice

- [x] 3.1 Update `messages/es.json` `Pages.privacy` to the approved `intro`, `sections`, and `commitments.items` structure with plain-language guidance.
- [x] 3.2 Update `src/features/public/components/public-privacy-page.tsx` to render the intro companion copy, numbered sections, and a valid commitments accent block while keeping route behavior unchanged.
- [x] 3.3 Keep styling page-local in `public-about-page.tsx`, `public-impact-page.tsx`, and `public-privacy-page.tsx`; do not add a shared helper in `src/app/globals.css`.

## Phase 4: Verification and review

- [x] 4.1 Run `pnpm lint` and `pnpm exec next typegen && pnpm exec tsc --noEmit` to validate JSX, class strings, generated route-aware types, and typed access to the nested page-local messages.
- [x] 4.2 Run `pnpm build` to verify App Router integration, localized metadata, and the three Module 3 routes.
- [x] 4.3 Manually review `/es/about`, `/es/impact`, and `/es/privacy` for informational scope, reshaped localized content rendering, and the valid Privacy commitments accent.
