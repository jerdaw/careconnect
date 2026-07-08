# Brampton Public Positioning Drafts

Date: 2026-07-07
Status: Brampton launch direction approved; gated sections remain review-only

These notes record the approved public positioning direction for the Brampton first launch set. Land acknowledgment wording, official relationship wording, and production rollout copy remain gated until separately reviewed.

## Naming Default

- Public umbrella name: `CareConnect`.
- Region references: use supported-community language, such as `CareConnect for Kingston and Brampton`.
- Avoid reverting to a city-specific product name such as `Kingston CareConnect` when describing the whole project.
- City names should describe supported regions, not separate brands.

## Homepage Supported-Region Copy

### Supported-Region Direction

CareConnect helps people find verified food, housing, crisis, and community support across supported Ontario communities.

### Brampton Preview State

Brampton is being prepared through the same manual review process used for Kingston. During preview, Brampton may show broad Ontario services and draft/local coverage signals, but it should not be described as a complete local directory.

### Brampton Live State

Brampton now includes a small reviewed launch set focused on urgent and core supports. Kingston remains live, and Brampton records will continue to expand through manual verification.

## Preview-To-Live Transition Language

Approved transition direction after the first Brampton L1 records are added to live data:

> Brampton coverage starts with a small reviewed launch set for urgent and core supports. More local records will be added as they complete CareConnect review.

Avoid:

- "Complete Brampton directory"
- "Official Brampton services portal"
- "Partnered with the City of Brampton"
- "Endorsed by Peel Region"
- Any copy implying municipal, regional, provincial, or provider affiliation unless explicitly approved.

## Partner And Source-Reference Language

Use:

> CareConnect reviews public provider, directory, and government sources to prepare records for manual verification.

Use:

> Source links help reviewers confirm service details. They do not indicate endorsement or partnership.

Avoid:

- "Partner source" unless a partner relationship is confirmed.
- Provider logos in launch copy without permission.
- Language that makes public data sources sound like CareConnect collaborators.

## Land Acknowledgment Source Checklist

Do not publish Brampton-specific land acknowledgment wording until a human reviewer approves sources and wording.

Source review completed on 2026-07-07:

- [City of Brampton Land Acknowledgement](https://www.brampton.ca/EN/City-Hall/Equity-Office/Pages/Land-Acknowledgement.aspx): names the Mississaugas of the Credit, Haudenosaunee, and Wendat Nations; identifies the Ajetance Purchase, Treaty 19, 1818.
- [Peel Region Land Acknowledgement Statement](https://peelregion.ca/about/peel-region-council/land-acknowledgement-statement): notes that Peel's statement is under revision with Indigenous Knowledge Holders and Communities; interim wording names the Mississaugas of the Credit First Nation and the traditional territory of the Anishinaabeg, Haudenosaunee, and Huron-Wendat.
- [Mississaugas of the Credit First Nation](https://mncfn.ca/): primary Indigenous-governance source for MCFN identity, treaty lands, and territory context.
- [The Indigenous Network, listed by the Ontario Federation of Indigenous Friendship Centres](https://ofifc.org/friendship-centre/the-indigenous-network/): local Peel Indigenous community-service context.

Before final publication, decide:

- Whether CareConnect should use one Ontario-wide acknowledgment, separate city acknowledgments, or a concise project-level statement.
- Whether Brampton wording should follow City of Brampton wording, Peel Region's interim wording, or a shorter product-context statement.
- Whether any Indigenous-led review is available before using Brampton-specific wording in public UI.

Draft-only Brampton source synthesis:

> Public municipal and Indigenous-governance sources identify Brampton as being on lands connected to the Mississaugas of the Credit, Haudenosaunee, and Wendat/Huron-Wendat, including Treaty 19, the Ajetance Purchase of 1818. Peel Region's public statement is under revision, so CareConnect should not publish final wording until reviewed.

Draft-only product-context option:

> CareConnect supports Brampton on lands identified by public municipal and Indigenous-governance sources as traditional territories of the Mississaugas of the Credit, Haudenosaunee, and Wendat/Huron-Wendat, within Treaty 19, the Ajetance Purchase of 1818. Final wording requires review and does not imply endorsement by any Nation, municipality, or community organization.

Approval requirements:

- [ ] Source list reviewed by a human.
- [ ] Wording checked for accuracy and humility.
- [ ] Wording does not imply Indigenous endorsement.
- [ ] Wording fits the public product context and is not treated as a decorative footer.

## Partner Page Direction

Recommended structure:

- Keep the page under the `CareConnect` umbrella name.
- Describe Kingston and Brampton as supported communities.
- Describe providers, directories, and government pages as public sources unless there is a confirmed relationship.
- Keep partner invitations separate from source citations.

Draft paragraph:

> CareConnect grows through careful review of public service information and community feedback. When a provider, municipality, or community organization wants to help improve a record, we welcome corrections and verification through the update process.

## Approval Matrix

| Surface                    | Safe Autonomous State                                                      | Human Approval Required Before                                                 |
| -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Homepage supported regions | `CareConnect` umbrella with Kingston and Brampton as supported communities | Claims that coverage is complete or officially endorsed                        |
| Brampton live copy         | Small reviewed launch set for urgent/core supports                         | Copy describing a full Brampton directory                                      |
| Partner/source pages       | Public sources support manual review                                       | Any provider, municipal, regional, provincial, or Indigenous partnership claim |
| Land acknowledgment        | Source checklist and draft-only options                                    | Final wording in public UI or docs                                             |
| Project name               | `CareConnect` public umbrella                                              | Rebranding into a city-specific or region-specific product name                |
| Production rollout copy    | Approval-gated release notes and smoke-test checklist                      | Public launch announcement that implies deploy is complete                     |

## Approval-Ready Copy Options

### Homepage Region Line

Option A:

> Search reviewed food, housing, crisis, and community supports across Kingston and Brampton, with broader Ontario resources included where they apply.

Option B:

> CareConnect supports Kingston and Brampton with reviewed local records and broader Ontario services where coverage applies.

### Brampton First Launch Set

Option A:

> Brampton coverage begins with a small reviewed set of urgent and core supports. More records will be added through the same manual review process used for Kingston.

Option B:

> Brampton is live with an initial reviewed launch set for shelter, crisis, emergency assistance, and food support.

### Source Reference

> CareConnect uses public provider, directory, and government sources as inputs for manual review. A source link does not mean the source endorses, operates, or partners with CareConnect.

## Land Acknowledgment Publication Gate

Do not move Brampton-specific land acknowledgment wording into public UI until:

- A human reviewer confirms the preferred source basis.
- The wording avoids implying endorsement by any Nation, municipality, or community organization.
- The wording is reviewed in the context where it will appear.
- The Kingston/Katarokwi wording is reviewed for consistency with the multi-city framing.

## Documentation Direction

- Use `Brampton launch`, `Brampton coverage`, or `Brampton first launch set`.
- Use `Kingston remains live` when explaining rollout continuity.
- Use `first launch set`, `L1`, or `reviewed launch records` for approved Brampton records in `data/services.json`.
- Use `draft`, `preview`, or `pending L1 approval` only for records that are not in `data/services.json`.
- Keep operational deployment details in the private/shared operations source of truth, not public docs.
