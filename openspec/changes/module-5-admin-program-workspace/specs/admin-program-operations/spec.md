# Delta for admin-program-operations

## MODIFIED Requirements

### Requirement: Present programs as an operational overview

The system MUST provide `/[locale]/admin/programs` as a real overview over persisted program records. The page MUST show scan-friendly program rows with title, category, publication state, featured state, availability, and an edit entry point. Archived programs MUST remain visible in admin and MUST be clearly identified as archived. It SHOULD favor dense readable summaries over placeholder cards or generic future-facing copy.
(Previously: the overview described existing records honestly but still assumed non-persistent behavior and no archive workflow.)

#### Scenario: Review the programs overview
- GIVEN one or more programs exist
- WHEN an admin opens `/[locale]/admin/programs`
- THEN the page MUST show catalog summary metrics and one row per existing persisted program
- AND archived programs MUST remain listed with their archived state shown

#### Scenario: Review an empty programs overview
- GIVEN no programs exist
- WHEN an admin opens `/[locale]/admin/programs`
- THEN the page MUST show an explicit empty overview state
- AND it MUST still expose the create entry point

### Requirement: Keep program create and edit routes as persisted editorial workspaces

The system MUST provide `/[locale]/admin/programs/new` and `/[locale]/admin/programs/{id}/edit` as real persisted editorial workspaces. Programs MUST be editable only inside `/admin/programs` in this phase. The system MUST support one pending draft per program with no full version history, MUST separate Save from Publish, MUST forbid physical delete, MUST return archived public program routes as 404, MUST reactivate archived programs back to `draft`, MUST fail Publish when required public fields are incomplete, and MUST keep `slug` immutable after first publish. Saving edits to a published program MUST NOT update the live public version until Publish succeeds.
(Previously: these routes were honest non-persistent preview workspaces.)

#### Scenario: Open the create workspace
- GIVEN a user opens `/[locale]/admin/programs/new`
- WHEN the page renders
- THEN the system MUST present a create-oriented persisted workspace

#### Scenario: Open the edit workspace for an existing program
- GIVEN a stored program identifier exists
- WHEN a user opens `/[locale]/admin/programs/{id}/edit`
- THEN the system MUST show that program's current editable admin state

#### Scenario: Reject an unknown program edit identifier
- GIVEN a program identifier does not match a stored record
- WHEN a user opens `/[locale]/admin/programs/{id}/edit`
- THEN the system MUST return a not-found outcome

#### Scenario: Save pending edits for a published program
- GIVEN a program already has a published public version
- WHEN an admin saves edits without publishing
- THEN one pending draft MUST be stored for admin editing
- AND the last published public version MUST remain live

#### Scenario: Archive, reactivate, and publish with validation
- GIVEN an admin is editing an existing program
- WHEN they archive, reactivate, or publish it
- THEN archive MUST hide the public route with 404, reactivation MUST return status `draft`, and Publish MUST fail for incomplete required fields or slug changes after first publish
