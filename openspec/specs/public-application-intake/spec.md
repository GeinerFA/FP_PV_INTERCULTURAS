# Public Application Intake Specification

## Purpose

Define the shipped Spanish-only `/apply` intake flow, including the current field surface, selector constraints, optional curriculum upload, and success gating.

## Requirements

### Requirement: Collect the shipped general intake fields

The system MUST expose one Spanish-only public intake form at `/es/apply` with required `firstName`, `lastName`, `email`, `phone`, `phoneDialCode`, `nationality`, and `birthDate`, plus optional `message` and optional `curriculum`. The system MUST NOT require program selection or expose an English runtime intake.

#### Scenario: Submit a complete application with or without optional fields

- GIVEN a visitor opens `/es/apply`
- WHEN they submit all required fields and may omit `message` and attach at most one curriculum file
- THEN the system MUST send one general intake application for persistence
- AND the visitor MUST reach `/es/apply/success` only after the submission is accepted

#### Scenario: Canonicalize unsupported locale intake paths

- GIVEN a visitor opens `/en/apply` or another unsupported locale-prefixed intake path
- WHEN routing resolves the request
- THEN the system MUST redirect the visitor to the equivalent `/es/...` path

### Requirement: Enforce selector-backed and file validation rules

The system MUST require `nationality` to come from the supported searchable selector, SHOULD let visitors choose `phoneDialCode` from the supported searchable selector, MUST treat `message` as optional, and MUST accept curriculum only as optional PDF, DOC, or DOCX files up to 5 MB.

#### Scenario: Reject incomplete or invalid intake data

- GIVEN a visitor is on `/es/apply`
- WHEN they submit missing required fields, an unsupported nationality, or an invalid curriculum file
- THEN the system MUST reject the submission
- AND the form MUST show actionable validation feedback without creating an application

### Requirement: Gate success confirmation to accepted submissions

The system MUST show `/es/apply/success` only for an accepted submission and MUST redirect visitors back to `/es/apply` when no accepted submission cookie is present.

#### Scenario: Block direct success access without an accepted submission

- GIVEN no accepted submission is associated with the visitor
- WHEN they open `/es/apply/success`
- THEN the system MUST NOT show the success confirmation
- AND the visitor MUST be redirected to `/es/apply`
