# Application Persistence Specification

## Purpose

Define the shipped Atlas-backed application record, optional curriculum storage, and legacy-compatible read/write behavior.

## Requirements

### Requirement: Persist legacy-compatible application records

The system MUST persist each accepted application in `fp_pv_interculturas.applications` using the shipped public fields plus system-managed fields. New writes MUST store application type `volunteering`, current status `pending`, compatible BSON date fields, an initial status-history entry, preserve legacy-compatible message/comment behavior by accepting empty or omitted message content, and store curriculum metadata plus binary data when a curriculum is provided.

#### Scenario: Create a new compatible record

- GIVEN the public intake capability sends a valid application
- WHEN persistence accepts the submission
- THEN the stored record MUST include the submitted baseline fields in the existing collection contract
- AND the record MUST initialize `volunteering`, `pending`, compatible dates/history, optional message content, and optional curriculum data

#### Scenario: Accept a submission without a message

- GIVEN the public intake capability sends a valid application with no message/comment content
- WHEN persistence accepts the submission
- THEN the system MUST store a legacy-compatible record without rejecting the write for the missing optional message

#### Scenario: Reject invalid application payloads

- GIVEN a submission is missing required baseline data other than the optional message or has invalid field values
- WHEN persistence validates the payload
- THEN the system MUST reject the write
- AND no partial application record MUST be stored

### Requirement: Normalize legacy application reads

The system SHALL normalize legacy-compatible records on read so the current admin flow receives supported statuses, application type `volunteering`, and structured change-actor data even when older stored shapes differ.

#### Scenario: Read a legacy-shaped application

- GIVEN a stored record uses older values such as `general`, `in_review`, `finalized`, or string `changedBy`
- WHEN the application is read through the shared persistence capability
- THEN the system MUST return the normalized current shape
- AND unsupported legacy values MUST map to the shipped compatible equivalents

### Requirement: Maintain the shipped workflow states

The system MUST support only `pending`, `in_process`, `resolved`, and `cancelled` as current workflow states and MUST append a compatible status-history entry for each accepted status change.

#### Scenario: Append compatible status history on status change

- GIVEN an existing application is moved to another allowed status
- WHEN the change is accepted
- THEN the system MUST update the current stored status
- AND the stored history MUST append a compatible transition entry

#### Scenario: Reject unsupported status values

- GIVEN a status update uses a value outside the supported workflow states
- WHEN persistence validates the change
- THEN the system MUST reject the update
- AND the stored status and history MUST remain unchanged
