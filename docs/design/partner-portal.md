# Partner Portal Design Document

**Status:** Draft (Concept Phase)
**Date:** Winter 2024
**Target:** Phase 4 Implementation

## 1. Overview

The Partner Portal is a dedicated interface for community organizations ("Partners") to manage their own service listings on Kingston Care Connect. This shifts the maintenance burden from a central administrator to the distributed network of service providers, ensuring data freshness and accuracy.

## 2. User Stories

- **As a Service Provider**, I want to "Claim" my organization's profile so that I can update our hours, phone number, and description.
- **As a Service Provider**, I want to see how many people are finding our service via KCC so that I understand the value of the platform.
- **As an Admin**, I want to vet claim requests so that unauthorized users cannot alter critical community data.

## 3. Architecture

### 3.1 Authentication

We will use a **Passwordless "Magic Link"** strategy.

- **Why?** reduces friction for non-technical staff; no passwords to forget/reset; inherently verifies email ownership.
- **Provider:** Supabase Auth or NextAuth (Auth.js) with Email Provider.

### 3.2 Database Schema (Proposed)

Moving from `services.json` to a relational DB (Supabase/Postgres).

#### Table: `organizations`

| Column   | Type | Description                                  |
| -------- | ---- | -------------------------------------------- |
| id       | uuid | Primary Key                                  |
| name     | text | Org Name                                     |
| domain   | text | e.g., `unitedway.ca` (For auto-verification) |
| verified | bool | Trust status                                 |

#### Table: `users`

| Column | Type | Description                 |
| ------ | ---- | --------------------------- |
| id     | uuid | Links to Auth Provider      |
| email  | text |                             |
| org_id | uuid | FK to organizations         |
| role   | enum | `admin`, `editor`, `viewer` |

#### Table: `services` (Migration)

Existing JSON structure becomes columns: `name`, `description`, `address`, `tags` (array), `embedding` (vector).

## 4. Verification Flow

### 4.1 "The Golden Path" (Domain Matching)

1. User logs in with `jane@youthshelter.ca`.
2. System checks `organizations` table for domain `youthshelter.ca`.
3. If match found + Org is "Trusted", user is automatically granted `pending` access or fully verified depending on policy.

### 4.2 Manual Claim

1. User logs in with generic email (e.g., gmail) or non-matched domain.
2. User searches for "Kingston Youth Shelter" and clicks "Claim this Service".
3. KCC Admin receives notification.
4. KCC Admin manually calls/emails to verify identity.
5. KCC Admin links User to Org.

## 5. UI/UX Concepts

### Login

- Simple email input.
- "Send Magic Link" button.
- Clean, trust-inspiring aesthetic (Blue/White).

### Dashboard

- **Stats Card:** "342 views this month" (driven by `analytics.ts` events).
- **Service List:** Cards showing managed services with "Edit" button.
- **Health Check:** Profile completeness score (e.g., "Add French translation to reach 100%").
