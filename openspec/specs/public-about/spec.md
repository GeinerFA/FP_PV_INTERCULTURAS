# Public About Specification

## Purpose

Define the shipped localized About page for institutional context.

## Requirements

### Requirement: Present institutional About content

The system MUST expose a localized `/[locale]/about` page that presents the organization's history, mission, and methodology as distinct institutional content, and MUST keep that page informational rather than conversion-led.

#### Scenario: Visitor reads the About page

- GIVEN a visitor opens `/es/about`
- WHEN the page renders
- THEN the page MUST present history, mission, and methodology content
- AND the content MUST read as institutional information instead of a CTA funnel

### Requirement: Reuse the localized public page conventions

The system MUST render `/[locale]/about` inside the shared public shell and MUST provide localized page metadata aligned with the About content.

#### Scenario: About page keeps shared public conventions

- GIVEN a visitor opens a localized About route
- WHEN routing and metadata resolve
- THEN the page MUST render inside the shared public shell
- AND the localized title and description MUST describe the About page
