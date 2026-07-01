# Exploration: module-3-public-layout-refresh

## Exploration: module-3-public-layout-refresh

### Current State
`/[locale]/about`, `/[locale]/impact`, and `/[locale]/privacy` already exist as dedicated server-rendered Module 3 pages with localized metadata and static `messages/es.json` content. The functional capability is already shipped and archive-ready under `module-3-public-content-pages`; the current issue is presentation density. In code, the segmented feel comes from repeated `surface-soft` panels, multiple three-column card grids, nested framed sections, and uniform rounded/shadow treatment across all three page components. `PublicHomePage` and `PublicFaqPage` show the calmer editorial direction already present elsewhere in the public shell: more open text flow, bullets/timelines, and fewer boxed containers.

There is also a real implementation defect in the current Privacy component: the commitments section uses a malformed Tailwind arbitrary gradient string, so any refresh that touches that section should treat fixing it as part of the change rather than a separate capability.

### Affected Areas
- `src/features/public/components/public-about-page.tsx` — primary source of card-heavy mission and methodology layouts plus boxed history milestone wrapper.
- `src/features/public/components/public-impact-page.tsx` — intro story panel, testimonial tiles, gallery cards, and principles cards all stack boxed treatments.
- `src/features/public/components/public-privacy-page.tsx` — intro panel, three-card privacy sections, boxed commitments section, plus malformed gradient utility string.
- `messages/es.json` — likely unchanged structurally, but must be preserved as the content contract for the three pages.
- `src/app/[locale]/(public)/about/page.tsx` — route remains affected only indirectly because it owns metadata and delegates rendering.
- `src/app/[locale]/(public)/impact/page.tsx` — route remains affected only indirectly because it owns metadata and delegates rendering.
- `src/app/[locale]/(public)/privacy/page.tsx` — route remains affected only indirectly because it owns metadata and delegates rendering.
- `src/app/globals.css` — optional only if a tiny shared editorial utility meaningfully reduces duplication.

### Approaches
1. **Page-local editorial refactor** — Recompose the three page components with more open section flow, timeline/list patterns, lighter split layouts, and only one restrained accent surface per page.
   - Pros: Keeps scope tightly inside Module 3, preserves all current capabilities, avoids new abstractions, and matches the already approved direction.
   - Cons: Some repeated utility markup may remain across the three pages.
   - Effort: Medium

2. **Editorial refactor plus shared styling abstraction** — Do the same layout refresh, but extract a tiny shared utility class or repeated section pattern if duplication becomes obvious across all three pages.
   - Pros: Reduces repeated class strings if the new pattern stabilizes quickly.
   - Cons: Slightly higher risk of widening scope into shared styling decisions before the team validates this direction elsewhere.
   - Effort: Medium

3. **Content-model reshape before redesign** — Change message structures and component contracts to support a broader redesign system.
   - Pros: Could make future public-page expansion more systematic.
   - Cons: Wrong move for this request; it increases change surface and starts drifting into capability/model work even though the current problem is mostly composition polish.
   - Effort: High

### Recommendation
Use **Page-local editorial refactor** as the proposal baseline, with an **optional tiny shared utility** only if duplication becomes undeniable during implementation. The slug `module-3-public-layout-refresh` is good: it is scoped, descriptive, and clearly differentiates this follow-up from the already archive-ready capability change.

This follow-up likely does **not** need spec-level capability changes. The current specs already cover the required behavior: static localized About/Impact/Privacy pages with no CTA/conversion expansion. The requested work is presentation polish inside those existing contracts, so this should be treated as a new design/implementation follow-up change unless implementation reveals message-shape or route-contract changes.

### Risks
- The refresh could accidentally widen into broader public-shell redesign if shared patterns are over-generalized.
- Reducing boxes too aggressively could weaken hierarchy or readability on long privacy/informational sections.
- Privacy has a malformed gradient utility today; touching the section without correcting it would leave known styling debt behind.
- Because there is no automated visual regression coverage, acceptance still depends on manual browser review plus lint/typecheck/build.

### Ready for Proposal
Yes — ready for proposal as a scoped Module 3 follow-up. The proposal should explicitly state that this is a presentation-only refresh for About/Impact/Privacy, keeps content static/localized, adds no CTA/conversion behavior, and is expected to require no new or modified OpenSpec capabilities.
