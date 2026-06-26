# Public Application Intake Specification

## Purpose

Define the public `/apply` flow for the shipped general intake slice and its success gating.

## Requirements

### Requirement: Collect baseline applicant data

The system MUST present one Spanish-only public application form that collects the agreed baseline applicant fields for a general intake flow and MUST NOT require a program-specific selection during submission.

#### Scenario: Submit a complete general intake application

- GIVEN a visitor opens `/apply`
- WHEN they provide the required baseline applicant data and submit
- THEN the system MUST send one general intake application to the shared persistence capability
- AND the visitor MUST be redirected to the success confirmation flow only after the submission is accepted

#### Scenario: Show validation feedback for incomplete data

- GIVEN a visitor is on `/apply`
- WHEN they submit without required baseline applicant data
- THEN the system MUST reject the submission
- AND the form MUST show actionable validation feedback without creating an application

### Requirement: Gate success confirmation to accepted submissions

The system MUST show `/apply/success` only for an accepted submission and MUST keep or return the visitor to the intake flow when no accepted submission is present.

#### Scenario: Load success after accepted submission

- GIVEN an application was accepted for persistence
- WHEN the visitor reaches `/apply/success`
- THEN the system MUST show confirmation that the application was received

#### Scenario: Block direct success access without an accepted submission

- GIVEN no accepted submission is associated with the visitor
- WHEN they open `/apply/success`
- THEN the system MUST NOT show the success confirmation
- AND the visitor MUST be returned to the intake flow

#### Scenario: Handle submission failure

- GIVEN a visitor submits valid baseline applicant data
- WHEN the application cannot be accepted for persistence
- THEN the system MUST keep the visitor out of the success state
- AND the visitor MUST receive a recoverable submission error
