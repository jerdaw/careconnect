---
status: stable
last_updated: 2026-06-04
owner: jer
tags: [documentation, index, public-docs]
---

# Documentation Index

## Public Documentation Boundary

This repository contains public project documentation and reproducible development information. Deployment details, credentials, monitoring configuration, private operational notes, and environment-specific production paths are intentionally excluded from public documentation.

Shared-host documentation ownership and production deployment details are
maintained outside this public repository in private maintainer operations
notes.

## Quick Links

- [Architecture](architecture.md) - System design, data flow, and core concepts
- [Contributor Guide](../AGENTS.md) - Canonical contributor and agent instructions
- [AI Context](llms.txt) - Consolidated docs for LLMs (generated via `npx tsx scripts/generate-llms-txt.ts`; not tracked in git)
- [Deployment Boundary](deployment/direct-vps-proof.md) - Public deployment architecture notes
- [Public Documentation Boundary ADR](adr/022-public-documentation-boundary.md) - Decision record for public/private documentation split
- [Release Checklist](deployment/production-checklist.md) - Public-safe release verification checklist
- [Incident Response Overview](operations/incident-response-plan.md) - Public incident-response principles
- [Admin Operations Guide](operations/admin-operations-guide.md) - Current admin and partner ops surfaces
- [Database Change Safety](operations/database-migration-and-rollback.md) - Public DB change principles
- [International Privacy Notes](legal/international-privacy-compliance-notes.md) - Current privacy posture and boundaries

## Directories

| Directory                            | Purpose                                                             |
| ------------------------------------ | ------------------------------------------------------------------- |
| [`adr/`](adr/)                       | Architecture Decision Records                                       |
| [`api/`](api/)                       | API reference and OpenAPI spec                                      |
| [`audits/`](audits/)                 | Privacy, accessibility, and governance review notes                 |
| [`community/`](community/)           | Acknowledgments and community docs                                  |
| [`development/`](development/)       | Developer guides (testing, i18n, hooks, components)                 |
| [`deployment/`](deployment/)         | Public deployment architecture notes and local release checks       |
| [`governance/`](governance/)         | Standards, verification protocols, documentation guidelines         |
| [`implementation/`](implementation/) | Active implementation records, control docs, and execution evidence |
| [`legal/`](legal/)                   | AI/privacy risk notes, data licenses, and boundary statements       |
| [`planning/`](planning/)             | Roadmap, version planning, and archived versions                    |
| [`runbooks/`](runbooks/)             | Public troubleshooting summaries                                    |
| [`security/`](security/)             | Database security and breach response                               |
| [`templates/`](templates/)           | Standard document templates (ADR, guides, plans)                    |
| [`whitepapers/`](whitepapers/)       | Privacy architecture and research papers                            |

## Development Guides

- [Bilingual Guide](development/bilingual-guide.md) - Localization rules
- [Testing Guidelines](development/testing-guidelines.md) - Testing standards
- [Components](development/components.md) - Reusable UI components
- [Hooks](development/hooks.md) - Custom React hooks
- [Plain Language Guide](development/plain-language-guide.md) - Content accessibility

## Governance

- [Standards](governance/standards.md) - Verification levels (L0-L4)
- [Documentation Guidelines](governance/documentation-guidelines.md) - How to write docs
- [Verification Protocol](governance/verification-protocol.md)

## Audits

- [EDIA Audit](audits/2025-12-29-EDIA_AUDIT.md) - Equity, Diversity, Inclusion, Accessibility
- [Privacy Audit](audits/2025-12-29-privacy-technical-audit.md) - Privacy architecture review

## Planning & Roadmaps

- [Current Roadmap](planning/roadmap.md)
- [Archive](planning/archive/)
- [v22 Gate 0 Controls](implementation/v22-0-gate-0-exit-checklist.md)
