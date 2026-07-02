# Public Page Presentation Specification

## Purpose

Define the approved Module 3 About, Impact, and Privacy refresh as a combined editorial layout update plus page-local localized content-contract reshaping.

## Requirements

### Requirement: Keep Module 3 public routing and shell behavior stable

The system MUST keep `/[locale]/about`, `/[locale]/impact`, and `/[locale]/privacy` as localized server-rendered public pages inside the shared public shell, and MUST keep localized metadata sourced from each page namespace.

#### Scenario: Visitor opens a localized Module 3 page

- GIVEN a visitor opens `/es/about`, `/es/impact`, or `/es/privacy`
- WHEN routing, metadata, and page rendering resolve
- THEN the page MUST render inside the existing public shell
- AND the localized title and description MUST still come from that page's messages

### Requirement: Support the reshaped About, Impact, and Privacy message contracts

The system MUST allow these pages to use page-specific localized structures under `Pages.about`, `Pages.impact`, and `Pages.privacy`. About MUST support `history`, `mission`, and `methodology`; Impact MUST support `story`, `testimonials`, `gallery`, and `principles`; Privacy MUST support `intro`, `sections`, and `commitments`.

#### Scenario: About content renders from nested sections

- GIVEN localized About messages expose `history`, `mission`, and `methodology`
- WHEN `/es/about` renders
- THEN the page MUST present those three institutional sections
- AND each section MAY iterate nested milestones, pillars, or steps

#### Scenario: Impact and Privacy render from reshaped content groups

- GIVEN localized Impact and Privacy messages expose the approved nested groups
- WHEN `/es/impact` and `/es/privacy` render
- THEN the pages MUST read from those page-local groups without adding dynamic data sources
- AND the result MUST remain static informational content

### Requirement: Present the three pages in a lighter editorial reading flow

The system SHOULD present About, Impact, and Privacy with a more open reading rhythm that reduces repeated boxed treatments while preserving clear hierarchy for long-form informational content.

#### Scenario: Visitor scans refreshed long-form content

- GIVEN a visitor scans one of the refreshed Module 3 pages
- WHEN they move through its major sections
- THEN headings and grouping MUST keep the page structure understandable
- AND the layout SHOULD emphasize spacing, lists, timelines, or split text blocks over repeated card grids

### Requirement: Keep the refresh page-local and informational

The system MUST keep this change limited to Module 3 About, Impact, and Privacy, and MUST NOT introduce CTA-first conversion behavior, forms, analytics interactions, broader shell redesign, or localization-model changes outside these three page namespaces.

#### Scenario: Reviewer checks scope boundaries

- GIVEN the Module 3 refresh is reviewed
- WHEN changed files and rendered pages are inspected
- THEN the change MUST remain confined to the three page components and their page-local messages
- AND the pages MUST remain informational rather than workflow-driven

### Requirement: Keep the Privacy commitments accent valid and non-legalistic

The system MUST render the Privacy `commitments` section with a valid accent treatment, and MUST keep `/[locale]/privacy` as plain-language guidance rather than a formal consent or compliance workflow.

#### Scenario: Visitor reads the refreshed Privacy commitments block

- GIVEN `/es/privacy` includes the commitments section
- WHEN the accent block renders
- THEN the styling MUST resolve without malformed class output
- AND the content MUST still describe informational privacy guidance only
