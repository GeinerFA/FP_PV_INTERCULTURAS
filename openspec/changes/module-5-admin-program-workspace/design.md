# Design: module-5-admin-program-workspace

## Technical Approach

Add an admin-only Google sign-in boundary for `/[locale]/admin` and replace the mock Programs catalog with a Mongo-backed editorial record. The public site reads only the published snapshot, while admin routes read and mutate the editorial record. This keeps public pages open, keeps applications usable behind the same guard, and matches the spec’s draft/publish/archive lifecycle without inline public editing.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Admin auth | Custom Google OAuth start/callback handlers plus a signed httpOnly session cookie | Full auth framework; password login | The app has no auth stack today. A narrow admin-only flow keeps the one allowed env email, verified email, logout, and redirect-back rules explicit. |
| Route protection | Guard in `src/proxy.ts`, then re-check in admin layout/actions | Layout-only guard | Proxy prevents admin shell flashes and preserves `next`; server-side rechecks protect actions and direct requests. |
| Program persistence | One Mongo `Program` document with `workflowState`, `draftSnapshot`, and optional `publishedSnapshot` | Separate draft/live documents; revision history | The spec requires one pending draft, explicit Publish, archive/reactivate, and no full history. One record keeps this simple. |
| Public visibility | Public services resolve only `publishedSnapshot` when state is `published`; `archived` and never-published records resolve as not found | Read draft fields directly on public routes | This prevents leaked edits and makes archived public 404 behavior deterministic. |

## Data Flow

```text
Visitor -> /[locale]/admin/*
  -> proxy.ts checks session cookie
  -> redirect /[locale]/admin/login?next=encoded-path when missing

Login page -> Google auth route -> Google callback
  -> verify Google email is verified
  -> verify normalized email === allowed env email
  -> set signed session cookie
  -> redirect to next or /[locale]/admin

Admin page/server action
  -> requireAdminSession()
  -> program/application service
  -> Mongo repository

Public programs route
  -> program service
  -> publishedSnapshot only
  -> localized DTO or notFound
```

Server/client boundary: `proxy.ts`, admin layout, pages, repositories, and auth handlers stay server-side. Admin program editing should remain server-first with server actions; add small client leaves only for repeated field UX if the form cannot stay practical otherwise.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/proxy.ts` | Modify | Detect localized admin routes, validate cookie presence, and redirect to localized login with `next`. |
| `src/lib/admin-session.ts` | Create | Centralize cookie signing/verification, allowed-email checks, redirect sanitizing, and `requireAdminSession()`. |
| `src/app/api/admin/auth/google/route.ts` | Create | Start Google OAuth with state bound to the requested return path. |
| `src/app/api/admin/auth/google/callback/route.ts` | Create | Exchange code, verify Google profile, create session, and reject unverified or non-allowed emails. |
| `src/app/[locale]/admin/layout.tsx` and related admin actions/routes | Modify | Re-check the session before rendering admin screens or mutating protected data. |
| `src/app/[locale]/admin/login/page.tsx`, `src/components/layout/admin-shell.tsx` | Modify | Replace placeholder login CTA with real sign-in/logout state and authenticated admin identity. |
| `src/models/program.ts` | Create | Add Mongoose schema/indexes for workflow state, draft snapshot, published snapshot, and audit metadata. |
| `src/types/program.ts`, `src/validators/program.ts` | Modify | Split public snapshot/admin record types, add `archived`, publish validation, and slug immutability rules. |
| `src/services/programs/program-repository.ts`, `src/services/programs/program-service.ts`, `src/services/programs/program-source.ts` | Modify | Replace runtime mock reads with Mongo-backed editorial methods; keep seed data only for migration/bootstrap input. |
| `src/app/[locale]/admin/programs/**`, `src/features/programs/components/**` | Modify | Turn overview and editor into persisted Save/Publish/Archive/Reactivate flows with archived rows visible in admin. |
| `src/app/[locale]/admin/applications/**` | Modify | Keep existing list/detail/download/status flows working behind the shared admin guard. |

## Interfaces / Contracts

```ts
type ProgramWorkflowState = "draft" | "published" | "archived";

type ProgramSnapshot = {
  slug: string;
  category: ProgramCategory;
  featured: boolean;
  coverImage: string;
  location: LocalizedText;
  duration: LocalizedText;
  availability: LocalizedText;
  translations: Record<AppLocale, ProgramTranslation>;
  seo: Record<AppLocale, ProgramSeoEntry>;
};

type ProgramRecord = {
  id: string;
  workflowState: ProgramWorkflowState;
  draftSnapshot: ProgramSnapshot;
  publishedSnapshot: ProgramSnapshot | null;
  firstPublishedAt: string | null;
};
```

Rules: Save updates `draftSnapshot` only. Publish validates required public fields, forbids slug changes after first publish, copies draft to `publishedSnapshot`, and sets `workflowState = "published"`. Archive never deletes and forces public not-found. Reactivate sets `workflowState = "draft"` without restoring public visibility until a later Publish.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Cookie helpers, redirect sanitizing, allowed-email checks, publish validation, slug immutability, archive/reactivate rules | Extract pure helpers and verify with future tests; in this repo, enforce correctness first through lint and typecheck. |
| Integration | OAuth callback decisions, repository mapping, public not-found for unpublished/archived records, protected admin application routes | Manual seeded verification against local Mongo in this phase. |
| E2E | Redirect-back login flow, program save/publish/archive/reactivate flows, application detail/status/curriculum under auth | Manual browser pass in this phase. |

## Migration / Rollout

Seed current `program-source.ts` entries into the new collection once. Published seeds populate both snapshots; draft seeds populate `draftSnapshot` only. No public-route migration is required beyond switching reads to the Mongo repository.

## Open Questions

- [ ] Confirm final environment variable names for Google client credentials, allowed admin email, app origin, and session secret before apply.
