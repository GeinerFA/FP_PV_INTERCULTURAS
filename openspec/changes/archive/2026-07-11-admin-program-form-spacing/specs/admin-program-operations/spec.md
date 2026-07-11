# Delta for Admin Program Operations

## ADDED Requirements

### Requirement: Preserve a roomy vertical editing rhythm for program workspaces

The system MUST present `/[locale]/admin/programs/new` and `/[locale]/admin/programs/{id}/edit` as a single vertical editing workflow with clear spacing rhythm between workspace intro copy, section cards, and dense field clusters. The system MUST preserve the existing list-based reading order, MUST keep create and edit layouts visually consistent, and MUST add visible required-field markers only for user-entered fields that are actually required before publish. The system MUST NOT mark internal, auto-defaulted, or draft-optional controls as required, and MUST NOT introduce presentation changes that imply different business behavior.

#### Scenario: Review the create workspace spacing hierarchy
- GIVEN a user opens `/[locale]/admin/programs/new`
- WHEN the workspace renders
- THEN the form MUST read as one top-to-bottom flow with visibly separated intro, sections, and field groups
- AND adjacent dense inputs MUST have enough spacing to remain easy to scan without changing their order

#### Scenario: Review the edit workspace spacing hierarchy
- GIVEN a stored program identifier exists in the current catalog source
- WHEN a user opens `/[locale]/admin/programs/{id}/edit`
- THEN the workspace MUST keep the same vertical grouping and spacing rhythm used on the create route
- AND prefilled content MUST remain readable without collapsing nearby helper copy or controls

#### Scenario: Review required markers against publishable public fields
- GIVEN a user reviews the create or edit workspace before publishing
- WHEN the form labels are rendered for publish-required public content fields
- THEN the workspace MUST show a visible required marker for each user-entered field that publish validation requires
- AND fields that remain valid as drafts or are filled by internal/default behavior MUST NOT be marked as required

#### Scenario: Protect non-visual program behavior during spacing refinement
- GIVEN a user is comparing the create and edit workspaces before and after the spacing refinement
- WHEN they review workflow messaging, route meaning, and available actions
- THEN the system MUST preserve existing validation, persistence, and non-persistent messaging behavior
- AND the refinement MUST only change visual spacing, grouping emphasis, and scanability
