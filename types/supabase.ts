export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type FeedbackType = "helpful_yes" | "helpful_no" | "issue" | "not_found"
type FeedbackStatus = "pending" | "reviewed" | "resolved" | "dismissed"
type FeedbackCategory =
  | "Food"
  | "Crisis"
  | "Housing"
  | "Health"
  | "Legal"
  | "Financial"
  | "Employment"
  | "Education"
  | "Transport"
  | "Community"
  | "Indigenous"
  | "Wellness"
type OrganizationRole = "owner" | "admin" | "editor" | "viewer"
type InvitationRole = "admin" | "editor" | "viewer"
type NotificationType = "info" | "success" | "warning" | "error"
type ReindexStatus = "running" | "complete" | "error" | "cancelled"
type AdminActionType =
  | "service_edit"
  | "service_delete"
  | "service_restore"
  | "bulk_update"
  | "reindex"
  | "push_notification"
type PilotContactChannel = "phone" | "website" | "email" | "in_person" | "referral"
type PilotContactOutcome =
  | "connected"
  | "disconnected_number"
  | "no_response"
  | "intake_unavailable"
  | "invalid_routing"
  | "other_failure"
type PilotContactOutcomeNotes =
  | "busy_signal"
  | "voicemail_only"
  | "eligibility_mismatch"
  | "hours_mismatch"
  | "capacity_full"
  | "unknown_failure"
type PilotReferralState = "initiated" | "connected" | "failed" | "client_withdrew" | "no_response_timeout"
type PilotReferralFailureReason =
  | "disconnected_number"
  | "no_response"
  | "intake_closed"
  | "ineligible"
  | "capacity_full"
  | "unknown_failure"
type PilotScopeSlaTier = "crisis" | "high_demand" | "standard"
type PilotServiceStatusCode = "available" | "temporarily_unavailable" | "closed" | "unknown"
type PilotDataDecayFatalErrorCategory =
  | "wrong_or_disconnected_phone"
  | "invalid_or_defunct_intake_path"
  | "materially_incorrect_eligibility"
  | "service_closed_or_unavailable_but_listed_available"
type PilotDataDecayVerificationMode = "web_only" | "web_plus_call" | "provider_confirmation"
type PilotMetricId = "M1" | "M2_P50" | "M2_P75" | "M2_P90" | "M3" | "M4" | "M5" | "M6" | "M7"
type PilotIntegrationDecision = "go" | "conditional" | "blocked"

type TableLike = {
  Row: Record<string, unknown>
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
}

type ViewLike = {
  Row: Record<string, unknown>
}

type FunctionLike = {
  Args: Record<string, unknown> | never
  Returns: unknown
}

type SchemaWithRelationships<
  Schema extends {
    Tables: Record<string, TableLike>
    Views: Record<string, ViewLike>
    Functions: Record<string, FunctionLike>
  },
> = {
  Tables: {
    [Key in keyof Schema["Tables"]]: Schema["Tables"][Key] & { Relationships: [] }
  }
  Views: {
    [Key in keyof Schema["Views"]]: Schema["Views"][Key] & { Relationships: [] }
  }
  Functions: Schema["Functions"]
}

type PublicSchema = SchemaWithRelationships<{
  Tables: {
    organizations: {
      Row: {
        id: string
        name: string
        email: string | null
        domain: string | null
        verified: boolean | null
        created_at: string
        updated_at: string | null
      }
      Insert: {
        id?: string
        name: string
        email?: string | null
        domain?: string | null
        verified?: boolean | null
        created_at?: string
        updated_at?: string | null
      }
      Update: {
        id?: string
        name?: string
        email?: string | null
        domain?: string | null
        verified?: boolean | null
        created_at?: string
        updated_at?: string | null
      }
    }
    services: {
      Row: {
        id: string
        name: string
        name_fr: string | null
        description: string | null
        description_fr: string | null
        address: string | null
        address_fr: string | null
        phone: string | null
        url: string | null
        email: string | null
        hours: Json | null
        hours_text: string | null
        hours_text_fr: string | null
        fees: string | null
        fees_fr: string | null
        eligibility: string | null
        eligibility_fr: string | null
        application_process: string | null
        application_process_fr: string | null
        languages: string[] | null
        bus_routes: string[] | null
        accessibility: Json | null
        last_verified: string | null
        verification_status: string
        category: string | null
        tags: Json | null
        scope: string | null
        virtual_delivery: boolean | null
        primary_phone_label: string | null
        service_area: string | null
        authority_tier: string | null
        resource_indicators: Json | null
        synthetic_queries: string[] | null
        synthetic_queries_fr: string[] | null
        coordinates: Json | null
        embedding: Json | null
        display_provenance: boolean | null
        plain_language_available: boolean | null
        org_id: string | null
        published: boolean
        deleted_at: string | null
        deleted_by: string | null
        admin_notes: string | null
        last_admin_review: string | null
        reviewed_by: string | null
        provenance: Json | null
        created_at: string
        updated_at: string | null
      }
      Insert: {
        id: string
        name: string
        name_fr?: string | null
        description?: string | null
        description_fr?: string | null
        address?: string | null
        address_fr?: string | null
        phone?: string | null
        url?: string | null
        email?: string | null
        hours?: Json | null
        hours_text?: string | null
        hours_text_fr?: string | null
        fees?: string | null
        fees_fr?: string | null
        eligibility?: string | null
        eligibility_fr?: string | null
        application_process?: string | null
        application_process_fr?: string | null
        languages?: string[] | null
        bus_routes?: string[] | null
        accessibility?: Json | null
        last_verified?: string | null
        verification_status?: string
        category?: string | null
        tags?: Json | null
        scope?: string | null
        virtual_delivery?: boolean | null
        primary_phone_label?: string | null
        service_area?: string | null
        authority_tier?: string | null
        resource_indicators?: Json | null
        synthetic_queries?: string[] | null
        synthetic_queries_fr?: string[] | null
        coordinates?: Json | null
        embedding?: Json | null
        display_provenance?: boolean | null
        plain_language_available?: boolean | null
        org_id?: string | null
        published?: boolean
        deleted_at?: string | null
        deleted_by?: string | null
        admin_notes?: string | null
        last_admin_review?: string | null
        reviewed_by?: string | null
        provenance?: Json | null
        created_at?: string
        updated_at?: string | null
      }
      Update: {
        id?: string
        name?: string
        name_fr?: string | null
        description?: string | null
        description_fr?: string | null
        address?: string | null
        address_fr?: string | null
        phone?: string | null
        url?: string | null
        email?: string | null
        hours?: Json | null
        hours_text?: string | null
        hours_text_fr?: string | null
        fees?: string | null
        fees_fr?: string | null
        eligibility?: string | null
        eligibility_fr?: string | null
        application_process?: string | null
        application_process_fr?: string | null
        languages?: string[] | null
        bus_routes?: string[] | null
        accessibility?: Json | null
        last_verified?: string | null
        verification_status?: string
        category?: string | null
        tags?: Json | null
        scope?: string | null
        virtual_delivery?: boolean | null
        primary_phone_label?: string | null
        service_area?: string | null
        authority_tier?: string | null
        resource_indicators?: Json | null
        synthetic_queries?: string[] | null
        synthetic_queries_fr?: string[] | null
        coordinates?: Json | null
        embedding?: Json | null
        display_provenance?: boolean | null
        plain_language_available?: boolean | null
        org_id?: string | null
        published?: boolean
        deleted_at?: string | null
        deleted_by?: string | null
        admin_notes?: string | null
        last_admin_review?: string | null
        reviewed_by?: string | null
        provenance?: Json | null
        created_at?: string
        updated_at?: string | null
      }
    }
    organization_members: {
      Row: {
        id: string
        organization_id: string
        user_id: string
        role: OrganizationRole
        invited_by: string | null
        invited_at: string
        accepted_at: string | null
        created_at: string
        updated_at: string | null
      }
      Insert: {
        id?: string
        organization_id: string
        user_id: string
        role: OrganizationRole
        invited_by?: string | null
        invited_at?: string
        accepted_at?: string | null
        created_at?: string
        updated_at?: string | null
      }
      Update: {
        id?: string
        organization_id?: string
        user_id?: string
        role?: OrganizationRole
        invited_by?: string | null
        invited_at?: string
        accepted_at?: string | null
        created_at?: string
        updated_at?: string | null
      }
    }
    analytics_events: {
      Row: {
        id: string
        service_id: string
        event_type: string
        created_at: string
      }
      Insert: {
        id?: string
        service_id: string
        event_type: string
        created_at?: string
      }
      Update: {
        id?: string
        service_id?: string
        event_type?: string
        created_at?: string
      }
    }
    feedback: {
      Row: {
        id: string
        service_id: string | null
        feedback_type: FeedbackType
        description: string | null
        message: string | null
        category_searched: FeedbackCategory | null
        status: FeedbackStatus
        resolved_at: string | null
        resolved_by: string | null
        created_at: string
      }
      Insert: {
        id?: string
        service_id?: string | null
        feedback_type: FeedbackType
        description?: string | null
        message?: string | null
        category_searched?: FeedbackCategory | null
        status?: FeedbackStatus
        resolved_at?: string | null
        resolved_by?: string | null
        created_at?: string
      }
      Update: {
        id?: string
        service_id?: string | null
        feedback_type?: FeedbackType
        description?: string | null
        message?: string | null
        category_searched?: FeedbackCategory | null
        status?: FeedbackStatus
        resolved_at?: string | null
        resolved_by?: string | null
        created_at?: string
      }
    }
    service_update_requests: {
      Row: {
        id: string
        service_id: string
        requested_by: string
        field_updates: Json
        justification: string | null
        status: "pending" | "approved" | "rejected"
        reviewed_by: string | null
        reviewed_at: string | null
        rejection_reason: string | null
        created_at: string
      }
      Insert: {
        id?: string
        service_id: string
        requested_by: string
        field_updates: Json
        justification?: string | null
        status?: "pending" | "approved" | "rejected"
        reviewed_by?: string | null
        reviewed_at?: string | null
        rejection_reason?: string | null
        created_at?: string
      }
      Update: {
        id?: string
        service_id?: string
        requested_by?: string
        field_updates?: Json
        justification?: string | null
        status?: "pending" | "approved" | "rejected"
        reviewed_by?: string | null
        reviewed_at?: string | null
        rejection_reason?: string | null
        created_at?: string
      }
    }
    plain_language_summaries: {
      Row: {
        service_id: string
        summary_en: string
        summary_fr: string | null
        how_to_use_en: string
        how_to_use_fr: string | null
        reviewed_by: string
        reviewed_at: string
      }
      Insert: {
        service_id: string
        summary_en: string
        summary_fr?: string | null
        how_to_use_en: string
        how_to_use_fr?: string | null
        reviewed_by: string
        reviewed_at?: string
      }
      Update: {
        service_id?: string
        summary_en?: string
        summary_fr?: string | null
        how_to_use_en?: string
        how_to_use_fr?: string | null
        reviewed_by?: string
        reviewed_at?: string
      }
    }
    push_subscriptions: {
      Row: {
        id: string
        endpoint: string
        keys: Json
        categories: string[]
        locale: string
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        endpoint: string
        keys: Json
        categories?: string[]
        locale?: string
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        endpoint?: string
        keys?: Json
        categories?: string[]
        locale?: string
        created_at?: string
        updated_at?: string
      }
    }
    service_submissions: {
      Row: {
        id: string
        name: string
        description: string
        phone: string | null
        url: string | null
        address: string | null
        submitted_by_email: string | null
        status: "pending" | "approved" | "rejected"
        reviewed_by: string | null
        reviewed_at: string | null
        notes: string | null
        created_at: string
      }
      Insert: {
        id?: string
        name: string
        description: string
        phone?: string | null
        url?: string | null
        address?: string | null
        submitted_by_email?: string | null
        status?: "pending" | "approved" | "rejected"
        reviewed_by?: string | null
        reviewed_at?: string | null
        notes?: string | null
        created_at?: string
      }
      Update: {
        id?: string
        name?: string
        description?: string
        phone?: string | null
        url?: string | null
        address?: string | null
        submitted_by_email?: string | null
        status?: "pending" | "approved" | "rejected"
        reviewed_by?: string | null
        reviewed_at?: string | null
        notes?: string | null
        created_at?: string
      }
    }
    search_analytics: {
      Row: {
        id: string
        query: string | null
        results_count: number | null
        locale: string | null
        created_at: string
      }
      Insert: {
        id?: string
        query?: string | null
        results_count?: number | null
        locale?: string | null
        created_at?: string
      }
      Update: {
        id?: string
        query?: string | null
        results_count?: number | null
        locale?: string | null
        created_at?: string
      }
    }
    audit_logs: {
      Row: {
        id: string
        table_name: string
        record_id: string
        operation: "CREATE" | "UPDATE" | "DELETE"
        old_data: Json | null
        new_data: Json | null
        performed_by: string | null
        performed_at: string
        metadata: Json | null
      }
      Insert: {
        id?: string
        table_name: string
        record_id: string
        operation: "CREATE" | "UPDATE" | "DELETE"
        old_data?: Json | null
        new_data?: Json | null
        performed_by?: string | null
        performed_at?: string
        metadata?: Json | null
      }
      Update: {
        id?: string
        table_name?: string
        record_id?: string
        operation?: "CREATE" | "UPDATE" | "DELETE"
        old_data?: Json | null
        new_data?: Json | null
        performed_by?: string | null
        performed_at?: string
        metadata?: Json | null
      }
    }
    notifications: {
      Row: {
        id: string
        user_id: string
        type: NotificationType
        title: string
        message: string
        link: string | null
        read: boolean
        created_at: string
      }
      Insert: {
        id?: string
        user_id: string
        type: NotificationType
        title: string
        message: string
        link?: string | null
        read?: boolean
        created_at?: string
      }
      Update: {
        id?: string
        user_id?: string
        type?: NotificationType
        title?: string
        message?: string
        link?: string | null
        read?: boolean
        created_at?: string
      }
    }
    organization_settings: {
      Row: {
        organization_id: string
        website: string | null
        phone: string | null
        description: string | null
        email_on_feedback: boolean | null
        email_on_service_update: boolean | null
        weekly_analytics_report: boolean | null
        created_at: string
        updated_at: string
      }
      Insert: {
        organization_id: string
        website?: string | null
        phone?: string | null
        description?: string | null
        email_on_feedback?: boolean | null
        email_on_service_update?: boolean | null
        weekly_analytics_report?: boolean | null
        created_at?: string
        updated_at?: string
      }
      Update: {
        organization_id?: string
        website?: string | null
        phone?: string | null
        description?: string | null
        email_on_feedback?: boolean | null
        email_on_service_update?: boolean | null
        weekly_analytics_report?: boolean | null
        created_at?: string
        updated_at?: string
      }
    }
    organization_invitations: {
      Row: {
        id: string
        organization_id: string
        email: string
        role: InvitationRole
        token: string
        invited_by: string
        invited_at: string
        expires_at: string
        accepted_at: string | null
        accepted_by: string | null
      }
      Insert: {
        id?: string
        organization_id: string
        email: string
        role: InvitationRole
        token: string
        invited_by: string
        invited_at?: string
        expires_at?: string
        accepted_at?: string | null
        accepted_by?: string | null
      }
      Update: {
        id?: string
        organization_id?: string
        email?: string
        role?: InvitationRole
        token?: string
        invited_by?: string
        invited_at?: string
        expires_at?: string
        accepted_at?: string | null
        accepted_by?: string | null
      }
    }
    app_admins: {
      Row: {
        id: string
        user_id: string
        created_at: string
      }
      Insert: {
        id?: string
        user_id: string
        created_at?: string
      }
      Update: {
        id?: string
        user_id?: string
        created_at?: string
      }
    }
    reindex_progress: {
      Row: {
        id: string
        started_at: string
        completed_at: string | null
        total_services: number
        processed_count: number
        status: ReindexStatus
        error_message: string | null
        triggered_by: string | null
        service_snapshot_count: number | null
        duration_seconds: number | null
      }
      Insert: {
        id?: string
        started_at?: string
        completed_at?: string | null
        total_services: number
        processed_count?: number
        status?: ReindexStatus
        error_message?: string | null
        triggered_by?: string | null
        service_snapshot_count?: number | null
        duration_seconds?: number | null
      }
      Update: {
        id?: string
        started_at?: string
        completed_at?: string | null
        total_services?: number
        processed_count?: number
        status?: ReindexStatus
        error_message?: string | null
        triggered_by?: string | null
        service_snapshot_count?: number | null
        duration_seconds?: number | null
      }
    }
    admin_actions: {
      Row: {
        id: string
        action: AdminActionType
        performed_by: string
        performed_at: string
        target_service_id: string | null
        target_count: number | null
        details: Json | null
        ip_address: string | null
      }
      Insert: {
        id?: string
        action: AdminActionType
        performed_by: string
        performed_at?: string
        target_service_id?: string | null
        target_count?: number | null
        details?: Json | null
        ip_address?: string | null
      }
      Update: {
        id?: string
        action?: AdminActionType
        performed_by?: string
        performed_at?: string
        target_service_id?: string | null
        target_count?: number | null
        details?: Json | null
        ip_address?: string | null
      }
    }
    pilot_contact_attempt_events: {
      Row: {
        id: string
        pilot_cycle_id: string
        service_id: string
        recorded_by_org_id: string
        entity_key_hash: string | null
        attempt_channel: PilotContactChannel
        attempt_outcome: PilotContactOutcome
        attempted_at: string
        resolved_at: string | null
        outcome_notes_code: PilotContactOutcomeNotes | null
        created_at: string
      }
      Insert: {
        id?: string
        pilot_cycle_id: string
        service_id: string
        recorded_by_org_id: string
        entity_key_hash?: string | null
        attempt_channel: PilotContactChannel
        attempt_outcome: PilotContactOutcome
        attempted_at: string
        resolved_at?: string | null
        outcome_notes_code?: PilotContactOutcomeNotes | null
        created_at?: string
      }
      Update: {
        id?: string
        pilot_cycle_id?: string
        service_id?: string
        recorded_by_org_id?: string
        entity_key_hash?: string | null
        attempt_channel?: PilotContactChannel
        attempt_outcome?: PilotContactOutcome
        attempted_at?: string
        resolved_at?: string | null
        outcome_notes_code?: PilotContactOutcomeNotes | null
        created_at?: string
      }
    }
    pilot_referral_events: {
      Row: {
        id: string
        pilot_cycle_id: string
        source_org_id: string
        target_service_id: string
        referral_state: PilotReferralState
        created_at: string
        updated_at: string
        terminal_at: string | null
        failure_reason_code: PilotReferralFailureReason | null
      }
      Insert: {
        id?: string
        pilot_cycle_id: string
        source_org_id: string
        target_service_id: string
        referral_state: PilotReferralState
        created_at: string
        updated_at: string
        terminal_at?: string | null
        failure_reason_code?: PilotReferralFailureReason | null
      }
      Update: {
        id?: string
        pilot_cycle_id?: string
        source_org_id?: string
        target_service_id?: string
        referral_state?: PilotReferralState
        created_at?: string
        updated_at?: string
        terminal_at?: string | null
        failure_reason_code?: PilotReferralFailureReason | null
      }
    }
    pilot_connection_events: {
      Row: {
        id: string
        pilot_cycle_id: string
        org_id: string
        service_id: string
        connected_at: string
        contact_attempt_event_id: string | null
        referral_event_id: string | null
        created_at: string
      }
      Insert: {
        id?: string
        pilot_cycle_id: string
        org_id: string
        service_id: string
        connected_at: string
        contact_attempt_event_id?: string | null
        referral_event_id?: string | null
        created_at?: string
      }
      Update: {
        id?: string
        pilot_cycle_id?: string
        org_id?: string
        service_id?: string
        connected_at?: string
        contact_attempt_event_id?: string | null
        referral_event_id?: string | null
        created_at?: string
      }
    }
    pilot_service_scope: {
      Row: {
        id: string
        pilot_cycle_id: string
        org_id: string
        service_id: string
        sla_tier: PilotScopeSlaTier
        created_at: string
      }
      Insert: {
        id?: string
        pilot_cycle_id: string
        org_id: string
        service_id: string
        sla_tier: PilotScopeSlaTier
        created_at?: string
      }
      Update: {
        id?: string
        pilot_cycle_id?: string
        org_id?: string
        service_id?: string
        sla_tier?: PilotScopeSlaTier
        created_at?: string
      }
    }
    service_operational_status_events: {
      Row: {
        id: string
        pilot_cycle_id: string
        org_id: string
        service_id: string
        checked_at: string
        status_code: PilotServiceStatusCode
        created_at: string
      }
      Insert: {
        id?: string
        pilot_cycle_id: string
        org_id: string
        service_id: string
        checked_at: string
        status_code: PilotServiceStatusCode
        created_at?: string
      }
      Update: {
        id?: string
        pilot_cycle_id?: string
        org_id?: string
        service_id?: string
        checked_at?: string
        status_code?: PilotServiceStatusCode
        created_at?: string
      }
    }
    pilot_data_decay_audits: {
      Row: {
        id: string
        pilot_cycle_id: string
        org_id: string
        service_id: string
        audited_at: string
        is_fatal: boolean
        fatal_error_category: PilotDataDecayFatalErrorCategory | null
        verification_mode: PilotDataDecayVerificationMode
        created_at: string
      }
      Insert: {
        id?: string
        pilot_cycle_id: string
        org_id: string
        service_id: string
        audited_at: string
        is_fatal: boolean
        fatal_error_category?: PilotDataDecayFatalErrorCategory | null
        verification_mode: PilotDataDecayVerificationMode
        created_at?: string
      }
      Update: {
        id?: string
        pilot_cycle_id?: string
        org_id?: string
        service_id?: string
        audited_at?: string
        is_fatal?: boolean
        fatal_error_category?: PilotDataDecayFatalErrorCategory | null
        verification_mode?: PilotDataDecayVerificationMode
        created_at?: string
      }
    }
    pilot_preference_fit_events: {
      Row: {
        id: string
        pilot_cycle_id: string
        org_id: string
        cohort_label: string
        recorded_at: string
        preferred_via_helpbridge: boolean
        created_at: string
      }
      Insert: {
        id?: string
        pilot_cycle_id: string
        org_id: string
        cohort_label: string
        recorded_at: string
        preferred_via_helpbridge: boolean
        created_at?: string
      }
      Update: {
        id?: string
        pilot_cycle_id?: string
        org_id?: string
        cohort_label?: string
        recorded_at?: string
        preferred_via_helpbridge?: boolean
        created_at?: string
      }
    }
    pilot_metric_snapshots: {
      Row: {
        id: string
        pilot_cycle_id: string
        org_id: string
        metric_id: PilotMetricId
        metric_value: number | null
        numerator: number | null
        denominator: number | null
        calculated_at: string
      }
      Insert: {
        id?: string
        pilot_cycle_id: string
        org_id: string
        metric_id: PilotMetricId
        metric_value?: number | null
        numerator?: number | null
        denominator?: number | null
        calculated_at?: string
      }
      Update: {
        id?: string
        pilot_cycle_id?: string
        org_id?: string
        metric_id?: PilotMetricId
        metric_value?: number | null
        numerator?: number | null
        denominator?: number | null
        calculated_at?: string
      }
    }
    pilot_integration_feasibility_decisions: {
      Row: {
        id: string
        decision: PilotIntegrationDecision
        decision_date: string
        redline_checklist_version: string
        violations: string[]
        compensating_controls: string[]
        owners: string[]
        created_at: string
        created_by: string | null
      }
      Insert: {
        id?: string
        decision: PilotIntegrationDecision
        decision_date: string
        redline_checklist_version: string
        violations?: string[]
        compensating_controls?: string[]
        owners: string[]
        created_at?: string
        created_by?: string | null
      }
      Update: {
        id?: string
        decision?: PilotIntegrationDecision
        decision_date?: string
        redline_checklist_version?: string
        violations?: string[]
        compensating_controls?: string[]
        owners?: string[]
        created_at?: string
        created_by?: string | null
      }
    }
  }
  Views: {
    services_public: {
      Row: {
        id: string | null
        name: string | null
        name_fr: string | null
        description: string | null
        description_fr: string | null
        address: string | null
        address_fr: string | null
        phone: string | null
        url: string | null
        email: string | null
        hours: Json | null
        fees: string | null
        eligibility: string | null
        application_process: string | null
        languages: string[] | null
        bus_routes: string[] | null
        accessibility: Json | null
        last_verified: string | null
        verification_status: string | null
        category: string | null
        tags: Json | null
        scope: string | null
        virtual_delivery: boolean | null
        primary_phone_label: string | null
        created_at: string | null
        authority_tier: string | null
        resource_indicators: Json | null
        synthetic_queries: string[] | null
        synthetic_queries_fr: string[] | null
        coordinates: Json | null
        provenance: Json | null
      }
    }
    feedback_aggregations: {
      Row: {
        service_id: string | null
        helpful_yes_count: number | null
        helpful_no_count: number | null
        total_issues_count: number | null
        resolved_issues_count: number | null
        open_issues_count: number | null
        last_feedback_at: string | null
      }
    }
    unmet_needs_summary: {
      Row: {
        category_searched: string | null
        request_count: number | null
        last_requested_at: string | null
      }
    }
    partner_service_analytics: {
      Row: {
        service_id: string | null
        name: string | null
        org_id: string | null
        verification_status: string | null
        helpful_yes_count: number | null
        helpful_no_count: number | null
        open_issues_count: number | null
        last_feedback_at: string | null
        helpfulness_percentage: number | null
      }
    }
    active_reindex_operations: {
      Row: {
        id: string | null
        started_at: string | null
        total_services: number | null
        processed_count: number | null
        status: ReindexStatus | null
        error_message: string | null
        progress_percentage: number | null
        elapsed_seconds: number | null
      }
    }
  }
  Functions: {
    get_service_views: {
      Args: { service_id_param: string }
      Returns: number
    }
    get_user_organization_id: {
      Args: { user_uuid: string }
      Returns: string | null
    }
    user_can_manage_service: {
      Args: { user_uuid: string; service_uuid: string }
      Returns: boolean
    }
    generate_invitation_token: {
      Args: Record<PropertyKey, never>
      Returns: string
    }
    accept_organization_invitation: {
      Args: { invitation_token: string }
      Returns: Json
    }
    soft_delete_service: {
      Args: { service_uuid: string }
      Returns: Json
    }
    log_admin_action: {
      Args: {
        p_action: string
        p_performed_by: string
        p_target_service_id?: string | null
        p_target_count?: number | null
        p_details?: Json | null
        p_ip_address?: string | null
      }
      Returns: string
    }
    update_reindex_progress: {
      Args: {
        p_progress_id: string
        p_processed_count: number
        p_status?: ReindexStatus
        p_error_message?: string | null
      }
      Returns: boolean
    }
    transfer_ownership: {
      Args: {
        p_org_id: string
        p_current_owner_id: string
        p_new_owner_id: string
      }
      Returns: Json
    }
  }
}>

export interface Database {
  public: PublicSchema
}
