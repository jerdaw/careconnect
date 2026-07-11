# Notification JSON Error Handling Design

## Context

The notification subscribe and unsubscribe routes cast `await req.json()` directly inside broad server-error handlers. Malformed JSON and the valid JSON value `null` therefore produce `500` responses even though both are client-input errors.

The routes intentionally use flat `{ error: string }` envelopes. The shared API error helper uses a different nested envelope, so adopting it here would be a public contract change.

## Decision

Parse each request body in a small route-local `try/catch` before rate limiting or database access:

- malformed JSON returns `400 { "error": "Invalid JSON" }`;
- a non-object JSON value follows the route's existing invalid-payload response;
- valid object, rate-limit, database, and success behavior remains unchanged.

Do not add content-type enforcement in this batch. These routes currently accept syntactically valid JSON regardless of the header, and changing that compatibility contract is separate work.

Do not add a shared parser abstraction for two routes with flat envelopes. Record the decision against the maintenance recommendation; revisit a shared helper only when enough routes share compatible response and validation contracts.

## Validation

Add failing regression tests first for malformed and `null` bodies, including proof that rate limiting and Supabase setup are not reached. Run both route suites, formatting, lint, type-check, repository checks, and the full Vitest suite before delivery.
