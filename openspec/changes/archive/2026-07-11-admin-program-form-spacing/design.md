# Design: Admin Program Form Spacing

## Technical Approach

Keep the existing shell-local vertical-spacing refinement in `src/features/programs/components/admin-program-form-shell.tsx` and extend it with truthful required-field markers. The UI should annotate only fields that the publish path actually enforces through `validateProgramSnapshotForPublish` in `src/validators/program.ts`, while preserving current draft-save behavior in `src/app/[locale]/admin/programs/actions.ts`. No route, persistence, or workflow behavior changes are needed.

## Architecture Decisions

| Decision | Options | Choice / Rationale |
|---|---|---|
| Required-source-of-truth | Hardcoded UI labels vs validator-aligned helper | Add a small exported publish-required field contract in `src/validators/program.ts` and consume it from the shell. The marker list should follow the same publish rules that already require slug, cover image, public text, public arrays, SEO copy, and localized operational text. |
| Marker scope | Mark every visible control vs only publish-required user inputs | Mark only user-entered fields enforced at publish: title, short/full description, location, duration, availability, cover image, requirements, included, SEO title/description, and slug. Do not mark category (`defaultValue="volunteer"`), featured (`defaultChecked={false}`), or read-only editorial metadata. |
| Visual treatment | Inline `*` only vs reusable badge + legend | Use a small reusable label adornment in `admin-program-form-shell.tsx` plus a short legend/assistive copy from `messages/es.json`. This keeps the vertical layout intact and makes the meaning explicit without implying new validation rules. |
| Change boundary | Shared admin primitive changes vs shell + local copy only | Keep the implementation local to the program form shell and its translations. `AdminWorkspaceSection` already frames sections correctly; this amendment is about field labeling, not shared layout primitives. |

## Data Flow

`AdminProgramFormShell`
→ reads publish-required field metadata from `src/validators/program.ts`
→ renders label marker / legend using `AdminProgramForm` translations
→ submits unchanged form payload to existing server actions
→ publish path still validates the snapshot in repository code via `validateProgramSnapshotForPublish`

The UI mirrors publish validation; it does not replace it.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/features/programs/components/admin-program-form-shell.tsx` | Modify | Preserve the current roomier spacing classes, add a small required-marker presentation helper, annotate only publish-required labels, and place a compact legend near the public-content intro/workflow copy. |
| `src/validators/program.ts` | Modify | Export a narrow publish-required field contract/helper so the shell can follow real publish validation without duplicating ad hoc assumptions. |
| `messages/es.json` | Modify | Add `AdminProgramForm` copy for the required badge/legend text. |
| `openspec/changes/admin-program-form-spacing/design.md` | Modify | Record the amended design. |

## Interfaces / Contracts

Add a UI-facing validator export only, for example a readonly field-key set or helper that answers whether a form field is publish-required. No action signatures, route contracts, or stored program shapes change.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Static/type | The shell and validator helper compile after the new shared contract is introduced | `pnpm lint`, `pnpm exec tsc --noEmit` |
| Manual UI | Create and edit screens remain vertical and roomy, and only publish-required public fields show the marker | Browser review on `/[locale]/admin/programs/new` and `/[locale]/admin/programs/{id}/edit` |
| Publish regression | Marker presence matches real publish behavior for slug, cover image, public content, and SEO fields while draft-only/defaulted controls remain unmarked | Manual admin smoke test with save draft + publish attempts |

## Migration / Rollout

No migration required.

## Open Questions

- [ ] None.
