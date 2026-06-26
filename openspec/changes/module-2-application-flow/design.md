# Design: Module 2 Application Flow

This slice ships one Spanish-only public intake and one minimal admin review loop against the existing Atlas collection `fp_pv_interculturas.applications`. The design follows the repo’s server-first App Router shape, but the persistence contract is the legacy Atlas schema, not a greenfield Module 2 model.

## Technical Approach

Use route-local server actions for writes, server components for read surfaces, and one client component for the public form. Persist through Mongoose, but treat the repository read layer as the compatibility boundary: new writes must match the legacy validator, while reads normalize older records before they are parsed into the local `Application` type.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Domain placement | Keep the slice in `src/features/applications`, `src/services/applications`, `src/models/application.ts`, `src/types/application.ts`, and `src/validators/application.ts` | Fold logic into route files | The repo already separates route composition from domain code; this keeps public and admin flows sharing one contract. |
| Persistence contract | Write directly to the existing Atlas `applications` collection with type `volunteering`, statuses `pending/in_process/resolved/cancelled`, BSON `Date` fields, and legacy `{ from, to, reason, changedAt, changedBy }` history entries | Introduce a new schema or change the Atlas validator | The shipped environment already contains legacy data and a validator. Matching that contract is safer than migrating production-like data. |
| Compatibility boundary | Normalize legacy records inside `src/services/applications/application-repository.ts` before `parseApplication()` | Push normalization into UI or service code | Repository-side normalization keeps the rest of the app working with one stable shape while tolerating legacy status/type/history variants already stored in Atlas. |
| Mongoose model lifecycle | Use a cached connection in `src/lib/mongoose.ts` and recreate the `Application` model in non-production via `delete models.Application` | Reuse the compiled model in all environments | During dev/runtime iteration, stale model caching caused schema drift. Recompiling the model outside production keeps the local schema aligned with the accepted validator. |

## Data Flow

Public submit:

`/apply/page.tsx` → `PublicApplicationForm` (`useActionState`) → `submitApplicationAction` → local field validation → `createApplication` → repository `create()` → Mongoose `ApplicationModel.create()` → Atlas write → success cookie → redirect `/[locale]/apply/success`

Admin read/update:

`/admin/applications/page.tsx` or `/admin/applications/[id]/page.tsx` → `listApplications()` / `getApplicationById()` → repository `list()` / `findById()` → normalize legacy document → `parseApplication()` → server-rendered overview/detail

`/admin/applications/[id]/actions.ts` → `parseApplicationStatus()` → `updateApplicationStatus()` → repository `updateStatus()` → append legacy-compatible history entry → `revalidatePath()` list + detail

## File Changes

| File | Action | Description |
|---|---|---|
| `src/lib/mongoose.ts` | Create | Cached Mongoose connection with `MONGODB_URI` guard. |
| `src/models/application.ts` | Create | Local Mongoose schema aligned to the legacy Atlas validator, including history subdocuments and non-production recompilation safeguard. |
| `src/types/application.ts` | Create | Local TypeScript contract for normalized application records, allowed persisted statuses, and `volunteering` type snapshots. |
| `src/validators/application.ts` | Create | Parse helpers for form payloads, statuses, normalized records, and legacy-compatible ISO output. |
| `src/services/applications/application-repository.ts` | Create | Atlas repository for create/list/find/update plus legacy read normalization. |
| `src/services/applications/application-service.ts` | Create | Seeds `volunteering`, `pending`, derived `fullName`, and initial legacy history entries. |
| `src/features/applications/public-application-form-contract.ts` | Create | Shared public form field contract and action state. |
| `src/features/applications/public-application-flow.ts` | Create | Success-cookie constants for the public flow. |
| `src/features/applications/components/public-application-form.tsx` | Create | Client form boundary with validation feedback and submit pending state. |
| `src/features/applications/components/public-application-success.tsx` | Create | Confirmation view shown only after an accepted submission. |
| `src/features/applications/components/admin-applications-overview.tsx` | Create | Server-rendered inbox with persisted-status summaries and Spanish labels. |
| `src/features/applications/components/admin-application-detail.tsx` | Create | Server-rendered detail, history timeline, and status-update form. |
| `src/app/[locale]/(public)/apply/actions.ts` | Create | Submission action with validation, persistence call, cookie gate, and recoverable failure path. |
| `src/app/[locale]/(public)/apply/page.tsx` | Modify | Replace the placeholder page with the real public intake composition. |
| `src/app/[locale]/(public)/apply/success/page.tsx` | Modify | Gate confirmation on the success cookie and render the success component. |
| `src/app/[locale]/admin/applications/page.tsx` | Modify | Render the real applications inbox. |
| `src/app/[locale]/admin/applications/[id]/page.tsx` | Modify | Load one application, handle not-found, and render the detail surface. |
| `src/app/[locale]/admin/applications/[id]/actions.ts` | Create | Persist allowed status changes and revalidate list/detail routes. |
| `messages/es.json` | Modify | Spanish-friendly labels for persisted statuses and application copy without changing stored values. |

## Interfaces / Contracts

```ts
type ApplicationStatus = "pending" | "in_process" | "resolved" | "cancelled";

type ApplicationTypeSnapshot = {
  code: "volunteering";
  name: string;
};

type ApplicationStatusHistoryEntry = {
  from: ApplicationStatus | null;
  to: ApplicationStatus;
  reason: string | null;
  changedAt: string;
  changedBy: { userId?: string; email?: string; role?: string } | null;
};
```

New writes store `birthDate`, `createdAt`, `updatedAt`, and history timestamps as BSON `Date` values in MongoDB. Read paths normalize legacy values such as `in_review` → `in_process`, `finalized` → `resolved`, string actors, missing history arrays, and incomplete type snapshots before validation.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Static quality | Build and type safety | `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` |
| Runtime integration | Public submit, success gating, admin list/detail/status update, not-found handling | Atlas-backed smoke checks and isolated TSX service probes |
| Compatibility | Legacy record reads and status normalization | Repository/service execution against isolated Atlas data with legacy-shaped documents |

## Migration / Rollout

No migration required. Deploy with `MONGODB_URI` pointing at the existing Atlas database; new writes must coexist with legacy documents already in `fp_pv_interculturas.applications`.

## Open Questions

- [ ] None blocking for design.
