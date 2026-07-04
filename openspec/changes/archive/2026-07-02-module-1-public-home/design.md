# Design: Module 1 Public Home

## Technical Approach

Replace the localized home placeholder with a dedicated server-rendered public home assembled from focused public feature components and message-driven content. The design keeps the existing `src/app/[locale]/(public)` split, reuses the read-only `program-service` for featured previews, adds a localized FAQs route, and updates the shared public shell so FAQ is a first-class destination while Contact resolves to the home anchor. The active product surface remains Spanish-only, and unsupported non-Spanish locale paths are not normalized.

## Architecture Decisions

### Decision: Build a dedicated home feature instead of extending `PublicPageTemplate`

**Choice**: Create home-specific components under `src/features/public/components/` and keep `PublicPageTemplate` for simpler secondary pages.
**Alternatives considered**: Keep adding conditional sections to `PublicPageTemplate`; build the home inline in `page.tsx`.
**Rationale**: The current template is a generic hero/card wrapper. Home now needs multiple content sections, CTAs, featured programs, and a contact anchor. A dedicated feature keeps the public/admin split clean and avoids turning the shared template into a conditional marketing page builder.

### Decision: Keep the home flow fully server-first

**Choice**: Render home, FAQs, shell navigation, and featured-program data in async server components; introduce no client component unless later interaction requires hooks/browser APIs.
**Alternatives considered**: Client-render CTA/contact behavior.
**Rationale**: Current app patterns already use server components with `getTranslations` and read-only services. Anchor navigation works without client state, so a client boundary would add complexity with no gain.

### Decision: Treat contact as navigation behavior, not a public page

**Choice**: Change shared/public contact actions to `/{locale}#contact`, add the contact section to home, and convert the existing `/contact` page into a localized redirect target for backward compatibility.
**Alternatives considered**: Keep `/contact` live; remove the route entirely.
**Rationale**: Specs require Contact to land on home. Redirecting preserves old links without keeping a contradictory standalone screen.

## Data Flow

```text
Visitor -> /[locale]
  -> app/(public)/page.tsx
  -> PublicHomePage server component
  -> getTranslations(Home/Shell/Navigation)
  -> listPublicPrograms(locale)
  -> featured subset + fallback CTA
  -> rendered sections inside PublicSiteShell

Visitor -> FAQ link -> /[locale]/faqs
Visitor -> Contact link from any public page -> /[locale]#contact
Visitor -> /[locale]/contact -> redirect -> /[locale]#contact
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/[locale]/(public)/page.tsx` | Modify | Replace `PublicPageTemplate` usage with dedicated home entry and preserve metadata via new message keys. |
| `src/app/[locale]/(public)/faqs/page.tsx` | Create | Add localized FAQ route inside the public shell. |
| `src/app/[locale]/(public)/contact/page.tsx` | Modify | Redirect legacy contact route to the localized home anchor. |
| `src/features/public/components/public-home-page.tsx` | Create | Compose story/history/offerings/flexible block/featured programs/CTAs/contact. |
| `src/features/public/components/public-faq-page.tsx` | Create | Render localized FAQ entries, empty state, and next-step CTAs. |
| `src/components/layout/public-site-shell.tsx` | Modify | Add FAQ nav item handling and render Contact as a home-anchor action across public pages. |
| `src/config/site.ts` | Modify | Replace `/contact` nav item with `/faqs`; keep contact as explicit anchor behavior instead of route config. |
| `src/i18n/routing.ts` | Modify | Register `/faqs`; keep `/contact` only if redirect route remains. |
| `src/services/programs/program-service.ts` | Modify | Add a small read-only helper for featured published programs or reuse `listPublicPrograms` with local filtering. |
| `messages/es.json` | Modify | Keep the existing message namespaces aligned with the current Spanish-first public copy. |

## Interfaces / Contracts

```ts
type HomeSectionId = "story" | "history" | "offerings" | "info" | "featured" | "contact";

type FaqEntry = {
  question: string;
  answer: string;
};
```

Message namespaces should be split by surface (`Home`, `Faqs`, `Navigation`, `Shell`) so the active Spanish runtime stays consistent with the locale-aware app structure.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Static quality | Routing/types/messages wiring | `pnpm lint` and `pnpm exec tsc --noEmit` |
| Integration gap | Home fallback when no featured programs exist | Manual browser verification because no runner is configured |
| Integration gap | FAQ route and contact anchor/redirect behavior | Manual verification on `/es` |

## Migration / Rollout

No migration required. Rollout is file-based and reversible by restoring the placeholder home, removing `/faqs`, and undoing the contact redirect/anchor navigation changes.

## Open Questions

- [ ] Should a future cleanup pass simplify the wider locale-aware folder structure now that Spanish is the only supported locale?
