# Privacy Impact Assessment (PIA)

**Date**: January 3, 2026
**Project**: Kingston Care Connect (v12.0)
**Status**: Initial Assessment

## 1. Project Overview

Kingston Care Connect (KCC) is a community-led social services directory. It provides public access to information about food, housing, crisis, and health services.

## 2. Data Inventory & Data Flow

### 2.1 Information Collected

| Data Element         | Type         | Source               | Purpose                       | Storage               |
| :------------------- | :----------- | :------------------- | :---------------------------- | :-------------------- |
| **Feedback Content** | Free Text    | User Submission      | Data quality improvement      | Supabase DB           |
| **Partner Email**    | Contact Info | Partner Registration | Authentication & Verification | Supabase Auth         |
| **Partner Name**     | Contact Info | Partner Registration | Verification                  | Supabase DB           |
| **Session Data**     | Metadata     | Browser              | Language/Theme preferences    | LocalStorage (Client) |
| **IP Address**       | Metadata     | Network              | Security/Rate Limiting        | Server Logs (Vercel)  |

### 2.2 Information NOT Collected

- **Search Queries**: No server-side logging of search terms.
- **Chat Conversations**: All AI processing is client-side (WebLLM). No conversation data leaves the user's device.
- **Tracking Cookies**: No analytics or ad-tech cookies used.

## 3. Privacy Risks & Mitigation

### Risk 1: Sensitive Feedback Data

**Risk**: Users might inadvertently include personal health information (PHI) in feedback forms.
**Mitigation**:

- Warning label on feedback forms ("Do not include personal information").
- Feedback is private, accessible only to admins and the specific verified partner.
- 90-day retention policy for resolved feedback.

### Risk 2: Partner Identity Exposure

**Risk**: Partner emails could be exposed or misused.
**Mitigation**:

- Row-Level Security (RLS) policies enforce strict access control.
- Partner emails are not displayed publicly unless they are the official service contact email.

### Risk 3: AI Hallucinations

**Risk**: AI assistant provides incorrect medical/crisis advice.
**Mitigation**:

- **Local-only processing**: Privacy-preserving by design.
- **Strict System Prompts**: Instructed to disclaim medical advice.
- **UI Disclaimers**: Prominent warnings about AI limitations.
- **Emergency Interception**: UI detects crisis keywords and shows 911 banner.

## 4. Compliance Assessment

### PIPEDA

- **Accountability**: Privacy Officer designated (Project Lead).
- **Consent**: Implied consent for service use; explicit opt-in for AI.
- **Limiting Collection**: Minimal data collection policy enforced.
- **Safeguards**: Encryption in transit (TLS) and at rest (Supabase).

### PHIPA (Health Information)

- KCC is **not** a Health Information Custodian (HIC).
- KCC does not purposefully collect PHI.
- "Zero-Log" policy for search queries prevents incidental collection of sensitive health interests.

## 5. Recommendations

1. Implement automated scrubbing of potential PHI from feedback fields.
2. Conduct annual access review for partner accounts.
3. Formalize data sharing agreement with 211 Ontario if data synchronization is implemented.

**Approved By**: KCC Governance Committee
