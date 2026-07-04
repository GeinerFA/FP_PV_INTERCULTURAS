# Admin Application Operations Specification

## Purpose

Define the shipped Spanish admin inbox, detail review, curriculum retrieval, and status-update behavior for stored applications.

## Requirements

### Requirement: List submitted applications

The system MUST provide an admin application list at `/es/admin/applications` that exposes enough summary data to identify each applicant and their current persisted workflow status.

#### Scenario: View the application inbox

- GIVEN one or more applications exist
- WHEN an admin opens the applications list
- THEN the system MUST show applicant summary data, contact details, submitted timestamp, and current persisted status

#### Scenario: Show an empty inbox state

- GIVEN no applications exist
- WHEN an admin opens the applications list
- THEN the system MUST show an explicit empty state

### Requirement: Review, download curriculum, and update an application

The system MUST provide an application detail view with persisted applicant fields, current status, and status history. When curriculum data exists, the detail view MUST expose a dedicated download route. The system MUST allow status changes only to `pending`, `in_process`, `resolved`, or `cancelled`.

#### Scenario: Open application detail with curriculum metadata

- GIVEN an application exists
- WHEN an admin opens that application detail view
- THEN the system MUST show the persisted applicant data, current status, and persisted status history
- AND the system MUST show curriculum summary and a download affordance when curriculum is stored

#### Scenario: Download stored curriculum

- GIVEN an application has stored curriculum data
- WHEN an admin opens `/es/admin/applications/{id}/curriculum`
- THEN the system MUST return the stored file as a downloadable attachment

#### Scenario: Change application status

- GIVEN an admin is viewing an existing application
- WHEN they select another allowed persisted status
- THEN the system MUST save the new persisted status
- AND the updated status MUST be visible in both detail and list views

#### Scenario: Reject an unknown application identifier

- GIVEN an application identifier does not match a stored record
- WHEN an admin opens detail or curriculum download, or attempts a status change
- THEN the system MUST return a not-found outcome

### Requirement: Return from any admin page to the public home page

The system MUST expose one shared admin workspace shell on every admin page. The shell MUST keep one top-left home control that uses a house icon and returns the user to the active locale public home page. The same shell MUST also present the shared admin navigation so application routes remain operational inside the refined workspace.

#### Scenario: Navigate back to the public home page from an admin page

- GIVEN a user is on any admin page
- WHEN they activate the shared top-left house-icon home control
- THEN the system MUST navigate them to the active locale public home page

#### Scenario: Keep one consistent home control across admin routes

- GIVEN a user navigates between admin pages
- WHEN each page renders inside the shared admin shell
- THEN the system MUST show the same shared home control on every admin page

#### Scenario: Keep shared admin navigation around the applications flow

- GIVEN a user opens the applications list or an application detail route
- WHEN the shared admin shell renders
- THEN the system MUST show the same admin navigation model used by the dashboard and programs routes
- AND the application content MUST remain available inside that shared workspace
