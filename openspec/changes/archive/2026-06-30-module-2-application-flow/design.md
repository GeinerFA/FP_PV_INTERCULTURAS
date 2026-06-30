# Design: Module 2 Application Flow

Module 2 remains a Spanish-only public intake plus minimal admin review over the legacy Atlas collection `fp_pv_interculturas.applications`. The design stays server-first, keeps curriculum handling unchanged, preserves optional `message/comment` behavior, and moves the admin return-home affordance from application pages into the shared admin shell so every admin route gets one consistent top-left house-icon control.

## Technical Approach

Keep the public submission flow as one route-local server action plus one client form boundary. Keep Atlas compatibility in the shared application service/repository, where blank `message` input is normalized to `null` without widening the legacy schema contract. For admin navigation, implement one shell-level localized link in `src/components/layout/admin-shell.tsx` that points to `/${locale}` and renders ahead of the existing admin navigation, without changing the overall admin information architecture.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Public form boundary | Keep `src/features/applications/components/public-application-form.tsx` as the only client component; validation and persistence stay in `src/app/[locale]/(public)/apply/actions.ts` and services | Move validation into the client | The repo is server-first, so persistence rules should stay on the server. |
| Optional message handling | Keep the textarea visible, remove it from required validation, and persist blank input as `null` | Remove the field or store empty strings | This preserves the accepted UX while staying compatible with Atlas-shaped reads and writes. |
| Legacy compatibility boundary | Continue normalizing legacy records in `src/services/applications/application-repository.ts` before `parseApplication()` | Scatter fallbacks across routes and components | One repository boundary keeps legacy `general`, `in_review`, `finalized`, and weak `changedBy` handling contained. |
| Admin home placement | Add one shell-level house-icon `Link` in `src/components/layout/admin-shell.tsx`, positioned in the top-left area and linking to `/${locale}` | Keep page-level CTAs on applications only, add an `adminNavigation` item, or redesign admin nav | The requirement now applies to all admin pages, but it is still intentionally narrow: one shared control, not a wider IA change. |

## Data Flow

Public submit:

`/apply/page.tsx` → `PublicApplicationForm` (`useActionState`) → `submitApplicationAction` → validate required fields except `message` + curriculum rules → normalize `phone` and blank `message` → `createApplication` → repository `create()` → `ApplicationModel.create()` → Atlas write → success cookie → redirect `/[locale]/apply/success`

Admin render:

`/app/[locale]/admin/layout.tsx` → `AdminShell` → localized top-left home link to `/${locale}` + existing admin navigation → child admin page render

Admin application read/update:

`/admin/applications/page.tsx` or `/admin/applications/[id]/page.tsx` → `listApplications()` / `getApplicationById()` → repository read/normalize → `parseApplication()` → server-rendered overview/detail

`/admin/applications/[id]/actions.ts` → `parseApplicationStatus()` → `updateApplicationStatus()` → repository `updateStatus()` → append legacy-compatible history entry → `revalidatePath()` list + detail

## File Changes

| File | Action | Description |
|---|---|---|
| `src/features/applications/public-application-form-contract.ts` | Modify | Keep the visible field contract but stop treating `message` as required input state. |
| `src/app/[locale]/(public)/apply/actions.ts` | Modify | Relax required-field validation, keep curriculum validation, and normalize blank `message` before service submission. |
| `src/validators/application.ts` | Modify | Parse submission payloads with optional/nullable `message` while preserving strict status and read validation. |
| `src/types/application.ts` | Modify | Reflect nullable `message` in submission and persistence contracts. |
| `src/services/applications/application-service.ts` | Modify | Default blank `message` to `null` while still seeding `volunteering`, `pending`, and initial history. |
| `src/services/applications/application-repository.ts` | Preserve | Keep legacy read normalization and curriculum retrieval behavior as the compatibility layer. |
| `src/components/layout/admin-shell.tsx` | Modify | Add the shared top-left house-icon home control for all admin pages without changing `siteConfig.adminNavigation`. |
| `src/app/[locale]/admin/applications/page.tsx` | Modify | Remove the page-local return-home CTA because the shell now provides it. |
| `src/app/[locale]/admin/applications/[id]/page.tsx` | Modify | Remove the page-local return-home CTA because the shell now provides it. |
| `messages/es.json` | Modify | Add or update the Spanish label/accessible text for the shared shell home control and preserve optional-message copy. |

## Interfaces / Contracts

```ts
type ApplicationSubmissionInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  birthDate: string;
  message?: string | null;
  curriculum?: ApplicationCurriculumUpload | null;
};
```

The new admin-shell affordance does not change service or persistence contracts. Writes still store `birthDate`, `createdAt`, `updatedAt`, and history timestamps as BSON `Date` values, and blank message/comment input is normalized before persistence.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Static quality | Type and route integrity after nullable-message and shell-link changes | `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` |
| Runtime integration | Submit with and without message, invalid file rejection, success gating, shared admin-shell home control on multiple admin pages, curriculum download, status update | Manual Atlas-backed smoke checks in `/es/apply`, `/es/admin`, `/es/admin/applications`, and `/es/admin/applications/[id]` |
| Compatibility | Legacy reads plus blank-message writes | Service/repository probes against Atlas-shaped fixtures or isolated data |

## Migration / Rollout

No migration required. Deploy against the existing Atlas database with the current curriculum storage behavior intact.

## Open Questions

- [ ] None blocking for design.
