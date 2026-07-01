# Public Impact Specification

## Purpose

Define the shipped localized Impact page for public proof and storytelling.

## Requirements

### Requirement: Present testimonial-led impact content

The system MUST expose a localized `/[locale]/impact` page that highlights impact through testimonials and photos, and MUST keep the page static for this slice.

#### Scenario: Visitor reads impact proof

- GIVEN a visitor opens `/es/impact`
- WHEN the page renders
- THEN the page MUST include testimonial-led impact content
- AND the page MUST include photo-based storytelling content

### Requirement: Avoid conversion and analytics behavior on Impact

The system MUST NOT add CTA-first conversion behavior, submission flows, or dynamic analytics interactions to `/[locale]/impact` in this slice.

#### Scenario: Impact page remains static and informational

- GIVEN a visitor opens `/es/impact`
- WHEN they review the page
- THEN they MUST receive static informational content only
- AND the page MUST NOT require or invite a new conversion workflow
