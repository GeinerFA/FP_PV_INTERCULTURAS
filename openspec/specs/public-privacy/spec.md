# Public Privacy Specification

## Purpose

Define the shipped localized Privacy page for basic visitor-facing data guidance.

## Requirements

### Requirement: Present basic privacy information

The system MUST expose a localized `/[locale]/privacy` page that explains, in simple visitor-facing language, the basic privacy handling relevant to the MVP public experience.

#### Scenario: Visitor reads the privacy page

- GIVEN a visitor opens `/es/privacy`
- WHEN the page renders
- THEN the page MUST explain basic privacy handling in simple language
- AND the page MUST remain understandable without legal expertise

### Requirement: Keep privacy scope informational

The system MUST treat `/[locale]/privacy` as an informational page, not a formal legal policy, and MUST NOT imply consent logging, compliance automation, or a broader legal workflow in this slice.

#### Scenario: Privacy page avoids legal-policy overreach

- GIVEN a visitor opens `/es/privacy`
- WHEN they read the page
- THEN the page MUST communicate informational privacy guidance only
- AND the page MUST NOT claim formal policy enforcement or consent recording
