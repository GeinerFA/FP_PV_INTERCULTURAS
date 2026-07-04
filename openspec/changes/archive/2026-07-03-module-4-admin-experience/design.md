# Design: Module 4 Admin Experience

## Technical Approach

Ship the first trustworthy admin slice as a server-rendered workspace refresh. `AdminShell` keeps the dark admin IA, but borrows the public site’s calmer spacing, width discipline, and restrained radial accents. `AdminPageTemplate` stops forcing placeholder cards onto real pages. `/[locale]/admin` becomes a real dashboard from `listAdminPrograms()` and `listApplications()`. `/[locale]/admin/programs` becomes a stronger read-only management surface, while create/edit routes stay honest preview workspaces over the existing in-memory program repository. All touched routes remain server components; no new client boundary or persistence contract is introduced.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|---|---|---|---|
| Shared shell rhythm | Keep the current flat shell; copy public marketing styling directly | Refine `src/components/layout/admin-shell.tsx` with subtle dark gradients, stronger section spacing, and calmer header/sidebar rhythm | Preserves admin scan speed while reusing the public shell’s visual polish |
| Real vs placeholder pages | Keep one generic template; split template behavior | Extend `src/features/admin/components/admin-page-template.tsx` with `workspace` and `placeholder` behavior | Lets dashboard/programs/applications feel real while preserving placeholder routes (`login`, `reports`, `activity`, `settings`) |
| Dashboard data source | Add a new admin API; reuse existing services | Build a new server component from `listAdminPrograms()` and `listApplications()` | Uses truthful data already available and avoids widening scope into new contracts |
| Program management boundary | Pretend save exists; hide create/edit routes | Keep routes visible, improve the overview, and add explicit preview-only messaging in `admin-program-form-shell.tsx` | Keeps admin IA intact without implying CRUD persistence exists |

## Data Flow

`listAdminPrograms()` → dashboard summary cards + programs overview sections  
`listApplications()` → dashboard workload cards + existing applications inbox  
`AdminPageTemplate(variant)` → shared heading/action frame for dashboard, programs, applications, and detail pages  
`AdminProgramFormShell(mode)` → preview-only form scaffold with no submit action  
`updateApplicationStatusAction` → existing application detail workflow unchanged inside the refined workspace shell

## File Changes

| File | Action | Description |
|---|---|---|
| `src/components/layout/admin-shell.tsx` | Modify | Refine shell spacing, background, and sidebar rhythm while preserving shared navigation and public-home return control |
| `src/features/admin/components/admin-page-template.tsx` | Modify | Add workspace-vs-placeholder behavior and cleaner header framing |
| `src/features/admin/components/admin-dashboard-overview.tsx` | Create | Server component that summarizes program/application reality and links into admin work |
| `src/app/[locale]/admin/page.tsx` | Modify | Replace placeholder-only dashboard with the real dashboard overview |
| `src/features/programs/components/admin-programs-overview.tsx` | Modify | Add stronger operational summaries/grouping while staying read-only |
| `src/features/programs/components/admin-program-form-shell.tsx` | Modify | Make the preview-only boundary explicit and consistent with the new workspace framing |
| `src/app/[locale]/admin/programs/page.tsx` | Modify | Opt into workspace template behavior |
| `src/app/[locale]/admin/programs/new/page.tsx` | Modify | Opt into workspace template behavior for preview create |
| `src/app/[locale]/admin/programs/[id]/edit/page.tsx` | Modify | Opt into workspace template behavior for preview edit |
| `src/app/[locale]/admin/applications/page.tsx` | Modify | Opt into workspace template behavior so the shipped inbox keeps parity |
| `src/app/[locale]/admin/applications/[id]/page.tsx` | Modify | Keep the detail flow inside the refined workspace framing |
| `messages/es.json` | Modify | Remove placeholder wording where pages become real and clarify preview-only program form copy |

## Interfaces / Contracts

```ts
type AdminPageTemplateProps = {
  pageKey: AdminPageKey;
  variant?: "workspace" | "placeholder";
  headerAction?: React.ReactNode;
  sections?: string[];
  children?: React.ReactNode;
};
```

No new repository, API, or server-action contract is added.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Static quality | New server component imports and template prop changes | `pnpm lint` and `pnpm exec tsc --noEmit` |
| Manual integration | `/es/admin`, `/es/admin/programs`, `/es/admin/programs/new`, `/es/admin/programs/{id}/edit` | Confirm real summaries, clearer workspace framing, and explicit preview-only messaging |
| Manual regression | `/es/admin/applications`, `/es/admin/applications/{id}` | Confirm inbox/detail behavior still matches the shipped admin-application flow |

## Migration / Rollout

No migration required.

## Open Questions

- [ ] Should the dashboard secondary panel show only recent applications, or mixed recent programs and applications?
- [ ] Should preview-route copy use “Preview workspace” or “Draft workspace” in Spanish?
