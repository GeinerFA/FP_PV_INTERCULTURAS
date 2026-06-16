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

### Requirement: Bilingual section parity

The system SHOULD keep the same section structure and visitor actions across Spanish and English home variants, and MAY use temporary fallback copy only while English text is pending manual review.

#### Scenario: Locale switch preserves home information structure

- GIVEN the home content exists for Spanish and English
- WHEN the visitor changes locale on the home page
- THEN both locale variants expose the same section order and action targets
- AND any temporary fallback remains inside the matching section instead of removing content
