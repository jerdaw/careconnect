# HelpBridge - Press Kit

**Last Updated**: April 2026
**Version**: 1.1 - Live Pilot
**Contact**: feedback@helpbridge.ca

---

## Quick Facts

| Detail              | Information                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| **Name**            | HelpBridge                                                                             |
| **Tagline**         | Find social services in Kingston, Ontario                                              |
| **Mission**         | Bridge the gap between people in need and a manually curated social-services directory |
| **Current Status**  | Live public pilot                                                                      |
| **Platform**        | Web application (Progressive Web App)                                                  |
| **URL**             | https://helpbridge.ca                                                                  |
| **Service Area**    | Kingston, Ontario, Canada                                                              |
| **Languages**       | English, French, plus 5 additional community languages                                 |
| **Services Listed** | ~196 manually curated social services                                                  |

---

## Executive Summary

HelpBridge is a privacy-first social services directory that helps Kingston residents find food banks, crisis support, housing assistance, mental health services, and other community resources.

Unlike traditional directories, HelpBridge:

- **Prioritizes Privacy**: Local search keeps queries on-device by default, with no third-party tracking and no query-text logging
- **Focuses on Quality**: ~196 hand-curated services with visible listings held at L1+ verification
- **Serves Everyone**: Available in 7 languages including English, French, Simplified Chinese, Arabic, Portuguese, Spanish, and Punjabi
- **Works Offline**: Progressive Web App technology ensures access even without internet
- **Ranks by Authority**: Services are scored using governance and verification signals alongside search relevance

**Built for crisis moments**: Special crisis detection helps surface emergency resources quickly for searches related to food, shelter, and suicide prevention.

---

## The Problem We're Solving

### Information Overload

Kingston residents facing crisis often encounter:

- **Fragmented Information**: Services listed across dozens of websites, PDFs, and directories
- **Outdated Contact Info**: Phone numbers and addresses that haven't been verified in years
- **Language Barriers**: Most directories only available in English
- **Digital Divide**: Complex websites that don't work on older phones or without internet

### The Human Cost

When someone searches "I need food today", they shouldn't have to:

- Click through 10+ websites
- Read eligibility criteria in government jargon
- Call 5 disconnected phone numbers
- Give up and go hungry

**HelpBridge solves this.**

---

## Our Approach

### 1. Manual Curation Over Automation

We don't scrape websites or use AI to generate service information. The directory is:

- Manually curated and reviewed
- Categorized using a governance-first workflow
- Updated through correction and verification processes
- Published using tiered verification rules

**Quality over quantity**: We'd rather have 200 accurate services than 2,000 questionable ones.

### 2. Privacy by Design

- **Local-First Search**: By default, searches happen entirely on your device
- **No User Accounts Required**: Access all services without signing up
- **No Third-Party Tracking**: We don't use advertising or analytics trackers
- **No Query-Text Logging**: Search terms are not logged to the server

### 3. Accessibility First

- **Accessibility Work Is Ongoing**: Automated WCAG 2.1 AA checks and manual accessibility testing are part of the development process
- **Keyboard Navigation**: Full functionality without a mouse
- **Screen Reader Optimized**: Works with assistive technology
- **Mobile-First Design**: Optimized for phones (where most searches happen)
- **Offline-Capable**: Works without internet via Progressive Web App

### 4. Community-Centered

**Languages**: English, French, Simplified Chinese, Arabic, Portuguese, Spanish, Punjabi

**Categories**: Food, Crisis Support, Housing, Mental Health, Addiction, Health, Legal, Employment, Family Support, Youth, Seniors, Disabilities, Indigenous Services

**Local Focus**: Every service serves Kingston. No generic provincial or national listings.

---

## Key Features

### Smart Search

- **Semantic Understanding**: Searches for "I'm hungry" automatically show food banks
- **Crisis Detection**: Emergency keywords trigger prominent crisis resources
- **Synonym Expansion**: "OW" matches "Ontario Works", "ODSP" matches "Ontario Disability Support Program"
- **Proximity Sorting**: Results ranked by distance from you (with your permission)

### Service Detail Pages

Each service includes:

- ✓ Contact information (phone, email, address)
- ✓ Operating hours
- ✓ Eligibility criteria
- ✓ Languages spoken
- ✓ Accessibility features
- ✓ How to access (walk-in, appointment, referral)

### Multilingual Support

**Full Interface Translation**: All UI elements, error messages, and help text in 7 languages

**Service Descriptions**: Many services have French descriptions, with gradual expansion to other languages

**Right-to-Left Support**: Proper text direction for Arabic

### Offline First

**Progressive Web App** technology means:

- Install to home screen like a native app
- Access services without internet
- Sync updates in the background when online
- Small download size (~5MB)

### Crisis Support

Special handling for crisis queries:

- Immediate display of 988 Suicide Crisis Helpline
- No ads, no clutter—direct connection to help
- Available 24/7 with no login required

---

## Technical Highlights

(For technical audiences, partners, developers)

### Built for Resilience

- **Circuit Breaker Pattern**: Automatic failover when database is unavailable
- **Offline-First Architecture**: IndexedDB storage with background sync
- **Progressive Enhancement**: Core functionality works even on old browsers
- **Zero Dependencies on Third-Party Trackers**: No Google Analytics, Facebook Pixel, etc.

### Performance

- **Fast**: Search is optimized for rapid results on common paths
- **Light**: The web app is designed for mobile use and offline access
- **Efficient**: The interface is built to remain usable on modest mobile hardware

### Built With

- **Framework**: Next.js 15 (React)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Search**: Hybrid keyword + semantic vector search
- **Hosting**: Direct VPS deployment using Docker and Caddy
- **Monitoring**: Axiom (observability), Slack (alerts)

---

## Target Audience

### Primary Users

1. **People in Crisis**
   - Experiencing food insecurity
   - Facing homelessness or housing instability
   - In mental health or addiction crisis
   - Needing immediate support

2. **Service Seekers**
   - Low-income individuals and families
   - Newcomers to Canada
   - Seniors navigating social programs
   - People with disabilities
   - Indigenous community members

3. **Helpers**
   - Social workers and case managers
   - Teachers and school counselors
   - Healthcare providers
   - Family members supporting loved ones
   - Community volunteers

### Secondary Users

- **Service Providers**: Verify their listings are accurate
- **Researchers and Evaluators**: Review aggregate, privacy-preserving operational evidence where available
- **Policy Makers**: Review documented local service coverage and identified gaps as evidence matures

---

## Impact & Metrics

### Current Status

- **Services**: ~196 manually curated social services
- **Categories**: 15+ service categories
- **Languages**: 7 languages supported
- **Accessibility**: Automated accessibility checks are in place; manual verification remains ongoing
- **Uptime Target**: 99.5% (with automated monitoring configured)
- **Response Goal**: fast search results on common paths

### Current Evaluation Priorities

Current evaluation priorities focus on:

- **Accuracy**: correction and verification throughput
- **Privacy**: preserving no query-text logging and no third-party tracking
- **Reliability**: uptime, latency, and safe degraded behavior
- **Pilot Evidence**: measurable connection, referral, and freshness outcomes
- **Accessibility**: ongoing automated and manual testing

**What we DON'T measure**:

- Individual search queries (privacy-first means we don't log searches)
- User demographics (no account creation = no demographic tracking)
- Clickthrough rates (we're not optimizing for engagement, we're optimizing for help)

---

## Verification & Governance

Services in HelpBridge are verified at four levels:

| Level  | Description        | Verification Method                    |
| ------ | ------------------ | -------------------------------------- |
| **L0** | Unverified         | Filtered out of search results         |
| **L1** | Basic Verification | Existence confirmed via public records |
| **L2** | Vetted             | Contact made with organization         |
| **L3** | Provider Confirmed | Direct provider confirmation           |

**Current Distribution**:

- L3: 0 currently documented
- L2 and L1: weighted toward L1/L2, with the exact mix published separately in governance tracking
- L0: 0% (filtered from search)

**Verification Sources**:

- 211 Ontario database
- City of Kingston official resources
- Direct contact with service providers
- Community feedback and corrections

---

## Current Rollout Status

- HelpBridge is currently operating as a live public pilot.
- Deployment, monitoring, and rollback procedures are documented.
- Broader launch and partnership activity remain gated by pilot evidence and governance review.

---

## Team & Development

### Development Philosophy

**User-Centered**: Every feature decision is guided by "Will this help someone find food faster?"

**Privacy-First**: If a feature requires tracking users, we don't build it.

**Accessibility Always**: Keyboard navigation and screen reader support aren't afterthoughts—they're requirements.

**Manual Curation**: AI-generated content is never used for service information. Service publication depends on manual curation and verification workflows.

### Technology Choices

We chose:

- **Next.js**: For best-in-class performance and SEO
- **Supabase**: For open-source database with built-in security
- **Direct VPS deployment**: For current runtime control and deployment verification
- **Progressive Web App**: For offline functionality without app store gatekeepers

We avoided:

- **Google Analytics**: Privacy violation
- **Third-party trackers**: Security and privacy risk
- **Paywalls**: Equity barrier
- **User accounts**: Unnecessary friction

---

## Media Assets

### Screenshots

**Available on request**:

- Home page / search interface
- Search results (food bank example)
- Service detail page
- Crisis banner example
- Mobile responsive views
- Multi-language examples
- Accessibility features demo

### Logos & Branding

**Available formats**: SVG, PNG (various sizes)

**Color Palette**:

- Primary: Teal/Aqua (trust, calm)
- Accent: Warm orange (approachable, action)
- Dark mode supported

**Typography**: System fonts (accessibility, performance)

---

## FAQs

### Is this a government project?

No, HelpBridge is an independent community resource. While we reference government services (like Ontario Works), we are not affiliated with any government agency.

### How do you make money?

We don't. This is a community service with no ads, no sponsorships, and no premium tiers. All services are free to access.

### Who verifies the services?

Our curation team verifies services through public records, direct contact, and community feedback. We follow a tiered verification system (L1-L3) to ensure accuracy.

### Can service providers add themselves?

Currently, submissions are reviewed and added manually to maintain quality. Providers can submit corrections or new services via our feedback form at feedback@helpbridge.ca.

### Why only Kingston?

Starting local allows HelpBridge to focus on local relevance, governance, and quality. Any broader expansion would require the same level of local curation and evidence discipline.

### What about user privacy?

By default, search queries stay on your device (local search mode). Even in server mode, HelpBridge is designed to avoid query-text logging and third-party tracking. See our Privacy Policy for details.

### How is this different from 211?

211 Ontario provides broader provincial coverage and live navigation channels. HelpBridge focuses on Kingston-first digital access with local relevance, privacy-first search defaults, offline support, and a community-specific interface. It is intended to complement 211, not replace it.

### Is the code open source?

The platform is built on open-source technologies. Code availability details are available on request.

---

## Contact Information

### General Inquiries

**Email**: feedback@helpbridge.ca
**Website**: https://helpbridge.ca

### Media Inquiries

**Email**: feedback@helpbridge.ca
**Response Time**: Within 48 hours

### Technical Information

**Email**: feedback@helpbridge.ca
**Documentation**: Available on request

### Community Partnerships

**Email**: feedback@helpbridge.ca
**Note**: We're open to partnerships with social service agencies, community organizations, and accessibility advocates.

---

## Boilerplate

### Short (50 words)

HelpBridge is a privacy-first social services directory helping Kingston residents find food banks, crisis support, housing assistance, and other community resources. Available in 7 languages with offline functionality, it prioritizes quality over quantity with ~196 manually curated services.

### Medium (100 words)

HelpBridge is a privacy-first social services directory serving Kingston, Ontario. Unlike traditional directories, it prioritizes quality over quantity with ~196 manually curated services, offers full offline functionality via Progressive Web App technology, and supports 7 languages including English, French, and community languages. Built with accessibility and crisis response in mind, the platform helps people searching for immediate support connect to emergency resources quickly, without requiring user accounts or third-party tracking.

### Long (200 words)

HelpBridge is a privacy-first social services directory that helps Kingston, Ontario residents find food banks, crisis support, housing assistance, mental health services, and other community resources. Built on the principle that people in crisis deserve fast, accurate, accessible help, the platform prioritizes quality over quantity with approximately 196 manually curated social services rather than a broad scraped directory.

Key features include seven-language support, full offline functionality via Progressive Web App technology, accessibility-focused development, and privacy-by-design architecture where local search keeps queries on-device by default. Special crisis detection helps route people searching for immediate help toward emergency resources like the 988 Suicide Crisis Helpline.

Unlike ad-supported directories or engagement-driven products, HelpBridge does not require user accounts, does not use third-party trackers, and does not log search query text. The platform is community-centered, manually curated, and built for the people who need it most: those experiencing food insecurity, homelessness, mental health crises, or other urgent needs.

HelpBridge is currently operating as a live public pilot.

---

## Appendix: Service Categories

1. **Food**: Food banks, meal programs, community kitchens
2. **Crisis**: Suicide prevention, domestic violence, emergency shelter
3. **Housing**: Emergency shelter, transitional housing, housing search assistance
4. **Mental Health**: Counseling, crisis support, peer support groups
5. **Addiction**: Treatment programs, harm reduction, recovery support
6. **Health**: Primary care, dental, vision, sexual health
7. **Legal**: Legal aid, tenant rights, immigration support
8. **Employment**: Job search, skills training, employment supports
9. **Family**: Parenting programs, childcare, family counseling
10. **Youth**: Youth programs, education support, recreation
11. **Seniors**: Senior centers, home care, elder support
12. **Disabilities**: Accessibility services, assistive devices, advocacy
13. **Indigenous**: Indigenous-specific services and cultural support
14. **Financial**: Emergency funds, utility assistance, tax clinics
15. **Transport**: Public transit programs, accessible transport

---

**Document Version**: 1.1
**Last Updated**: April 1, 2026
**Next Review**: After the next pilot evidence and governance review cycle
