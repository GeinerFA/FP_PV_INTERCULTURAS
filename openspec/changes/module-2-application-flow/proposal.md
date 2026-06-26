# Proposal: Module 2 Application Flow

## Intent
Replace the MVP placeholders with one shipped intake slice that matches the approved legacy Atlas contract: public submission, persistence in `fp_pv_interculturas.applications`, and a minimal admin review loop.

## Scope
### In Scope
- Localized public `/apply` form using the confirmed baseline applicant fields.
- One general intake flow that always writes the legacy-compatible application type `volunteering`.
- Atlas-backed create/read/update flow in the existing `fp_pv_interculturas.applications` collection, including legacy BSON date/history shapes and persisted statuses `pending`, `in_process`, `resolved`, and `cancelled`.
- `/apply/success` confirmation plus admin inbox, detail, and status updates against that contract.

### Out of Scope
- Program-specific selection or multi-type intake expansion.
- Changes to Atlas validators, collection structure, or legacy data ownership.
- Auth.js/Google OAuth, admin hardening, CAPTCHA, email notifications, reporting, notes, attachments, filters, or analytics.

## Capabilities
### New Capabilities
- `public-application-intake`: localized intake form, submission lifecycle, and success confirmation.
- `application-persistence`: validation plus read/write compatibility with the existing Atlas applications contract.
- `admin-application-operations`: admin list, detail, and status update flow for submitted applications.

### Modified Capabilities
- None.

## Approach
Deliver one vertical slice around the real persistence contract, not a greenfield schema. Keep the intake general for users, map new writes to `volunteering`, and use the smallest shared service/repository/model layer needed to preserve legacy-compatible reads, writes, and status history.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `src/app/[locale]/(public)/apply/*` | Modified | Real form, submit action, and success flow |
| `src/app/[locale]/admin/applications/*` | Modified | Inbox and detail/status screens |
| `src/features/applications/*` | Modified/New | Shared public/admin UI around the shipped contract |
| `src/services/applications/*`, `src/models/*`, `src/types/*`, `src/validators/*`, `src/lib/*` | New/Modified | Legacy-compatible Atlas application domain and helpers |
| `messages/es.json` | Modified | Spanish-friendly status and form copy |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Artifact assumptions drift from the live contract again | Med | Anchor all behavior to the accepted Atlas collection contract |
| Admin route remains operationally public in the MVP | High | Keep auth hardening explicitly out of scope for this slice |

## Rollback Plan
Revert `/apply` and admin application routes to placeholders, remove the shared application wiring, and stop writing to the legacy collection from this module.

## Dependencies
- MongoDB Atlas connection and environment variable wiring for the existing `fp_pv_interculturas.applications` collection.

## Success Criteria
- [ ] A user can submit the localized `/apply` form and reach the success screen.
- [ ] New records are stored in `fp_pv_interculturas.applications` with type `volunteering` and legacy-compatible dates/history.
- [ ] Admin list/detail can read submitted applications and move them across `pending`, `in_process`, `resolved`, and `cancelled`.
- [ ] The slice stays general intake only, without expanding scope into auth, reporting, or program-specific flows.
