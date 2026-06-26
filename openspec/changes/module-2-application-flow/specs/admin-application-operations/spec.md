# Admin Application Operations Specification

## Purpose

Define the MVP admin inbox, application detail, and status update behavior for submitted applications stored under the accepted Atlas contract.

## Requirements

### Requirement: List submitted applications

The system MUST provide an admin application list that exposes submitted applications with enough summary data to identify the applicant and their current persisted workflow status.

#### Scenario: View the application inbox

- GIVEN one or more applications exist
- WHEN an admin opens the applications list
- THEN the system MUST show each application's identifying summary data and current persisted status

#### Scenario: Show an empty inbox state

- GIVEN no applications exist
- WHEN an admin opens the applications list
- THEN the system MUST show an explicit empty state

### Requirement: Review and update an application

The system MUST provide an application detail view with the persisted baseline fields, current persisted status, and status history, and MUST allow status changes only to `pending`, `in_process`, `resolved`, or `cancelled`.

#### Scenario: Open application detail

- GIVEN an application exists
- WHEN an admin opens that application detail view
- THEN the system MUST show the persisted applicant data, current persisted status, and persisted status history

#### Scenario: Change application status

- GIVEN an admin is viewing an existing application
- WHEN they select another allowed persisted status
- THEN the system MUST save the new persisted status
- AND the updated status MUST be visible in both detail and list views

#### Scenario: Reject an unknown application identifier

- GIVEN an application identifier does not match a stored record
- WHEN an admin opens detail or attempts a status change
- THEN the system MUST return a not-found outcome
