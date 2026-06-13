# Runbook Summary: Pilot Event Replay and Duplicate Suppression

**Last Updated:** 2026-06-12

This public summary defines replay criteria for v22 pilot event submissions.
It intentionally excludes production database access steps, private dashboard
links, and environment-specific recovery commands.

## Meaning

A replay occurs when the same pilot event submission is sent more than once,
typically because an offline queue retries after a network interruption. Replay
handling must prevent duplicate metric inputs without storing raw user text,
personal contact fields, or private operational notes.

## Public Response Principles

1. Treat exact repeated submissions as idempotent retries, not new facts.
2. Build replay checks from privacy-safe structured fields only.
3. Never use raw search text, free-text notes, names, phone numbers, email
   addresses, or street addresses in replay keys.
4. Prefer database-backed unique constraints or equivalent atomic writes before
   marking duplicate suppression fully verified.
5. Store detailed incident notes and live remediation commands outside public
   git.

## Replay Criteria

The canonical code-level replay criteria live in
`lib/pilot/event-replay-policy.ts`.

| Event Type       | Duplicate When These Fields Match                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Contact attempt  | `pilot_cycle_id`, `service_id`, `recorded_by_org_id`, `entity_key_hash`, `attempt_channel`, `attempt_outcome`, `attempted_at`, `resolved_at`, `outcome_notes_code` |
| Referral         | `pilot_cycle_id`, `source_org_id`, `target_service_id`, `referral_state`, `created_at`, `updated_at`, `terminal_at`, `failure_reason_code`                         |
| Connection       | `pilot_cycle_id`, `org_id`, `service_id`, `connected_at`, `contact_attempt_event_id`, `referral_event_id`                                                          |
| Service status   | `pilot_cycle_id`, `org_id`, `service_id`, `checked_at`, `status_code`                                                                                              |
| Data decay audit | `pilot_cycle_id`, `org_id`, `service_id`, `audited_at`, `is_fatal`, `fatal_error_category`, `verification_mode`                                                    |
| Preference fit   | `pilot_cycle_id`, `org_id`, `cohort_label`, `recorded_at`, `preferred_via_careconnect`                                                                             |

## Client Event Idempotency

Pilot event create endpoints accept an optional client-generated UUID `id`.
Offline queues should generate this ID once when the local draft is created and
reuse the same ID for every retry of the same event.

When a retry reaches storage after the original event has already been written,
the existing table primary key raises a duplicate-key conflict. The API treats
that conflict as an idempotent retry only when the client supplied an `id` and
the duplicate conflict is on the primary key or `id` key. It then returns a
no-store success response with `duplicate: true`.

Duplicate conflicts on any other unique constraint are not suppressed as
idempotent retries. They remain storage errors until the future replay
constraint and live-schema evidence are explicitly reviewed.

Requests without a supplied `id` use database-generated IDs and are not treated
as idempotent duplicate retries.

## Verification Standard

F3 remains unverified until both conditions are true:

1. Unit/API/storage tests confirm deterministic, privacy-safe replay
   fingerprints and supplied-ID duplicate handling.
2. Integration evidence confirms repeated submissions are atomically suppressed
   by storage, such as through a database unique constraint, conflict-handling
   write path, or an equivalent trusted persistence mechanism.

The current repo-local policy satisfies the first condition only. Live repeated
submission evidence against a real backing store is still required before F3 can
be marked verified.
