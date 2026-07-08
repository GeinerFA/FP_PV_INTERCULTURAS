# admin-access-control Specification

## Purpose

Protect all `/[locale]/admin` routes with one shared Google-backed admin session.

## Requirements

### Requirement: Guard the shared admin workspace

The system MUST require one Google sign-in for the whole `/[locale]/admin` area. The account MUST match the single allowed admin email from environment configuration, the Google email MUST be verified, and successful sign-in MUST return the user to the originally requested admin route.

#### Scenario: Redirect into the shared login flow
- GIVEN an unauthenticated user requests any admin route
- WHEN the route is evaluated
- THEN the system MUST redirect to the admin login
- AND after valid sign-in it MUST return the user to that requested admin route

#### Scenario: Reject non-admin or unverified Google accounts
- GIVEN a user completes Google sign-in
- WHEN the email is unverified or does not equal the allowed admin email
- THEN the system MUST deny the admin session

### Requirement: Keep public pages public

The system MUST NOT require admin login for public routes. Public pages MAY remain readable to any visitor, but admin maintenance and CRUD controls MUST appear only inside an authenticated admin session.

#### Scenario: Open a public page while signed out
- GIVEN a visitor is not authenticated
- WHEN they open a public route
- THEN the page MUST remain visible
- AND admin-only controls MUST NOT be shown
