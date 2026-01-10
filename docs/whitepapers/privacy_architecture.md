# Technical Whitepaper: Zero-Egress Privacy Architecture

**Privacy by Design for Kingston Care Connect**

## 1. Executive Summary

Kingston Care Connect employs a "Zero-Egress" architecture for its AI Assistant. Unlike traditional LLM implementations that transmit user data to third-party clouds (e.g., OpenAI, Anthropic), our system processes all data **exclusively on the user's device** or within a **sovereign localized environment**.

## 2. Data Flow Architecture

The following measures ensure compliance with PIPEDA and PHIPA:

### A. Local Inference

- **Engine**: `@xenova/transformers` (Wasm/WebGPU).
- **Process**: The AI model is downloaded to the browser's cache once. All subsequent "thinking" occurs in the user's local RAM.
- **Result**: No keystrokes or chat logs ever leave the user's local device.

### B. Sovereign RAG (Retrieval-Augmented Generation)

- **Search**: Vector embeddings are searched against a local index.
- **Context Injection**: The application layer injects directory data into the local model.
- **Sovereignty**: The "Source of Truth" remains our controlled database, never shared with external aggregators.

## 3. Mitigation of "Software Distributor Liability"

To protect against XSS and injection attacks:

1. **Output Sanitization**: All AI output is passed through `ReactMarkdown` with strict sanitization protocols.
2. **Deterministic Guards**: Crisis detection is handled by deterministic Regex, not probabilistic AI, ensuring reliability.

## 4. Conclusion

By eliminating the "Third-Party Data Egress" vector, Kingston Care Connect provides a safer clinical environment than standard "GPT-wrappers," meeting the highest bars for digital sovereignty in social work.

---

_Date: 2026-01-10_
_Classification: Public / Technical_
