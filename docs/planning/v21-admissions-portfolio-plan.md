# v21.0: Admissions Portfolio & Production Launch Plan

**Status**: PARTIALLY IMPLEMENTED — retained as admissions backlog; active execution is superseded by v22.0
**Priority**: CRITICAL
**Total Effort**: ~85–120 hours (mix of autonomous + human-required work)
**Timeline**: 12 weeks (4 phases)
**Dependencies**: v19.0 launch preparation documentation (complete ✅)
**Created**: 2026-02-25
**Last Updated**: 2026-03-11

---

## Methodology

This plan was developed through a structured three-pass analysis:

1. **Comprehensive improvement scan** — 30+ improvements identified across 7 admissions-relevant categories (Impact/Adoption, Leadership/Collaboration, Communication/Documentation, Professionalism/Governance, Privacy/Security/Ethics, Reliability/Quality, Scholarship/Evaluation)
2. **Devil's advocate pass** — Each item stress-tested for feasibility, actual admissions value, hidden risks, and effort accuracy
3. **Steelman pass** — Strongest honest case constructed for each item's inclusion
4. **Objective synthesis** — Items adjudicated, reframed, merged, dropped, or resequenced based on where the evidence pointed

---

## Current State Summary

**Purpose**: HelpBridge is a privacy-first, manually-curated social services search engine for Kingston, ON — covering food, housing, crisis, and health services for vulnerable residents.
**Target users**: Kingston residents in acute need, social workers, community organizations, and vetted service partners.
**Maturity**: Technically sophisticated and now publicly deployed at `https://helpbridge.ca` on the direct-VPS path, with production observability, circuit breaker patterns, privacy-by-design, and 7 locales. Real-world adoption evidence is still limited.
**Evidence of use**: Public live URL plus manual operations and smoke verification are now in place. 196 hand-curated services, 0 at L3 (provider-confirmed), advisory board charter written but 0 members recruited, and partner/user-testing work remains largely pending execution.
**Biggest gaps**: (1) limited adoption evidence, (2) zero real-world partnerships or endorsements, (3) advisory board exists only on paper, (4) no executed user research, (5) significant data quality holes (70% geocoded, 18% email coverage, 0% L3), (6) no external validation or community recognition.

### Strategic Insight

The project has exceptional documentation, governance design, and technical infrastructure. The credibility gap is now concentrated in **execution after launch** — limited usage evidence, no named partners, and no verified services at L3. The next action should be partner outreach, verification cycles, and user research, with v22.0 deciding how aggressively that work should proceed.

---

## Phase 0: Immediate Housekeeping

**When**: Today
**Effort**: <2 hours total
**Theme**: Eliminate the most visible credibility defects.

### P0-1. Add your real name and affiliation to acknowledgments

- **File**: `docs/community/acknowledgments.md`
- **Why**: The current placeholders (`[Your Name/GitHub]`, `[List Maintainers]`) mean the project you are using as a portfolio centerpiece is publicly anonymous.
- **Effort**: 5 min
- **Evidence**: Named individual on the project

### P0-2. Add effective date to privacy policy

- **What**: Add an "Effective Date: [date]" line to the public privacy policy page
- **Why**: A privacy policy without an effective date is technically non-compliant with PIPEDA. For a project explicitly claiming PIPEDA compliance, this is a self-undermining oversight.
- **Effort**: 5 min

### P0-3. Push git version tags to remote

- **Command**: `git push origin --tags`
- **Why**: Version tags (v10.0 through v19.0) are currently local-only. Publishing them creates a visible, timestamped record of 7+ weeks of systematic development on the GitHub Releases page.
- **Effort**: 15 min

### P0-4. Fix EDIA audit pending items

- **What**: Change person-first language in `data/services.json` — replace "Homeless men" / "Women who are homeless" with "People experiencing homelessness" in descriptions and eligibility notes. (Flagged in `docs/audits/2025-12-29-EDIA_AUDIT.md` as "Pending Fix".)
- **Why**: Must be fixed before any partner reviews the tool. Derogatory language in service descriptions undermines the equity claim.
- **Effort**: 30 min

### P0-5. Write first ABS draft as a gap analysis

- **What**: Draft the ~150-word OMSAS ABS entry now, as if submitting today. Identify which claims can be substantiated and which cannot.
- **Why**: This functions as an audit of the entire portfolio — it reveals exactly which evidence gaps remain and directly shapes which items to prioritize. Do this early, not last.
- **Effort**: 45 min
- **Note**: Personal document, not committed to repo.

**Exit criterion**: Your name is publicly on the project, obvious defects are fixed, and you know exactly which evidence gaps to close.

---

## Phase 1: Pre-Deployment Critical Path

**When**: Week 1
**Effort**: ~15–20 hours
**Theme**: Nothing goes live until crisis safety is formally verified.

### P1-1. Formalize crisis detection test protocol

- **What**: Document 20 crisis search scenarios with expected results (e.g., "I want to die" → 988 within top 3 results). Execute each scenario. Screenshot results. Fix any failures.
- **Why**: The crisis detection system is the project's most ethically significant feature. If it fails, a user in crisis could see food bank results instead of 988. This is a clinical safety issue, not a UX issue. Formally testing it before deployment is a safety prerequisite.
- **Output**: `docs/testing/crisis-detection-protocol.md` with scenarios, expected results, actual results, and screenshots.
- **Effort**: 4–6h
- **CanMEDS**: Health Advocate, Professional

### P1-2. Test critical-path components

- **What**: Write or verify tests for the 10–15 components in the crisis → search → results → service detail → contact action flow. Target 100% coverage on these components specifically — not an overall percentage target.
- **Why**: 56/85 components are untested. The overall 34% figure is a vanity metric. What matters is that the paths where failure could harm users are covered. A rendering failure in the CrisisAlert or ServiceCard component could leave someone in acute need looking at a blank screen.
- **Effort**: 8–12h

### P1-3. Fix geocoordinate gaps

- **What**: Run `npm run geocode` (requires `OPENCAGE_API_KEY`, free tier). Manually review edge cases. Document services that intentionally have no coordinates (confidential DV shelters, phone-only services, mobile outreach units) with a reason field.
- **Why**: 58/196 services are invisible in geographic "near me" results. This is a direct equity gap for people without transportation. Target: 85–90% coverage (not 95% — some absences are intentional).
- **Effort**: 2–4h

### P1-4. Public deployment baseline (completed 2026-03-11)

- **What happened**: The production baseline is now live at `https://helpbridge.ca` on the direct-VPS path documented in `docs/deployment/direct-vps-proof.md`.
- **Why it mattered**: The project now has a real public accountability surface and an operational release path from committed source, removing the largest "undeployed project" credibility gap.
- **Remaining follow-through**: Prepare a deliberate distribution list and outreach plan before treating the deployment as a broader launch event.
- **Evidence**: Public URL, VPS release helper, production checklist, and public health verification.
- **CanMEDS**: Health Advocate, Leader

### P1-5. Record demo video

- **What**: 2-minute Loom or YouTube (unlisted) walkthrough showing: homepage → crisis search ("I need help now") → results with 988 → service detail → French locale switch → accessibility mode. Have this ready before any outreach email.
- **Why**: Partners, advisors, and admissions reviewers can see the tool working in 2 minutes without running code. This is the single most efficient way to demonstrate the tool is real and polished.
- **Effort**: 30 min

**Exit criterion**: Live URL, crisis detection formally tested and documented, demo video ready for outreach.

---

## Phase 2: Governance Execution

**When**: Weeks 2–4
**Effort**: ~25–35 hours
**Theme**: Prove that every governance system you documented actually works in the real world.

### P2-1. Execute first verification cycle

- **What**: Select 20 services (10% of 196). Follow `docs/governance/verification-protocol.md`: call phone numbers, verify websites, check hours. Log results in a structured format (service ID, check date, outcome: confirmed/updated/flagged). Update `last_verified` timestamps. Write a brief cycle summary noting pass rate and corrections made.
- **Why**: The governance system is the project's most distinctive feature. An unexecuted governance framework is a proposal. An executed one is an operating service. That shift is the most important credibility threshold on this plan.
- **Output**: Verification cycle log, summary document, updated `services.json` timestamps.
- **Effort**: 4h
- **CanMEDS**: Professional

### P2-2. Targeted email research for L3 candidates

- **What**: Look up email addresses for the 30–40 services you plan to contact for L3 verification. Check "Contact Us" pages, staff directories.
- **Why**: 82% of services have no email in the database. You need emails to conduct L3 outreach (#P2-4). This is not a comprehensive data quality task — it's targeted infrastructure for the outreach campaign.
- **Effort**: 3h

### P2-3. Test Partner Portal claiming flow

- **What**: Create a test partner account and walk through the entire claiming workflow end-to-end. Document any issues found.
- **Why**: The L3 verification workflow requires the Partner Portal claiming feature (built in v17.4) to actually work. It has never been tested by a real external user. Finding bugs during a controlled test is far better than discovering them when a high-priority partner is your test case.
- **Effort**: 2h

### P2-4. Begin L3 outreach

- **What**: Contact 40–50 service organizations via email/phone using the verification protocol outreach script. Track status in `data/verification/l3-outreach-log.csv` (no PII — organization name, contact date, response status only).
- **Why**: 0/196 at L3 means the project's most important governance differentiator is entirely theoretical. Even 5 confirmed L3s transforms the narrative from "I designed a governance framework" to "I operate a governed community service."
- **Target**: 5–8 confirmed L3 verifications (expect 15–25% response rate from cold outreach).
- **Effort**: 8–12h over 2–3 weeks (ongoing)
- **Prereqs**: P2-2 (emails), P2-3 (portal tested)
- **CanMEDS**: Collaborator, Health Advocate

### P2-5. Complete French translations with native speaker review

- **What**: Run full translation pipeline (`npm run export:access-script-fr` → `translate:prompt` → LLM translate → `translate:parse` → `translate:validate`). Then have a native French speaker review the 15–20 most sensitive access scripts — crisis services, shelters, domestic violence resources, mental health services.
- **Why**: 0% of advanced French fields are filled. Francophone residents in crisis get English access scripts. This is a real equity gap. The tooling exists and the work is mechanical — but AI-translated crisis access scripts need human quality review before publishing. A mistranslated shelter access script could actively mislead a vulnerable user.
- **Effort**: 2 days (translation + review coordination)

### P2-6. Write 1-page project brief for professional referrers

- **What**: Purpose-built document for the question "Is this safe to recommend to my clients?" Cover: how crisis detection works, data governance model, what happens when information is wrong, who is responsible for accuracy, how to report issues. Include QR code to live URL. Fold in data provenance content (where data comes from, how it's maintained). This is NOT the press kit — it's designed for a social worker with 30 seconds to decide whether to look further.
- **Why**: The press kit tells the project's story. The project brief answers whether a professional can trust it. That question requires a different document.
- **Effort**: 2–3h

### P2-7. Launch impact page

- **What**: Create `/impact` or `/about/impact` page. Frame around **data quality and governance metrics**: number of services, categories, languages, verification level distribution, geocoding coverage, bilingual coverage, last verified date. Explicitly do NOT include usage metrics until you have 90+ days of meaningful traffic.
- **Why**: "196 verified services across 12 categories, 7 languages, X at L3 verification" is compelling on day 1 regardless of visitor count. A usage-metric-focused impact page with "47 searches" would backfire. Frame around information integrity.
- **Effort**: 3–4h

### P2-8. Set up public status page

- **What**: Upptime (free GitHub Action-based monitoring) or Better Uptime free tier. Monitor: homepage, `/api/v1/health`, search API. Publish at `status.helpbridge.ca` or similar.
- **Why**: A public status page signals that you accept accountability for service reliability. The signal of professional operation matters more than the specific uptime percentage at this stage.
- **Effort**: 2h

**Exit criterion**: First verification cycle documented. L3 outreach underway. French translations complete and reviewed. Partner outreach collateral ready (project brief + demo video). Impact page live.

---

## Phase 3: External Validation

**When**: Weeks 4–8
**Effort**: ~20–30 hours
**Theme**: Get your work reviewed and validated by people who aren't you.

### P3-1. Advisory board recruitment

- **What**: Identify one specifically credentialed person (social worker, health professional, or legal/ethics professional). Make a bounded, specific ask: "Would you review our AI compliance approach and provide written feedback?" (1-hour commitment, not open-ended board membership). If that goes well, formalize as advisory board appointment using the existing charter.
- **Why**: The advisory board charter is professionally designed. Having zero named members is a critical credibility gap. One credentialed reviewer transforms "I wrote a charter" into "I lead a governed organization." The project's governance docs (AI compliance audit, PIA, L-scale verification) make this ask unusually strong compared to typical student project cold emails.
- **Effort**: 2–4 weeks elapsed time
- **CanMEDS**: Leader, Collaborator

### P3-2. Structured professional feedback sessions

- **What**: Conduct walkthroughs with 3–5 front-line social workers or supervisors (not students). Frame as "professional consultation," not research — this avoids ethics review requirements. Provide 3–5 task scenarios ("Find a food bank open tomorrow," "Find crisis support for a teenager," "Find a French-language service"). Document: task completion, confusion points, professional assessment of the tool's fitness for client referral, suggestions. Write a 1–2 page findings summary with changes made in response.
- **Why**: Demonstrates evidence-based iteration — the Scholar CanMEDS role in practice. The process of testing → finding problems → fixing them is more valuable to admissions than any coverage metric. Using professional referrers (not students) makes the feedback credible and the results actionable.
- **Effort**: 1 week elapsed, 6–8h direct work
- **CanMEDS**: Scholar, Health Advocate

### P3-3. Community engagement meeting

- **What**: Request a 15-minute slot at a community organization's staff meeting or community health forum. Present the tool, demonstrate the crisis search flow, collect written feedback. Document: venue, date, organization, audience, feedback themes, any resulting connections.
- **Why**: Creates a public record of community engagement and a feedback loop from people with real client experience. More achievable than submitting to a conference (which may have deadlines months away). Builds the relationships needed for #P4-1 (partner endorsement).
- **Effort**: 2–3h prep + meeting
- **CanMEDS**: Communicator, Health Advocate

### P3-4. Incident response drill

- **What**: Simulate a scenario (e.g., "Service X's phone number goes dead and three users report it"). Walk through the existing runbook end-to-end. Document: scenario description, steps taken, duration, gaps found, runbook improvements made.
- **Why**: A documented drill shows operational maturity without requiring a real failure. Fire departments drill; pilots simulate emergencies; hospitals do mock codes. The artifact demonstrates safety culture directly valued in medical training.
- **Effort**: 1–2h

### P3-5. Targeted NVDA accessibility test

- **What**: Test the 5 most critical interactive flows with NVDA screen reader (free, Windows): crisis search, service detail page, search filters, language switcher, feedback form. Document pass/fail per flow. Fix any failures found.
- **Why**: Axe-core automated tests catch only ~30–40% of accessibility issues. Complex Radix UI components (modals, dropdowns) are prone to keyboard trap and ARIA failures that automated scanners miss. For a tool targeting people with disabilities, manual screen reader testing is the real test, not a CI badge.
- **Effort**: 1–2h

### P3-6. Publish PIA and AI compliance summaries

- **What**: Write plain-language summary pages for both the Privacy Impact Assessment and the AI Compliance Audit. Cover: what was assessed, what risks were identified, and how each was mitigated. Publish on the live site (e.g., `/legal/privacy-assessment`, `/legal/ai-governance`). Keep full technical documents (which are marked DRAFT and contain frank "CRITICAL" risk language) available on request rather than published directly.
- **Why**: Transparency about ethical risk assessment is extraordinarily rare for student projects. Publishing summaries communicates diligence without the risk of frank internal risk language being read out of context.
- **Effort**: 3h

### P3-7. Publish accessibility commitment statement

- **What**: Create a `/accessibility` page with ongoing commitments: annual manual accessibility review, 5-business-day response to accessibility feedback, keyboard navigation maintenance for all core functions. Use ongoing commitments, not dated milestones (which create compliance risk if missed).
- **Why**: AODA compliance is claimed throughout the project. A published accessibility commitment — even beyond legal requirements — demonstrates that accessibility is a value, not a checkbox.
- **Effort**: 2h

### P3-8. Identity tag systematic pass

- **What**: Check the 30–40 highest-priority services for public equity evidence (2SLGBTQI+ friendly, Indigenous-led, etc.). Tag where evidence exists with `evidence_url`. For services where evidence was sought and not found, document the negative finding. Per governance standards, no vibe-based tagging.
- **Why**: The governance standard requires evidence for every identity tag. Documenting where evidence was sought and not found is itself a community equity audit — it shows which Kingston organizations lack public equity commitments.
- **Effort**: 6–10h research

**Exit criterion**: At least one named external reviewer. Professional feedback documented with resulting improvements. Community engagement documented. Governance and accessibility commitments published.

---

## Phase 4: Evidence Portfolio

**When**: Weeks 8–12
**Effort**: ~25–35 hours
**Theme**: Collect the artifacts that make the OMSAS entry fully substantiable.

### P4-1. Partner endorsement letter

- **What**: After 4–6 weeks live, approach the organization you've had the most engagement with (advisory board member's org, an L3-confirmed partner, or the community org where you presented). Send the project brief + demo video. Specific ask: "Would you be willing to review our tool and provide a brief letter describing your assessment?"
- **Why**: The single highest-value external credential possible. An endorsement letter from a Kingston health or social service organization constitutes independent, professional validation. The project's governance documentation (PIA, AI compliance audit, L-scale verification, AODA compliance) gives organizations unusual confidence in a student-built tool.
- **Prerequisites**: Live deployment (#P1-4), L3 outreach started (#P2-4), community engagement (#P3-3). Do NOT approach for endorsement before these are complete.
- **Effort**: 2–4 weeks elapsed
- **CanMEDS**: Collaborator

### P4-2. Structural service gap analysis

- **What**: Using the 196-service dataset, identify: thin categories (1–2 services), underrepresented populations (few identity tags), geographic gaps within Kingston. Cross-reference with Statistics Canada demographic data for Kingston. Write a 1–2 page "Kingston Social Service Coverage Analysis." If 90+ days of search data is available, enhance with zero-results patterns.
- **Why**: This analysis is partially available today (structural gaps from data curation) and grows stronger with traffic data. It transforms the project from a directory into a health equity advocacy tool. Share with one community organization (KFLA Public Health, Kingston Social Planning Council).
- **Effort**: 4–6h
- **CanMEDS**: Health Advocate, Scholar

### P4-3. Volunteer verification pilot

- **What**: Recruit 2–3 volunteers (community members, Queen's students). Define role: 1–2 hours/month verifying 10 services each using the existing verification protocol. Provide a simple written volunteer agreement clarifying role and limitations. Set a defined 3-month trial period.
- **Why**: Even 2 volunteers change the category of what this project is — from "a solo developer's community tool" to "a community-operated service with a volunteer team." If the pilot proves unsustainable, a documented 3-month volunteer program is still a real accomplishment.
- **Effort**: 2h setup + 30 min/month coordination
- **CanMEDS**: Leader, Collaborator

### P4-4. Grant or recognition application

- **What**: Identify one Queen's university innovation program (Dunin-Deshpande Innovation Centre) or municipal recognition opportunity. Prepare and submit an application. The process produces a high-quality project narrative regardless of outcome.
- **Why**: The application exercise is a forcing function for articulating impact, governance, sustainability, and community benefit in a rigorous, externally-reviewed format. Queen's programs have faster timelines and higher credibility for a Queen's-affiliated applicant than provincial programs.
- **Effort**: 6–10h

### P4-5. OWASP ZAP passive scan

- **What**: Run a passive scan (not active — active scans generate too many false positives on Next.js apps) against the live URL. Document clean result or genuine findings. Do not publish a detailed remediation report unless you are confident in interpretation.
- **Why**: Independent external verification of security posture. For a tool serving people fleeing domestic violence or in suicidal crisis, security is not just technical — it's an ethical commitment. An external scan confirms the internal audit rather than relying solely on self-assessment.
- **Effort**: 2h

### P4-6. Non-profit formation document (conditional)

- **What**: Prepare Articles of Incorporation draft, proposed board structure, mission alignment with CRA charitable purposes. **Only do this if incorporating within 18 months is a genuine plan.** If the timeline is indefinite, skip this and describe governance without the incorporation framing.
- **Why**: If genuine, this demonstrates organizational leadership at a level that almost no student applicant reaches. The answer "I'm ensuring governance is sound before incurring legal and administrative obligations" is a strong, mature response to "why not filed yet?"
- **Effort**: 3–4h

### P4-7. Update ABS draft with collected evidence

- **What**: Revisit the Phase 0 gap analysis. Every claim should now be substantiable with documented evidence. Finalize the 150-word OMSAS entry.
- **Effort**: 2–3h

**Exit criterion**: At least one external endorsement on file. Service gap analysis written and shared. Volunteer program launched. ABS entry fully substantiated by documented evidence.

---

## Ongoing / Background Tasks

| Task                                                                                                        | Cadence                             | Source              |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------- |
| Reflective notes at each milestone (private journal — contemporaneous is more authentic than retrospective) | Per milestone                       | Personal discipline |
| Update acknowledgments page as real names become available                                                  | As needed                           | —                   |
| Add usage metrics to impact page                                                                            | After 90+ days traffic              | P2-7                |
| OpenAPI docs page (Swagger/Redoc for `docs/api/openapi.yaml`)                                               | When Phase 1–3 complete             | Low priority        |
| Remaining email coverage beyond top 40 services                                                             | When blocked on other items         | Low priority        |
| Partner claim-listing test with real org                                                                    | When a willing partner is available | P2-3 follow-up      |

---

## Dropped Items

| Item                                                | Reason                                                                                                                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 70% overall component test coverage target          | Replaced by 100% coverage on crisis-path components (P1-2). The percentage target is a vanity metric; safety-critical path coverage is the defensible engineering decision.   |
| Publishing full PIA / AI compliance audit documents | Replaced by published summaries (P3-6). Full documents contain DRAFT status and frank "CRITICAL" risk language designed for internal risk management, not public consumption. |
| AODA multi-year plan with dated milestones          | Replaced by accessibility commitment statement with ongoing obligations (P3-7). Dated milestones create compliance risk if missed.                                            |
| Active OWASP ZAP scan                               | Replaced by passive scan only (P4-5). Active scans generate excessive false positives on Next.js apps and require security expertise to interpret correctly.                  |
| Comprehensive email coverage (161 services)         | Replaced by targeted research on 30–40 L3 outreach candidates (P2-2). The remainder is background work, not a priority.                                                       |
| Usage-metric-focused impact page                    | Reframed as governance/data-quality-focused (P2-7). Low early traffic (likely 50–300 sessions in month 1) would backfire if displayed prominently.                            |

---

## Critical Dependencies Map

```
Phase 0 (today)
  └── Phase 1
        ├── P1-1 Crisis test protocol ──── BLOCKS ──── P1-4 Deployment
        ├── P1-2 Crisis path tests ─────── BLOCKS ──── P1-4 Deployment
        ├── P1-3 Geocoordinates ─────────── optional before deployment
        └── P1-4 Deployment ─────────────── BLOCKS ──── all of Phase 2-4
              │
              └── Phase 2
                    ├── P2-2 Email research ──── BLOCKS ──── P2-4 L3 Outreach
                    ├── P2-3 Portal test ─────── BLOCKS ──── P2-4 L3 Outreach
                    ├── P2-4 L3 Outreach ─────── INFORMS ── P4-1 Partner Letter
                    ├── P2-6 Project Brief ───── USED IN ── P2-4, P3-1, P4-1
                    │
                    └── Phase 3
                          ├── P3-1 Advisory Board ── INFORMS ── P4-1 Partner Letter
                          ├── P3-2 Professional Feedback ── produces evidence
                          ├── P3-3 Community Meeting ─────── builds relationships
                          │
                          └── Phase 4
                                ├── P4-1 Partner Letter (highest-value artifact)
                                └── P4-7 Final ABS Draft (all evidence collected)
```

---

## Success Criteria

### Production Evidence

- [ ] Live production URL with custom domain
- [ ] Crisis detection formally tested (20 scenarios documented)
- [ ] ≥85% geocoding coverage (up from 70%)
- [ ] Public status page operational

### Governance Evidence

- [ ] First verification cycle completed and documented
- [ ] ≥5 services at L3 verification (up from 0)
- [ ] French advanced fields completed with native speaker review
- [ ] Identity tag pass documented (with negative findings where applicable)
- [ ] Accessibility commitment published

### External Validation

- [ ] ≥1 named advisory board member with relevant credentials
- [ ] Professional feedback sessions documented (n≥3)
- [ ] ≥1 community engagement meeting documented
- [ ] ≥1 partner endorsement letter on file

### Portfolio Artifacts

- [ ] ABS-ready STAR narrative (150 words), fully substantiable
- [ ] 1-page project brief for professional referrers
- [ ] 2-minute demo video
- [ ] Impact page live (governance/data-quality framed)
- [ ] PIA and AI compliance summaries published
- [ ] Structural service gap analysis written and shared

---

## Key Shifts from Previous v21.0 Plan

| Change                                                                      | Rationale                                                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Crisis test protocol moved to pre-deployment prerequisite (was Phase 4)     | Both DA and steelman agreed: the most ethically significant feature must be verified before going live |
| Impact page reframed around governance metrics, not usage                   | Low early traffic would backfire; data quality metrics are compelling on day 1                         |
| User testing reframed as professional consultations, not a research study   | Better participants (professionals > students), no ethics review concern, stronger evidence            |
| French translations now require native speaker review                       | AI-translated crisis access scripts for vulnerable populations create liability without quality review |
| Partner endorsement moved to Week 8+ with explicit prerequisites            | Must fix EDIA language, achieve L3s, deploy, and build relationships first                             |
| Component testing scoped to crisis path (not 70% overall)                   | Safety-driven engineering decision is more defensible than a coverage percentage target                |
| Email coverage scoped to 30–40 L3 targets (not 161)                         | Infrastructure for outreach, not standalone data hygiene                                               |
| Service gap analysis available from existing data (not 90-day traffic wait) | Structural gaps from 196-service dataset are a valid equity analysis today                             |
| Advisory board recruitment reframed as staged (specific ask → formalize)    | Bounded ask is more achievable; quality matters more than speed                                        |
| PIA/compliance published as summaries, not full internal documents          | Frank "CRITICAL" risk language in DRAFT documents could be misread in public context                   |

---

## Related Documents

- [Roadmap](roadmap.md) — Overall product roadmap
- [v19.0 Launch Preparation](v19-0-launch-preparation.md) — Pre-launch QA and documentation (complete)
- [v19.0 User Execution Guide](v19-0-user-execution-guide.md) — Step-by-step launch procedures
- [Governance Standards](../governance/standards.md) — L-scale verification and data governance
- [Advisory Board Charter](../governance/advisory_board_charter.md) — Board structure and recruitment
- [Verification Protocol](../governance/verification-protocol.md) — L3 outreach procedures
- [AI Compliance Audit](../legal/ai_compliance_audit.md) — Moffatt-standard compliance
- [Privacy Impact Assessment](../audits/2026-01-03-privacy-impact-assessment.md) — PIPEDA/PHIPA assessment
- [EDIA Audit](../audits/2025-12-29-EDIA_AUDIT.md) — Accessibility and inclusivity review
- [Beta Testing Plan](../operations/beta-testing-plan.md) — 3-phase beta rollout
- [Incident Response Plan](../operations/incident-response-plan.md) — Runbooks for drills
