# Tasks: Module 1 Public Home

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 450-650 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 content + routing contract -> PR 2 home slice -> PR 3 FAQs + shell/contact wiring + verification |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Finalize public content contract and route config | PR 1 | Base slice for messages, nav, routing, service helper |
| 2 | Ship the new localized home experience | PR 2 | Depends on PR 1; includes home component and home route wiring |
| 3 | Add FAQs and anchor-based contact behavior | PR 3 | Depends on PR 2; includes redirect plus full verification |

## Phase 1: Foundation

- [x] 1.1 Extend `messages/es.json` with `Home`, `Faqs`, `Navigation`, `Shell`, and updated `Pages.about` keys while aligning the public locale contract to Spanish-only support.
- [x] 1.2 Update `src/config/site.ts` and `src/i18n/routing.ts` so public nav exposes `/faqs`, preserves locale-aware routing, and keeps `/contact` only for redirect compatibility.
- [x] 1.3 Add the read-only featured-program selection path in `src/services/programs/program-service.ts`, preserving the existing published-program contract and empty-result fallback.

## Phase 2: Home slice

- [x] 2.1 Create `src/features/public/components/public-home-page.tsx` to render story, history, offerings, flexible info, featured programs, CTA group, and `id="contact"` contact section from translations.
- [x] 2.2 Update `src/app/[locale]/(public)/page.tsx` to replace `PublicPageTemplate` with `PublicHomePage`, keep localized metadata, and pass the active locale into featured-program loading.
- [x] 2.3 Refresh the about-page institutional copy through `messages/es.json` so `src/app/[locale]/(public)/about/page.tsx` carries company information without expanding scope beyond the shared template.

## Phase 3: FAQs and shell wiring

- [x] 3.1 Create `src/features/public/components/public-faq-page.tsx` with localized Q&A rendering, empty state, and next-step actions to programs, apply, and contact.
- [x] 3.2 Create `src/app/[locale]/(public)/faqs/page.tsx` and wire localized metadata/title keys for the dedicated FAQ route inside the public shell.
- [x] 3.3 Modify `src/components/layout/public-site-shell.tsx` so shared public navigation shows FAQs and all contact actions resolve to `/{locale}#contact`.
- [x] 3.4 Replace `src/app/[locale]/(public)/contact/page.tsx` with a localized redirect to the home contact anchor while preserving backward-compatible entry behavior.

## Phase 4: Verification

- [x] 4.1 Run `pnpm lint` and `pnpm exec tsc --noEmit`; fix any route, message-shape, or server-component typing regressions before review.
- [x] 4.2 Manually verify `/es` for full home section order, featured-program fallback, FAQ navigation, `/es#contact`, and `/es/contact` redirect behavior.
