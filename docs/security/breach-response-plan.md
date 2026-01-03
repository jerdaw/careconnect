# Data Breach Response Plan

**Version**: 1.0  
**Effective Date**: January 3, 2026

## 1. Purpose

To mitigate the impact of any security incident involving personal data (Partners) or analytics data, and to comply with PIPEDA mandatory breach reporting requirements.

## 2. Breach Definition

Any unauthorized access, loss, or disclosure of personal information held by KCC.
_Examples: SQL injection accessing partner emails, accidentally publishing the user feedback database._

## 3. Response Team

- **lead**: Technical Lead (Jer)
- **Legal**: Pro Bono Co-Counsel
- **Comms**: Community Manager

## 4. Response Steps (The "4 C's")

### Phase 1: Containment (0-24 Hours)

1. **Stop the Bleeding**: Take affected systems offline immediately.
2. **Isolate**: Revoke all API keys and admin credentials.
3. **Assess**: Determine scope. What data? How many users?

### Phase 2: Classification (24-48 Hours)

Determine "Real Risk of Significant Harm" (RROSH) as per PIPEDA.

- **Sensitive Data?** (Passwords, Health Info?) -> **High Risk**
- **Public Data?** (Public business emails) -> **Low Risk**

### Phase 3: Communication (72 Hours)

If High Risk (RROSH):

1. **Notify Privacy Commissioner of Canada**.
2. **Notify Affected Individuals** (Partners) via email.
   - Template: "We urge you to change your password..."
3. **Public Statement** on Homepage.

### Phase 4: Correction (Post-Incident)

1. Root Cause Analysis (RCA) document.
2. Patch vulnerabilities.
3. Update security policies and training.

## 5. Drills

- Conduct a "Tabletop Exercise" annually to practice this plan.
