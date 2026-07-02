---
status: stable
last_updated: 2026-07-02
owner: jer
tags: [implementation, v22.0, gate-0, legal-risk, limited-pilot]
---

# v22.0 Limited Public Directory Pilot Risk Disposition (2026-07-02)

This record documents the conservative owner disposition for continuing only a
narrow public-directory pilot while full Gate 0 remains blocked.

This is not legal advice, not lawyer review, and not a legal compliance
certification. It is an owner self-review for a solo-dev project that cannot
fund external legal counsel in this phase.

## Decision

| Field               | Value                                                     |
| ------------------- | --------------------------------------------------------- |
| Decision            | `limited_public_directory_pilot_allowed_with_constraints` |
| Full Gate 0 status  | `NO-GO`                                                   |
| Legal review status | `owner_self_review_only_no_lawyer`                        |
| Review date         | 2026-07-02                                                |
| Owner               | jer                                                       |
| Full C1 closure     | deferred                                                  |
| Full D4 closure     | deferred                                                  |

CareConnect may remain available as a limited public directory only if the
constraints below stay true. This decision does not approve partner/API
expansion, 211 integration, legal claims, or outreach execution.

## Solo-Owner Closeout Interpretation

This record is the required owner disposition for the current solo-dev
public-directory scope. External legal counsel, third-party partner evidence,
and private partner/API terms are not required to keep this limited scope open
or to close the current platform-ops PLAN-033 owner-evidence bookkeeping item.

This interpretation is deliberately narrow:

1. It does not make any legal-compliance certification.
2. It does not close full v22 Gate 0 for partner/API expansion.
3. It does not authorize 211 integration, partner workflows, outreach
   execution, or marketing campaigns.
4. It records the owner's decision that the current limited public-directory
   operation can continue under the constraints in this file.

## Reference Inputs

The owner self-review used these public reference surfaces:

1. Government of Canada, [PIPEDA full text](https://laws-lois.justice.gc.ca/eng/acts/P-8.6/FullText.html), and Office of the Privacy Commissioner of Canada, [summary of privacy laws in Canada](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/02_05_d_15/).
2. Government of Ontario, [Personal Health Information Protection Act, 2004](https://www.ontario.ca/laws/statute/04p03).
3. CRTC, [CASL FAQ](https://crtc.gc.ca/eng/com500/faq500.htm) and [guidance on implied consent](https://crtc.gc.ca/eng/com500/guide.htm).
4. 211 Ontario, [Terms of Use / Privacy Policy](https://211ontario.ca/privacy-policy/), treated as source-specific terms that must be reviewed before any integration or content-reuse dependency.
5. Existing CareConnect governance controls, threat model, privacy architecture,
   public legal surfaces, and v22 Gate 0 evidence documents.

## Allowed Limited Scope

The limited pilot may continue only as:

1. A public information directory for manually curated social-service records.
2. A privacy-first search experience where search queries are not logged as raw
   user query text.
3. An information-only service with emergency, medical, legal, eligibility, and
   referral decisions left to the user and official service providers.
4. A maintenance posture focused on data accuracy, stale-record handling,
   privacy-safe analytics, and conservative public copy.

## Prohibited Until Further Review

The following remain blocked:

1. 211 API integration or other external API/data-source integration without
   compatible terms and C1 clause review.
2. Partner-data sharing, partner portal expansion, or partner claims workflow
   activation without D4 evidence.
3. Collection of personal health information, health records, case details, or
   eligibility/intake facts.
4. Claims that CareConnect is legally compliant, lawyer-reviewed, medically
   approved, clinically validated, or an official referral authority.
5. Bulk outreach, marketing campaigns, or recurring commercial electronic
   messages without a separate CASL review covering consent, sender
   identification, unsubscribe, and proof-retention expectations.
6. Publishing private partner details, private contracts, credential material,
   provider-console screenshots, or raw legal terms in public docs.

## Risk Controls

The limited pilot depends on these controls staying in force:

1. Public pages keep directory/information-only disclaimers.
2. Crisis and emergency copy directs users to emergency services and official
   providers rather than CareConnect.
3. Source data remains manually curated and provenance-aware.
4. Stale records are visibly constrained by the freshness policy.
5. Search analytics stay minimized and do not store raw query text.
6. Admin/partner access remains restricted and does not create new public claims
   or partner obligations.
7. Any unclear source/API terms default to no integration and no reuse beyond
   clearly permitted public references.

## Gate 0 Disposition

This record does not close `G0-3 / C1` or `G0-8 / D4`.

1. `G0-3 / C1` remains `pending` because candidate partner/API terms have not
   been attached and reviewed clause-by-clause.
2. `G0-8 / D4` remains `pending` because named partner list, outreach owner,
   and dated outreach execution evidence are not attached.
3. `npm run check:v22-gate0` is expected to remain blocked until the full
   evidence requirements pass.

The practical result is: limited public-directory operation is acceptable under
the constraints above; full partner/API Gate 0 exit remains deferred.
