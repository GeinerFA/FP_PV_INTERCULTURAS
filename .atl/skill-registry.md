# Skill Registry

Generated: 2026-06-15
Project: fp_pv_interculturas
Registry Mode: openspec bootstrap with local registry index

## Scope Resolution

- Project skill directories scanned: none found
- Project convention files scanned: none found
- User skill directory scanned: `/home/ggfallas/.config/opencode/skills`
- Deduplication rule: project scope would override user scope; no project-local skills exist yet

## Indexed Skills

| Skill | Scope | Trigger | Path |
| --- | --- | --- | --- |
| branch-pr | user | Create Gentle AI pull requests with issue-first checks. Trigger: creating, opening, or preparing PRs for review. | `/home/ggfallas/.config/opencode/skills/branch-pr/SKILL.md` |
| chained-pr | user | Trigger: PRs over 400 lines, stacked PRs, review slices. Split oversized changes into chained PRs that protect review focus. | `/home/ggfallas/.config/opencode/skills/chained-pr/SKILL.md` |
| cognitive-doc-design | user | Design docs that reduce cognitive load. Trigger: writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs. | `/home/ggfallas/.config/opencode/skills/cognitive-doc-design/SKILL.md` |
| comment-writer | user | Write warm, direct collaboration comments. Trigger: PR feedback, issue replies, reviews, Slack messages, or GitHub comments. | `/home/ggfallas/.config/opencode/skills/comment-writer/SKILL.md` |
| go-testing | user | Trigger: Go tests, go test coverage, Bubbletea teatest, golden files. Apply focused Go testing patterns. | `/home/ggfallas/.config/opencode/skills/go-testing/SKILL.md` |
| issue-creation | user | Create Gentle AI issues with issue-first checks. Trigger: creating GitHub issues, bug reports, or feature requests. | `/home/ggfallas/.config/opencode/skills/issue-creation/SKILL.md` |
| judgment-day | user | Trigger: judgment day, dual review, adversarial review, juzgar. Run blind dual review, fix confirmed issues, then re-judge. | `/home/ggfallas/.config/opencode/skills/judgment-day/SKILL.md` |
| skill-creator | user | Trigger: new skills, agent instructions, documenting AI usage patterns. Create LLM-first skills with valid frontmatter. | `/home/ggfallas/.config/opencode/skills/skill-creator/SKILL.md` |
| skill-improver | user | Trigger: improve skills, audit skills, refactor skills, skill quality. Audit and upgrade existing LLM-first skills. | `/home/ggfallas/.config/opencode/skills/skill-improver/SKILL.md` |
| work-unit-commits | user | Plan commits as reviewable work units. Trigger: implementation, commit splitting, chained PRs, or keeping tests and docs with code. | `/home/ggfallas/.config/opencode/skills/work-unit-commits/SKILL.md` |

## Notes

- `sdd-*`, `_shared`, and `skill-registry` were intentionally excluded by registry rules.
- No project-local skills or convention index files exist yet under `.atl/`, `.opencode/`, `.claude/`, `.cursor/`, `.github/`, `.codex/`, `.qwen/`, `.kiro/`, `.openclaw/`, `.pi/`, `.agent/`, or `.agents/`.
- This registry is an index only; executors must read the referenced `SKILL.md` file as the source of truth.
