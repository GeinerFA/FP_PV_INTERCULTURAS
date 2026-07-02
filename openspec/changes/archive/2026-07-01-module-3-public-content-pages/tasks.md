# Tasks: Module 3 Public Content Pages

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 430-560 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 About → PR 2 Impact → PR 3 Privacy + final verification |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Ship About page slice | PR 1 | Base slice; route, component, and `messages/es.json` about branch together |
| 2 | Ship Impact page slice | PR 2 | Depends on PR 1 only for chain order; include image decision and any `public/` assets |
| 3 | Ship Privacy slice and full verification | PR 3 | Close remaining route copy, run lint/typecheck/build, and manual route checks |

## Phase 1: Foundation

- [x] 1.1 Confirm whether `openspec/changes/module-3-public-content-pages` will use chained PRs before apply, because the planned diff likely exceeds the 400-line review budget.
- [x] 1.2 Define the final message shapes for `Pages.about`, `Pages.impact`, and `Pages.privacy` in `messages/es.json`, including sections, testimonials, gallery, and informational privacy blocks.

## Phase 2: About Slice

- [x] 2.1 Create `src/features/public/components/public-about-page.tsx` as a server component that reads structured messages and renders history, mission, and methodology sections.
- [x] 2.2 Update `src/app/[locale]/(public)/about/page.tsx` to pass `locale` into `PublicAboutPage` while preserving `generateMetadata()` with `buildMetadata()`.
- [x] 2.3 Replace placeholder `Pages.about` keys in `messages/es.json` with the structured About content needed by the new component.

## Phase 3: Impact Slice

- [x] 3.1 Resolve the design open question for Impact imagery: ship curated files under `public/` or keep static non-interactive visual placeholders for this slice.
- [x] 3.2 Create `src/features/public/components/public-impact-page.tsx` to render testimonial-led sections plus photo/storytelling blocks without CTA or analytics behavior.
- [x] 3.3 Update `src/app/[locale]/(public)/impact/page.tsx`, `messages/es.json`, and any approved `public/` assets so `/[locale]/impact` stays static and localized.

## Phase 4: Privacy Slice

- [x] 4.1 Create `src/features/public/components/public-privacy-page.tsx` to present simple visitor-facing privacy guidance in non-legal language.
- [x] 4.2 Update `src/app/[locale]/(public)/privacy/page.tsx` and `messages/es.json` so metadata and body copy reflect informational privacy scope only.

## Phase 5: Verification

- [x] 5.1 Run `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` to catch message-shape, route, and metadata regressions.
- [x] 5.2 Manually verify `/es/about`, `/es/impact`, and `/es/privacy` for shared shell rendering, expected static content, localized metadata, and absence of new CTA workflows.
