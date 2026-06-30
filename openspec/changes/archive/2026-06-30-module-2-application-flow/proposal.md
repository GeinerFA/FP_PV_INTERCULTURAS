# Proposal: Module 2 Application Flow

## Intent
Align Module 2 with the shipped Spanish-only MVP: public intake, Atlas-compatible persistence, optional curriculum handling, and a consistent admin-shell path back to the public home.

## Scope
### In Scope
- `/es/apply` intake with first name, last name, email, phone + dial code, nationality, birth date, optional message/comment, and optional curriculum upload.
- Submission flow that validates fields, accepts optional PDF/DOC/DOCX curriculum files up to 5 MB, writes `volunteering`, and gates `/es/apply/success` with the submission cookie.
- Atlas-backed create/read/update behavior in `fp_pv_interculturas.applications`, preserving legacy-compatible dates and status history for `pending`, `in_process`, `resolved`, and `cancelled`.
- A single global admin navigation affordance in `admin-shell`: one top-left home button with a house icon on all admin pages, linking back to the public home.
- Admin inbox, detail, status update, and curriculum download at `/es/admin/applications/[id]/curriculum`.

### Out of Scope
- Program-specific selection, multi-type intake, or English runtime beyond redirecting to `/es`.
- Changes to Atlas validators, collection ownership, or the legacy `volunteering` contract.
- Auth hardening, CAPTCHA, email notifications, reporting, extra attachments, filters, analytics, or additional admin navigation redesign.

## Capabilities
### New Capabilities
- `public-application-intake`: Spanish-only intake, validation with optional message/comment, optional curriculum upload, and success confirmation.
- `application-persistence`: Atlas-compatible write/read behavior, status history, curriculum storage, and normalization.
- `admin-application-operations`: admin inbox, detail, status updates, curriculum retrieval, and access to the shared return-home control.

### Modified Capabilities
- None.

## Approach
Keep one vertical slice around the current Atlas contract and localized routing. Move the return-home behavior from application-specific surfaces to `src/components/layout/admin-shell.tsx` so every admin route inherits the same top-left house-icon link without broadening runtime language scope or persistence behavior.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `src/app/[locale]/(public)/apply/*` | Modified | Public submit flow, optional message/comment, and success gating |
| `src/components/layout/admin-shell.tsx` | Modified | Shared top-left home navigation for all admin pages |
| `src/app/[locale]/admin/**` | Modified | Admin routes inherit the shared shell affordance |
| `src/features/applications/*`, `src/services/applications/*`, `src/models/*`, `src/types/*`, `src/validators/*` | New/Modified | Intake, persistence, validation, and curriculum handling |
| `messages/es.json`, `src/config/i18n.ts` | Modified | Spanish-only copy and locale contract |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Artifact drift from shipped behavior | Med | Treat the current implementation and Atlas contract as the source of truth |
| Global admin-shell button conflicts with page headers | Low | Use the confirmed shared insertion point and keep the control limited to one compact top-left icon button |
| Admin surface remains publicly reachable in MVP | High | Keep auth hardening explicitly out of scope for this change |

## Rollback Plan
Remove the shared admin-shell home button, restore application-specific admin navigation if needed, revert optional message/comment handling, remove curriculum handling, and stop this module from reading or writing the legacy applications collection.

## Dependencies
- Atlas connectivity for `fp_pv_interculturas.applications`.

## Success Criteria
- [ ] A user can submit `/es/apply` with or without a message/comment, optionally attach a curriculum, and reach `/es/apply/success` only after a successful write.
- [ ] New records persist `volunteering`, `pending`, compatible dates/history, and curriculum data when provided.
- [ ] Every admin page shows one top-left house-icon home button from the shared admin shell, linking back to the public home.
- [ ] Module 2 remains a Spanish-only general intake MVP without expanding into auth, reporting, or program-specific flows.
