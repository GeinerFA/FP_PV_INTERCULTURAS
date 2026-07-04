# Public Site Shell Specification

## Purpose

Define the shared localized shell used across public routes.

## Requirements

### Requirement: Shared localized public navigation and footer

The system MUST use a shared public shell across localized public routes with organization identity, localized navigation labels, and footer information suitable for visitor-facing pages.

#### Scenario: Public page renders inside the shared shell

- GIVEN a visitor opens any localized public route
- WHEN the page renders
- THEN the header and footer use the shared public shell
- AND navigation labels are shown in the active locale

### Requirement: Contact action targets the home anchor

The system MUST treat Contact us as a home-page jump target instead of a separate destination page, and cross-page contact actions MUST send visitors to the localized home contact anchor.

#### Scenario: Contact action from home scrolls to contact section

- GIVEN a visitor is already on the localized home page
- WHEN the visitor activates Contact us
- THEN the system jumps to the contact section near the bottom of that page

#### Scenario: Contact action from another public page returns to home anchor

- GIVEN a visitor is on a different localized public page
- WHEN the visitor activates Contact us
- THEN the system routes to the same locale home URL with the contact anchor
- AND the destination lands in the contact section instead of a standalone contact page

### Requirement: FAQ visibility in public navigation

The system SHOULD expose the FAQs destination in shared public navigation so visitors can reach common guidance without depending only on home-page content.

#### Scenario: Visitor finds FAQs from shared navigation

- GIVEN a visitor is on any localized public page
- WHEN the visitor scans the shared navigation
- THEN an FAQs destination is available in that locale
- AND selecting it routes to the localized FAQs page
