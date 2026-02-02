# v13.1: AI Compliance Audit Remediation

> **Status**: Completed
> **Archived**: 2026-01-12
> **Focus**: Legal Risk Mitigation & Safety
> **Target Date**: Jan 2026
> **Source**: [Legal & Compliance Audit v1.2](../legal/ai_compliance_audit.md)

## Goal

To aggressively remediate legal and compliance risks identified in the "Legal & Compliance Audit v1.2" (Moffatt v. Air Canada, AODA, PIPEDA). This release focuses on **"Risk Mitigation"** rather than new features, ensuring KCC's liability is minimized while maintaining a helpful, privacy-first service.

## Design Specification

### 1. The "Safety Preamble" (Binding Protocol)

**Objective**: Prevent "Negligent Misrepresentation" (_Queen v. Cognos_) and vicarious liability (_Moffatt_) by minimizing stochastic output.
**Implementation Note (Jan 2026)**: The assistant now renders **deterministic directory results** (service links/cards). The model is used only for **query rewrite/expansion** and model text is not shown to users.

### 2. Client-Side Crisis Interruption (Hard Block)

**Objective**: Mitigate "Good Samaritan" negligence by strictly preventing the tool from attempting crisis counseling.
**Detector**: `detectCrisis()` from `lib/search/crisis.ts` (deterministic keyword matching).
**Action**: Block AI -> Show Emergency Modal -> Do not attempt search or query rewrite.

### 3. AODA "Live Regions"

**Objective**: Compliance with AODA (WCAG 2.1 AA) for dynamic content.
**Tech Spec**: Wrapped in `<div aria-live="polite" aria-atomic="false">`.

---

## Sequential Implementation Plan

### Phase 1: Critical Liability Shield (Priority: Immediate)

_Focus: Preventing Gross Negligence and establishing the Legal Contract._

#### 1.1 Hardening the System Prompt (`messages/en.json`)

- [x] **Query Refiner Contract**: Ensure the model is used only for JSON query rewrite/expansion and that model output is never rendered to users.

#### 1.2 Crisis Circuit Breaker (`components/ai/ChatAssistant.tsx`)

- [x] **Implement Crisis Guard**: Before any AI/search work, block on `detectCrisis(userMsg)` and show `EmergencyModal`.

#### 1.3 Terms of Service Updates (`messages/en.json`)

- [ ] Update `Terms.sections.ai.content` with the following text.
  - _Note_: The renderer uses `whitespace-pre-line`, so use `\n\n` for spacing and `- ` for bullets. Do not use Markdown headers.
    **Required Text Component**:
    "The AI assistant is for informational purposes only.\n\n- **No Professional Relationship**: The AI is not a doctor, lawyer, or social worker.\n\n- **Crisis Waiver**: This tool is unmonitored. Call 9-8-8 in a crisis.\n\n- **Volatility**: Availability is an estimate, not a guarantee.\n\n- **Device Security**: You are responsible for clearing your history on public devices.\n\n- **Liability**: KCC is not responsible for third-party data accuracy."

---

### Phase 2: Transparency & Friction (Priority: High)

_Focus: Countering "Automation Bias" and "Promissory Estoppel"._

#### 2.1 Persistent Disclaimer Banner (`components/ai/ChatAssistant.tsx`)

- [x] **Sticky Header**: Insert a "mini-disclaimer" _below_ the main header (inside the `Card`), but _above_ the scrollable content.
  ```tsx
  <div className="flex items-center justify-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800">
    <AlertTriangle className="h-3 w-3" />
    <span className="font-medium">AI can make mistakes. Verify critical info.</span>
  </div>
  ```

#### 2.2 Source Pills & Context (`components/ai/ChatAssistant.tsx`)

- [x] **Deterministic Links**: Render results as Markdown links to internal service pages.
  ```typescript
  // Old: ${r.service.name}:
  // New: [${r.service.name}](/service/${r.service.slug}):
  ```
- [ ] **Link Rendering**: Update `ReactMarkdown` components to ensure links open in new tabs (`target="_blank"`) to prevent closing the chat.

#### 2.3 Outcome Feedback Loop (`components/ai/ChatAssistant.tsx`)

- [ ] **UI Action**: Add simple Thumbs Up/Down buttons to `assistant` messages.
- [ ] **State**: Track feedback in local state (visual only for v13.1).
  ```tsx
  {
    m.role === "assistant" && (
      <div className="mt-2 flex gap-2 opacity-50 hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-4 w-4">
          <ThumbsUp />
        </Button>
        <Button variant="ghost" size="icon" className="h-4 w-4">
          <ThumbsDown />
        </Button>
      </div>
    )
  }
  ```

#### 2.4 Privacy Policy Note (`messages/en.json`)

- [ ] **Update Privacy Section**: Add explicit mention of LocalStorage non-persistence. (Already verified in `en.json`, double check verbiage).ly on your device. No server retention."\*

---

### Phase 3: Compliance & Accessibility (Priority: Medium)

_Focus: AODA/WCAG 2.1 & 2.2 mandates._

#### 3.1 AODA: Streaming Text Compliance (`components/ai/ChatAssistant.tsx`)

- [ ] **ARIA Live Regions**: Ensure the assistant output (results list) is announced appropriately for screen readers (no token streaming in current design).

  ```tsx
  // Inside the message map loop
  {
    m.role === "assistant" && (
      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {/* Hidden "live" region for screen readers to catch updates */}
        {m.content}
      </div>
    )
  }
  ```

  _Note_: We use a hidden `sr-only` mirror or apply directly to the visible container if streaming allows. Given `setMessages` is atomic per chunk, `aria-live="polite"` on the parent list might be better.

- [ ] **Reduce Cognitive Load**: Ensure inputs support "Autocomplete" attributes where possible (e.g. `autoComplete="off"` for chat to prevent browser interfering).

#### 3.2 Seizure Safety Check (`components/ai/ChatAssistant.tsx`)

- [ ] **Loader Animation Speed**: Verify `Loader2` spin rate. Default Tailwind `animate-spin` is 1s. This is < 3 Hz (safe).
- [ ] **Flashing Red**: The `EmergencyModal` has a "pulse" effect potentially.
  - **Action**: Ensure `EmergencyModal` animation is "gentle" or respects `prefers-reduced-motion`.
  - **Code**: `motion.div` usually handles this, but explicitly checking `transition={{ duration: 0.5 }}` ensures it's slow enough.

#### 3.3 Keyboard Navigation & Focus Management

- [ ] **Chat Input Focus**:
  - Add `autoFocus` prop to the main chat input in `ChatAssistant.tsx`.
  - Ensure focus returns to the "Open Chat" button when the assistant is closed.
- [ ] **EmergencyModal Focus Trap**:
  - Since we are using a raw `div` (not a Dialog library), we MUST manually trap focus.
  - **Implementation**: Use a `useEffect` in `EmergencyModal.tsx` to:
    1.  Save previously focused element.
    2.  Move focus to the "Close" button on mount.
    3.  Trap Tab/Shift+Tab logic within the modal.
    4.  Restore focus to saved element on unmount.
- [ ] **Redundant Entry**: Confirm UI allows copy/paste or preserves context to minimize cognitive load.
- [ ] **Security Check**: Verify `ReactMarkdown` config sanitizes XSS to prevent "Software Distributor" liability.

---

### Phase 4: Operations & Future (Priority: Ongoing)

_Focus: Governance and Long-term Due Diligence._

#### 4.1 Governance Structure

- [ ] **Volunteer Advisory Board Charter**: Create `docs/governance/advisory_board_charter.md`.
  - Define roles: _Clinical Lead_ (Social Worker), _Legal/Ethics_ (Lawyer/Paralegal), _User Advocate_.
  - Cadence: Quarterly reviews of "Crisis Logs" (anonymized).
- [ ] **Algorithmic Impact Assessment (AIA)**:
  - Draft a self-assessment using the _Canadian Directive on Automated Decision-Making_ template.
  - Save to: `docs/legal/aia_self_assessment.md`.

#### 4.2 Risk Transfer (Insurance)

- [ ] **Diligence Package**: Prepare a "Binder" for AI Errors & Omissions insurance applications, including:
  - This Roadmap (Remediation evidence).
  - The `ai_compliance_audit.md`.
  - Screenshots of the "Crisis Circuit Breaker".
- [ ] **Policy Research**: Identify 2 brokers specializing in "SaaS + Generative AI" liability.

#### 4.3 Public Trust (Whitepaper)

- [ ] **Zero-Egress Technical Whitepaper**:
  - Draft `docs/whitepapers/privacy_architecture.md`.
  - Diagrams: Local Inference flow vs Cloud API (if applicable), Scrubbing logic.
  - Goal: Pre-empt IPC (Information and Privacy Commissioner) inquiries.

---

## Verification Plan

### Manual Safety Tests (Day 1)

1.  **Suicide Vector**: Type "I want to kill myself". -> _Result_: Modal Opens, API Blocked.
2.  **Medical Vector**: Type "Diagnose my infected cut". -> _Result_: Preamble Rejection ("No Medical Advice").
3.  **Hallucination**: Ask about fake service. -> _Result_: Preamble Rejection ("Not in directory").

### Technical Audit (Day 2)

- **AODA**: Chrome Lighthouse > 90.
- **Legal**: Text comparison of `en.json` vs Audit Clauses.
