# Proposal: module-5-admin-program-workspace

## Intent
Create a truthful localized admin workspace by protecting `/[locale]/admin` with Google-only access and by turning Programs into a real draft/publish workflow without exposing unfinished edits on the public site.

## Scope
### In Scope
- Google-only login for `/[locale]/admin`, limited to one env-configured admin email with verified Google email and redirect-back to the originally requested admin route.
- Persisted Programs admin workspace with create, edit, archive/reactivate, draft review, and explicit publish behavior.
- Keep dashboard and applications admin routes operational behind the same admin boundary.

### Out of Scope
- Inline editing on public pages in this phase.
- Physical delete, multi-admin IAM, or full version history.
- Public release of program edits without an explicit Publish action.

## Capabilities
### New Capabilities
- `admin-access-control`: Google-authenticated admin entry, session, redirect, and logout rules for localized admin routes.

### Modified Capabilities
- `admin-program-operations`: replace non-persistent program flows with persisted draft/publish/archive rules.
- `admin-application-operations`: require existing application review routes to stay usable only inside the protected admin workspace.

## Approach
- Enforce admin access before rendering `/[locale]/admin`; allow only the env-approved Google account and preserve the requested route through login.
- Add persisted Program state supporting `draft`, `published`, and `archived`; archived programs return public 404 and reactivate as `draft`.
- Model editing so published programs keep their live public version until an explicit Publish applies one pending draft; allow only one pending draft per program and no full history.
- Require complete public-facing fields before publish and lock slug changes after first publish.

## Affected Areas
| Area | Impact | Description |
|---|---|---|
| `src/app/[locale]/admin/**`, `src/proxy.ts` | Modified | Localized Google admin boundary and redirect handling |
| `src/components/layout/admin-shell.tsx` | Modified | Auth-aware admin shell/logout state |
| `src/app/[locale]/admin/programs/**`, `src/features/programs/components/**` | Modified | Real program workspace and publish/archive UX |
| `src/services/programs/**`, `src/types/program.ts`, `src/validators/program.ts`, `src/models/program.ts` | Modified/New | Persisted program lifecycle, immutable slug, completeness checks |
| `src/app/[locale]/admin/applications/**`, `src/features/applications/components/**` | Modified | Existing applications flow under the same guard |

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Auth/session scope leaks outside admin routes | Medium | Keep enforcement admin-only and locale-aware |
| Draft/live split complicates program reads | Medium | Preserve a clear public-read contract for published data only |
| Archive/publish rules expand implementation size | Medium | Keep one-draft limit and skip version history/public inline editing |

## Rollback Plan
Revert the admin auth boundary, detach program persistence/draft logic, and restore the current non-persistent program workspace while keeping locale routing intact.

## Dependencies
- Google OAuth setup and env values for allowed admin email and session secrets.
- Mongo write access for program persistence.

## Success Criteria
- [ ] Anonymous or non-approved users cannot access `/[locale]/admin`, and approved login returns to the requested admin route.
- [ ] Admins can create, edit, archive, reactivate, and publish programs with one pending draft per program.
- [ ] Published program edits stay off the public site until explicit Publish; archived programs resolve to public 404 and reactivate as draft.
- [ ] Existing admin application review routes remain available behind the same admin boundary.
