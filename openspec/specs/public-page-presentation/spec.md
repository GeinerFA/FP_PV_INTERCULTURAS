# Public Page Presentation Specification

## Purpose

Define the approved Module 3 About and Impact refresh as a combined editorial layout update plus page-local localized content-contract reshaping.

## Requirements

### Requirement: Keep Module 3 public routing and shell behavior stable

The system MUST keep `/[locale]/about` and `/[locale]/impact` as localized server-rendered public pages inside the shared public shell, and MUST keep localized metadata sourced from each page namespace.

#### Scenario: Visitor opens a localized Module 3 page

- GIVEN a visitor opens `/es/about` or `/es/impact`
- WHEN routing, metadata, and page rendering resolve
- THEN the page MUST render inside the existing public shell
- AND the localized title and description MUST still come from that page's messages

### Requirement: Support the reshaped About and Impact message contracts

The system MUST allow these pages to use page-specific localized structures under `Pages.about` and `Pages.impact`. About MUST support `history`, `mission`, and `methodology`; Impact MUST support `story`, `testimonials`, `gallery`, and `principles`.

#### Scenario: About content renders from nested sections

- GIVEN localized About messages expose `history`, `mission`, and `methodology`
- WHEN `/es/about` renders
- THEN the page MUST present those three institutional sections
- AND each section MAY iterate nested milestones, pillars, or steps

#### Scenario: Impact renders from reshaped content groups

- GIVEN localized Impact messages expose the approved nested groups
- WHEN `/es/impact` renders
- THEN the page MUST read from those page-local groups without adding dynamic data sources
- AND the result MUST remain static informational content

### Requirement: Present the two pages in a lighter editorial reading flow

The system SHOULD present About and Impact with a more open reading rhythm that reduces repeated boxed treatments while preserving clear hierarchy for long-form informational content.

#### Scenario: Visitor scans refreshed long-form content

- GIVEN a visitor scans one of the refreshed Module 3 pages
- WHEN they move through its major sections
- THEN headings and grouping MUST keep the page structure understandable
- AND the layout SHOULD emphasize spacing, lists, timelines, or split text blocks over repeated card grids

### Requirement: Keep the refresh page-local and informational

The system MUST keep this change limited to Module 3 About and Impact, and MUST NOT introduce CTA-first conversion behavior, forms, analytics interactions, broader shell redesign, or localization-model changes outside these two page namespaces.

#### Scenario: Reviewer checks scope boundaries

- GIVEN the Module 3 refresh is reviewed
- WHEN changed files and rendered pages are inspected
- THEN the change MUST remain confined to the two page components and their page-local messages
- AND the pages MUST remain informational rather than workflow-driven
