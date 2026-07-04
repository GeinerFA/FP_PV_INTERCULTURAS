# Public FAQs Specification

## Purpose

Define the dedicated localized FAQ page for common public questions.

## Requirements

### Requirement: Dedicated localized FAQ page

The system MUST provide a dedicated FAQs page for each supported locale, separate from the home page, and the page MUST be reachable from the home actions and shared public navigation.

#### Scenario: Visitor opens FAQs from the public flow

- GIVEN a visitor is on a public page in a supported locale
- WHEN the visitor follows the FAQs action
- THEN the system routes to the localized FAQs page
- AND the page presents FAQ content without leaving the public site shell

### Requirement: FAQ guidance and recovery actions

The FAQs page MUST present localized question-and-answer content and SHOULD provide clear next actions to programs, apply, or contact when an answer does not fully resolve the visitor's need.

#### Scenario: FAQs include next-step guidance

- GIVEN FAQ entries are available for the active locale
- WHEN the visitor reviews the page
- THEN each entry is shown in the active locale
- AND the page exposes clear routes back to programs, apply, or contact

#### Scenario: Locale has no FAQ entries yet

- GIVEN the active locale has no FAQ entries configured
- WHEN the visitor opens the FAQs page
- THEN the page MUST render a localized empty-state message instead of failing or returning 404
- AND it MUST still provide actions to programs, apply, or contact
