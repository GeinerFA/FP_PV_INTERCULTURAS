# Application Persistence Specification

## Purpose

Define the shared application record, validation boundary, and legacy-compatible workflow lifecycle stored in MongoDB Atlas.

## Requirements

### Requirement: Persist compatible Atlas application records

The system MUST persist each accepted application in the existing `fp_pv_interculturas.applications` collection using the baseline applicant data plus system-managed fields required by that contract. New writes MUST store application type `volunteering`, current status `pending`, and legacy-compatible created, updated, and history date shapes.

#### Scenario: Create a new legacy-compatible application record

- GIVEN the public intake capability sends a valid application
- WHEN persistence accepts the submission
- THEN the stored record MUST include the submitted baseline data in the existing collection contract
- AND the record MUST initialize type `volunteering` and status `pending`

#### Scenario: Reject invalid application payloads

- GIVEN a submission is missing required baseline data or has invalid field values
- WHEN persistence validates the payload
- THEN the system MUST reject the write
- AND no partial application record MUST be stored

### Requirement: Maintain compatible workflow history

The system MUST keep the stored application status and status history compatible with the existing collection validator and SHALL support only `pending`, `in_process`, `resolved`, and `cancelled` as persisted statuses.

#### Scenario: Append legacy-compatible status history on status change

- GIVEN an existing application is moved to another allowed persisted status
- WHEN the change is accepted
- THEN the system MUST update the current stored status
- AND the stored history MUST append a legacy-compatible history entry for that transition

#### Scenario: Reject unsupported status values

- GIVEN a status update uses a value outside `pending`, `in_process`, `resolved`, and `cancelled`
- WHEN persistence validates the change
- THEN the system MUST reject the update
- AND the stored status and history MUST remain unchanged
