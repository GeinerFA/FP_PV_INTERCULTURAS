# Admin Program Operations Specification

## Purpose

Define the first trustworthy admin workspace slice: a real admin landing page, a data-backed programs overview, and honest non-persistent create/edit framing.

## Requirements

### Requirement: Show a real admin landing dashboard

The system MUST provide `/[locale]/admin` as an operational dashboard instead of placeholder-only copy. The dashboard MUST summarize both application workload and program catalog state using existing data and MUST provide direct navigation to the corresponding admin areas.

#### Scenario: Open the admin landing page
- GIVEN the admin workspace is available
- WHEN a user opens `/[locale]/admin`
- THEN the page MUST show at least one applications summary and one programs summary based on current data
- AND the page MUST expose direct navigation to applications and programs management

#### Scenario: Handle zero-state operational data honestly
- GIVEN there are no applications, no programs, or both
- WHEN the dashboard renders
- THEN the page MUST show explicit zero-state summaries
- AND it MUST NOT describe unavailable metrics or protected workflows as already active

### Requirement: Present programs as an operational overview

The system MUST provide `/[locale]/admin/programs` as a real overview over existing program records. The page MUST show scan-friendly program rows with title, category, publication status, featured state, availability, and an edit entry point. It SHOULD favor dense readable summaries over placeholder cards or generic future-facing copy.

#### Scenario: Review the programs overview
- GIVEN one or more programs exist
- WHEN a user opens `/[locale]/admin/programs`
- THEN the page MUST show catalog summary metrics and one row per existing program
- AND each row MUST expose the shipped operational fields plus an edit route for that program

#### Scenario: Review an empty programs overview
- GIVEN no programs exist
- WHEN a user opens `/[locale]/admin/programs`
- THEN the page MUST show an explicit empty overview state
- AND it MUST still expose the create entry point without implying persistence already exists

### Requirement: Keep program create and edit routes honestly non-persistent

The system MUST keep `/[locale]/admin/programs/new` and `/[locale]/admin/programs/{id}/edit` available as preview workspaces over the current program shape. These routes MUST show whether the user is creating or editing, MUST load existing program data for valid edit identifiers, MUST reject unknown edit identifiers with not-found behavior, and MUST NOT claim that save, publish, or auth-backed actions are already implemented.

#### Scenario: Open the create workspace
- GIVEN a user opens `/[locale]/admin/programs/new`
- WHEN the page renders
- THEN the system MUST present a create-oriented workspace
- AND it MUST clearly indicate that persistence is not yet available

#### Scenario: Open the edit workspace for an existing program
- GIVEN a stored program identifier exists in the current catalog source
- WHEN a user opens `/[locale]/admin/programs/{id}/edit`
- THEN the system MUST show that program's current data in an edit-oriented workspace
- AND it MUST clearly indicate that edits are not yet persisted

#### Scenario: Reject an unknown program edit identifier
- GIVEN a program identifier does not match the current catalog source
- WHEN a user opens `/[locale]/admin/programs/{id}/edit`
- THEN the system MUST return a not-found outcome
