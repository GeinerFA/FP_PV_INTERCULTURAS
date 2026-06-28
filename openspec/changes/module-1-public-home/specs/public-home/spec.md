# Public Home Specification

## Purpose

Define the localized landing experience for `/[locale]` as the primary public entry for the MVP.

## Requirements

### Requirement: Localized home narrative and actions

The system MUST replace the placeholder home with a localized landing page that presents the organization story, history, offerings, one flexible information block, featured programs, clear actions to programs, apply, and FAQs, and a contact section near the bottom of the page.

#### Scenario: Visitor sees the full localized landing flow

- GIVEN a visitor opens `/{locale}`
- WHEN the home page renders
- THEN the page shows the required sections in the active locale
- AND the actions to programs, apply, FAQs, and contact are clearly visible in the public flow

#### Scenario: Featured programs are unavailable

- GIVEN the home page cannot resolve any featured published programs
- WHEN the landing page renders
- THEN the story, history, offerings, flexible block, actions, and contact section MUST still render
- AND the featured area MUST provide a localized path to browse programs without failing the page

### Requirement: Spanish-only active locale surface

The system MUST treat Spanish as the only active public locale surface for this MVP slice, and MUST NOT normalize unsupported locale home URLs into the Spanish runtime.

#### Scenario: Visitor opens a supported public home URL

- GIVEN a visitor opens `/es`
- WHEN the home page renders
- THEN the localized Spanish home experience is available
- AND its actions stay within the supported Spanish public flow

#### Scenario: Visitor opens an unsupported locale home URL

- GIVEN a visitor opens a home URL under an unsupported locale prefix
- WHEN the request reaches the runtime middleware
- THEN the request MUST NOT be rewritten or redirected to the supported Spanish path
- AND the unsupported locale URL remains unsupported unless a future change restores that compatibility
