export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: unknown
          performed_at: string
          performed_by: string
          target_count: number | null
          target_service_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          performed_at?: string
          performed_by: string
          target_count?: number | null
          target_service_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          performed_at?: string
          performed_by?: string
          target_count?: number | null
          target_service_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          service_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "partner_service_analytics"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "analytics_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
      }
      app_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          operation: string
          performed_at: string
          performed_by: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          performed_at?: string
          performed_by?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          performed_at?: string
          performed_by?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category_searched: string | null
          created_at: string
          description: string | null
          feedback_type: string
          id: string
          message: string | null
          resolved_at: string | null
          resolved_by: string | null
          service_id: string | null
          status: string
        }
        Insert: {
          category_searched?: string | null
          created_at?: string
          description?: string | null
          feedback_type: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          service_id?: string | null
          status?: string
        }
        Update: {
          category_searched?: string | null
          created_at?: string
          description?: string | null
          feedback_type?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          service_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "partner_service_analytics"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "feedback_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_audit: {
        Row: {
          created_at: string
          id: string
          message: string
          notification_type: string | null
          onesignal_id: string | null
          sent_at: string
          sent_by: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          notification_type?: string | null
          onesignal_id?: string | null
          sent_at?: string
          sent_by?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          notification_type?: string | null
          onesignal_id?: string | null
          sent_at?: string
          sent_by?: string | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          email: string
          expires_at: string
          id: string
          invited_at: string
          invited_by: string
          organization_id: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by: string
          organization_id: string
          role: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by?: string
          organization_id?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string
          invited_by: string | null
          organization_id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          organization_id: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          organization_id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string
          description: string | null
          email_on_feedback: boolean | null
          email_on_service_update: boolean | null
          organization_id: string
          phone: string | null
          updated_at: string
          website: string | null
          weekly_analytics_report: boolean | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          email_on_feedback?: boolean | null
          email_on_service_update?: boolean | null
          organization_id: string
          phone?: string | null
          updated_at?: string
          website?: string | null
          weekly_analytics_report?: boolean | null
        }
        Update: {
          created_at?: string
          description?: string | null
          email_on_feedback?: boolean | null
          email_on_service_update?: boolean | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
          weekly_analytics_report?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          domain: string | null
          email: string | null
          id: string
          name: string
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          domain?: string | null
          email?: string | null
          id?: string
          name: string
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          domain?: string | null
          email?: string | null
          id?: string
          name?: string
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      pilot_connection_events: {
        Row: {
          connected_at: string
          contact_attempt_event_id: string | null
          created_at: string
          id: string
          org_id: string
          pilot_cycle_id: string
          referral_event_id: string | null
          service_id: string
        }
        Insert: {
          connected_at: string
          contact_attempt_event_id?: string | null
          created_at?: string
          id?: string
          org_id: string
          pilot_cycle_id: string
          referral_event_id?: string | null
          service_id: string
        }
        Update: {
          connected_at?: string
          contact_attempt_event_id?: string | null
          created_at?: string
          id?: string
          org_id?: string
          pilot_cycle_id?: string
          referral_event_id?: string | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_connection_events_contact_attempt_event_id_fkey"
            columns: ["contact_attempt_event_id"]
            isOneToOne: false
            referencedRelation: "pilot_contact_attempt_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_connection_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_connection_events_referral_event_id_fkey"
            columns: ["referral_event_id"]
            isOneToOne: false
            referencedRelation: "pilot_referral_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_connection_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "partner_service_analytics"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "pilot_connection_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_connection_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_contact_attempt_events: {
        Row: {
          attempt_channel: string
          attempt_outcome: string
          attempted_at: string
          created_at: string
          entity_key_hash: string | null
          id: string
          outcome_notes_code: string | null
          pilot_cycle_id: string
          recorded_by_org_id: string
          resolved_at: string | null
          service_id: string
        }
        Insert: {
          attempt_channel: string
          attempt_outcome: string
          attempted_at: string
          created_at?: string
          entity_key_hash?: string | null
          id?: string
          outcome_notes_code?: string | null
          pilot_cycle_id: string
          recorded_by_org_id: string
          resolved_at?: string | null
          service_id: string
        }
        Update: {
          attempt_channel?: string
          attempt_outcome?: string
          attempted_at?: string
          created_at?: string
          entity_key_hash?: string | null
          id?: string
          outcome_notes_code?: string | null
          pilot_cycle_id?: string
          recorded_by_org_id?: string
          resolved_at?: string | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_contact_attempt_events_recorded_by_org_id_fkey"
            columns: ["recorded_by_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_contact_attempt_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "partner_service_analytics"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "pilot_contact_attempt_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_contact_attempt_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_data_decay_audits: {
        Row: {
          audited_at: string
          created_at: string
          fatal_error_category: string | null
          id: string
          is_fatal: boolean
          org_id: string
          pilot_cycle_id: string
          service_id: string
          verification_mode: string
        }
        Insert: {
          audited_at: string
          created_at?: string
          fatal_error_category?: string | null
          id?: string
          is_fatal: boolean
          org_id: string
          pilot_cycle_id: string
          service_id: string
          verification_mode: string
        }
        Update: {
          audited_at?: string
          created_at?: string
          fatal_error_category?: string | null
          id?: string
          is_fatal?: boolean
          org_id?: string
          pilot_cycle_id?: string
          service_id?: string
          verification_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_data_decay_audits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_data_decay_audits_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "partner_service_analytics"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "pilot_data_decay_audits_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_data_decay_audits_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_integration_feasibility_decisions: {
        Row: {
          compensating_controls: string[]
          created_at: string
          created_by: string | null
          decision: string
          decision_date: string
          id: string
          owners: string[]
          redline_checklist_version: string
          violations: string[]
        }
        Insert: {
          compensating_controls?: string[]
          created_at?: string
          created_by?: string | null
          decision: string
          decision_date: string
          id?: string
          owners: string[]
          redline_checklist_version: string
          violations?: string[]
        }
        Update: {
          compensating_controls?: string[]
          created_at?: string
          created_by?: string | null
          decision?: string
          decision_date?: string
          id?: string
          owners?: string[]
          redline_checklist_version?: string
          violations?: string[]
        }
        Relationships: []
      }
      pilot_metric_snapshots: {
        Row: {
          calculated_at: string
          denominator: number | null
          id: string
          metric_id: string
          metric_value: number | null
          numerator: number | null
          org_id: string
          pilot_cycle_id: string
        }
        Insert: {
          calculated_at?: string
          denominator?: number | null
          id?: string
          metric_id: string
          metric_value?: number | null
          numerator?: number | null
          org_id: string
          pilot_cycle_id: string
        }
        Update: {
          calculated_at?: string
          denominator?: number | null
          id?: string
          metric_id?: string
          metric_value?: number | null
          numerator?: number | null
          org_id?: string
          pilot_cycle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_metric_snapshots_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_preference_fit_events: {
        Row: {
          cohort_label: string
          created_at: string
          id: string
          org_id: string
          pilot_cycle_id: string
          preferred_via_careconnect: boolean
          recorded_at: string
        }
        Insert: {
          cohort_label: string
          created_at?: string
          id?: string
          org_id: string
          pilot_cycle_id: string
          preferred_via_careconnect: boolean
          recorded_at: string
        }
        Update: {
          cohort_label?: string
          created_at?: string
          id?: string
          org_id?: string
          pilot_cycle_id?: string
          preferred_via_careconnect?: boolean
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_preference_fit_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_referral_events: {
        Row: {
          created_at: string
          failure_reason_code: string | null
          id: string
          pilot_cycle_id: string
          referral_state: string
          source_org_id: string
          target_service_id: string
          terminal_at: string | null
          updated_at: string
        }
        Insert: {
          created_at: string
          failure_reason_code?: string | null
          id?: string
          pilot_cycle_id: string
          referral_state: string
          source_org_id: string
          target_service_id: string
          terminal_at?: string | null
          updated_at: string
        }
        Update: {
          created_at?: string
          failure_reason_code?: string | null
          id?: string
          pilot_cycle_id?: string
          referral_state?: string
          source_org_id?: string
          target_service_id?: string
          terminal_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_referral_events_source_org_id_fkey"
            columns: ["source_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_referral_events_target_service_id_fkey"
            columns: ["target_service_id"]
            isOneToOne: false
            referencedRelation: "partner_service_analytics"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "pilot_referral_events_target_service_id_fkey"
            columns: ["target_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_referral_events_target_service_id_fkey"
            columns: ["target_service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_service_scope: {
        Row: {
          created_at: string
          id: string
          org_id: string
          pilot_cycle_id: string
          service_id: string
          sla_tier: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          pilot_cycle_id: string
          service_id: string
          sla_tier: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          pilot_cycle_id?: string
          service_id?: string
          sla_tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_service_scope_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_service_scope_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "partner_service_analytics"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "pilot_service_scope_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_service_scope_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
      }
      plain_language_summaries: {
        Row: {
          how_to_use_en: string
          how_to_use_fr: string | null
          reviewed_at: string
          reviewed_by: string
          service_id: string
          summary_en: string
          summary_fr: string | null
        }
        Insert: {
          how_to_use_en: string
          how_to_use_fr?: string | null
          reviewed_at?: string
          reviewed_by: string
          service_id: string
          summary_en: string
          summary_fr?: string | null
        }
        Update: {
          how_to_use_en?: string
          how_to_use_fr?: string | null
          reviewed_at?: string
          reviewed_by?: string
          service_id?: string
          summary_en?: string
          summary_fr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plain_language_summaries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "partner_service_analytics"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "plain_language_summaries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plain_language_summaries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          categories: string[]
          created_at: string
          endpoint: string
          id: string
          keys: Json
          locale: string
          updated_at: string
        }
        Insert: {
          categories?: string[]
          created_at?: string
          endpoint: string
          id?: string
          keys: Json
          locale?: string
          updated_at?: string
        }
        Update: {
          categories?: string[]
          created_at?: string
          endpoint?: string
          id?: string
          keys?: Json
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      reindex_progress: {
        Row: {
          completed_at: string | null
          duration_seconds: number | null
          error_message: string | null
          id: string
          processed_count: number
          service_snapshot_count: number | null
          started_at: string
          status: string
          total_services: number
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          processed_count?: number
          service_snapshot_count?: number | null
          started_at?: string
          status?: string
          total_services: number
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          processed_count?: number
          service_snapshot_count?: number | null
          started_at?: string
          status?: string
          total_services?: number
          triggered_by?: string | null
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          created_at: string
          id: string
          locale: string | null
          query: string | null
          results_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          locale?: string | null
          query?: string | null
          results_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          locale?: string | null
          query?: string | null
          results_count?: number | null
        }
        Relationships: []
      }
      service_operational_status_events: {
        Row: {
          checked_at: string
          created_at: string
          id: string
          org_id: string
          pilot_cycle_id: string
          service_id: string
          status_code: string
        }
        Insert: {
          checked_at: string
          created_at?: string
          id?: string
          org_id: string
          pilot_cycle_id: string
          service_id: string
          status_code: string
        }
        Update: {
          checked_at?: string
          created_at?: string
          id?: string
          org_id?: string
          pilot_cycle_id?: string
          service_id?: string
          status_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_operational_status_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_operational_status_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "partner_service_analytics"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "service_operational_status_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_operational_status_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
      }
      service_submissions: {
        Row: {
          address: string | null
          created_at: string
          description: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_by_email: string | null
          url: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by_email?: string | null
          url?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by_email?: string | null
          url?: string | null
        }
        Relationships: []
      }
      service_update_requests: {
        Row: {
          created_at: string
          field_updates: Json
          id: string
          justification: string | null
          rejection_reason: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          service_id: string
          status: string
        }
        Insert: {
          created_at?: string
          field_updates: Json
          id?: string
          justification?: string | null
          rejection_reason?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id: string
          status?: string
        }
        Update: {
          created_at?: string
          field_updates?: Json
          id?: string
          justification?: string | null
          rejection_reason?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_update_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "partner_service_analytics"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "service_update_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_update_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          access_script: string | null
          access_script_fr: string | null
          accessibility: Json | null
          address: string | null
          address_fr: string | null
          admin_notes: string | null
          application_process: string | null
          application_process_fr: string | null
          authority_tier: string | null
          bus_routes: string[] | null
          category: string | null
          coordinates: Json | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          description_fr: string | null
          display_provenance: boolean | null
          eligibility: string | null
          eligibility_fr: string | null
          email: string | null
          embedding: Json | null
          fees: string | null
          fees_fr: string | null
          hours: Json | null
          hours_text: string | null
          hours_text_fr: string | null
          id: string
          languages: string[] | null
          last_admin_review: string | null
          last_verified: string | null
          name: string
          name_fr: string | null
          org_id: string | null
          phone: string | null
          plain_language_available: boolean | null
          primary_phone_label: string | null
          provenance: Json | null
          published: boolean
          resource_indicators: Json | null
          reviewed_by: string | null
          scope: string | null
          service_area: string | null
          synthetic_queries: string[] | null
          synthetic_queries_fr: string[] | null
          tags: Json | null
          updated_at: string | null
          url: string | null
          verification_status: string
          virtual_delivery: boolean | null
        }
        Insert: {
          access_script?: string | null
          access_script_fr?: string | null
          accessibility?: Json | null
          address?: string | null
          address_fr?: string | null
          admin_notes?: string | null
          application_process?: string | null
          application_process_fr?: string | null
          authority_tier?: string | null
          bus_routes?: string[] | null
          category?: string | null
          coordinates?: Json | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          description_fr?: string | null
          display_provenance?: boolean | null
          eligibility?: string | null
          eligibility_fr?: string | null
          email?: string | null
          embedding?: Json | null
          fees?: string | null
          fees_fr?: string | null
          hours?: Json | null
          hours_text?: string | null
          hours_text_fr?: string | null
          id: string
          languages?: string[] | null
          last_admin_review?: string | null
          last_verified?: string | null
          name: string
          name_fr?: string | null
          org_id?: string | null
          phone?: string | null
          plain_language_available?: boolean | null
          primary_phone_label?: string | null
          provenance?: Json | null
          published?: boolean
          resource_indicators?: Json | null
          reviewed_by?: string | null
          scope?: string | null
          service_area?: string | null
          synthetic_queries?: string[] | null
          synthetic_queries_fr?: string[] | null
          tags?: Json | null
          updated_at?: string | null
          url?: string | null
          verification_status?: string
          virtual_delivery?: boolean | null
        }
        Update: {
          access_script?: string | null
          access_script_fr?: string | null
          accessibility?: Json | null
          address?: string | null
          address_fr?: string | null
          admin_notes?: string | null
          application_process?: string | null
          application_process_fr?: string | null
          authority_tier?: string | null
          bus_routes?: string[] | null
          category?: string | null
          coordinates?: Json | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          description_fr?: string | null
          display_provenance?: boolean | null
          eligibility?: string | null
          eligibility_fr?: string | null
          email?: string | null
          embedding?: Json | null
          fees?: string | null
          fees_fr?: string | null
          hours?: Json | null
          hours_text?: string | null
          hours_text_fr?: string | null
          id?: string
          languages?: string[] | null
          last_admin_review?: string | null
          last_verified?: string | null
          name?: string
          name_fr?: string | null
          org_id?: string | null
          phone?: string | null
          plain_language_available?: boolean | null
          primary_phone_label?: string | null
          provenance?: Json | null
          published?: boolean
          resource_indicators?: Json | null
          reviewed_by?: string | null
          scope?: string | null
          service_area?: string | null
          synthetic_queries?: string[] | null
          synthetic_queries_fr?: string[] | null
          tags?: Json | null
          updated_at?: string | null
          url?: string | null
          verification_status?: string
          virtual_delivery?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "services_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_reindex_operations: {
        Row: {
          elapsed_seconds: number | null
          error_message: string | null
          id: string | null
          processed_count: number | null
          progress_percentage: number | null
          started_at: string | null
          status: string | null
          total_services: number | null
        }
        Insert: {
          elapsed_seconds?: never
          error_message?: string | null
          id?: string | null
          processed_count?: number | null
          progress_percentage?: never
          started_at?: string | null
          status?: string | null
          total_services?: number | null
        }
        Update: {
          elapsed_seconds?: never
          error_message?: string | null
          id?: string | null
          processed_count?: number | null
          progress_percentage?: never
          started_at?: string | null
          status?: string | null
          total_services?: number | null
        }
        Relationships: []
      }
      feedback_aggregations: {
        Row: {
          helpful_no_count: number | null
          helpful_yes_count: number | null
          last_feedback_at: string | null
          open_issues_count: number | null
          resolved_issues_count: number | null
          service_id: string | null
          total_issues_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "partner_service_analytics"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "feedback_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mat_feedback_aggregations: {
        Row: {
          helpful_no_count: number | null
          helpful_yes_count: number | null
          last_feedback_at: string | null
          open_issues_count: number | null
          resolved_issues_count: number | null
          service_id: string | null
          total_issues_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "partner_service_analytics"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "feedback_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mat_unmet_needs_summary: {
        Row: {
          category_searched: string | null
          last_requested_at: string | null
          request_count: number | null
        }
        Relationships: []
      }
      partner_service_analytics: {
        Row: {
          helpful_no_count: number | null
          helpful_yes_count: number | null
          helpfulness_percentage: number | null
          last_feedback_at: string | null
          name: string | null
          open_issues_count: number | null
          org_id: string | null
          service_id: string | null
          verification_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      services_public: {
        Row: {
          access_script: string | null
          access_script_fr: string | null
          accessibility: Json | null
          address: string | null
          address_fr: string | null
          application_process: string | null
          application_process_fr: string | null
          authority_tier: string | null
          bus_routes: string[] | null
          category: string | null
          coordinates: Json | null
          created_at: string | null
          description: string | null
          description_fr: string | null
          eligibility: string | null
          eligibility_fr: string | null
          email: string | null
          fees: string | null
          hours: Json | null
          hours_text: string | null
          hours_text_fr: string | null
          id: string | null
          languages: string[] | null
          last_verified: string | null
          name: string | null
          name_fr: string | null
          phone: string | null
          primary_phone_label: string | null
          provenance: Json | null
          resource_indicators: Json | null
          scope: string | null
          synthetic_queries: string[] | null
          synthetic_queries_fr: string[] | null
          tags: Json | null
          url: string | null
          verification_status: string | null
          virtual_delivery: boolean | null
        }
        Insert: {
          access_script?: string | null
          access_script_fr?: string | null
          accessibility?: Json | null
          address?: string | null
          address_fr?: string | null
          application_process?: string | null
          application_process_fr?: string | null
          authority_tier?: string | null
          bus_routes?: string[] | null
          category?: string | null
          coordinates?: Json | null
          created_at?: string | null
          description?: string | null
          description_fr?: string | null
          eligibility?: string | null
          eligibility_fr?: string | null
          email?: string | null
          fees?: string | null
          hours?: Json | null
          hours_text?: string | null
          hours_text_fr?: string | null
          id?: string | null
          languages?: string[] | null
          last_verified?: string | null
          name?: string | null
          name_fr?: string | null
          phone?: string | null
          primary_phone_label?: string | null
          provenance?: Json | null
          resource_indicators?: Json | null
          scope?: string | null
          synthetic_queries?: string[] | null
          synthetic_queries_fr?: string[] | null
          tags?: Json | null
          url?: string | null
          verification_status?: string | null
          virtual_delivery?: boolean | null
        }
        Update: {
          access_script?: string | null
          access_script_fr?: string | null
          accessibility?: Json | null
          address?: string | null
          address_fr?: string | null
          application_process?: string | null
          application_process_fr?: string | null
          authority_tier?: string | null
          bus_routes?: string[] | null
          category?: string | null
          coordinates?: Json | null
          created_at?: string | null
          description?: string | null
          description_fr?: string | null
          eligibility?: string | null
          eligibility_fr?: string | null
          email?: string | null
          fees?: string | null
          hours?: Json | null
          hours_text?: string | null
          hours_text_fr?: string | null
          id?: string | null
          languages?: string[] | null
          last_verified?: string | null
          name?: string | null
          name_fr?: string | null
          phone?: string | null
          primary_phone_label?: string | null
          provenance?: Json | null
          resource_indicators?: Json | null
          scope?: string | null
          synthetic_queries?: string[] | null
          synthetic_queries_fr?: string[] | null
          tags?: Json | null
          url?: string | null
          verification_status?: string | null
          virtual_delivery?: boolean | null
        }
        Relationships: []
      }
      unmet_needs_summary: {
        Row: {
          category_searched: string | null
          last_requested_at: string | null
          request_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_organization_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      bulk_update_service_status: {
        Args: {
          p_admin_user_id?: string
          p_published?: boolean
          p_service_ids: string[]
          p_verification_status?: string
        }
        Returns: {
          failed_ids: string[]
          updated_count: number
        }[]
      }
      can_manage_org_services: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      generate_invitation_token: { Args: never; Returns: string }
      get_service_views: { Args: { service_id_param: string }; Returns: number }
      get_user_organization_id: { Args: { user_uuid: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_org_admin: { Args: { target_org_id: string }; Returns: boolean }
      is_org_member: { Args: { target_org_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          p_action: string
          p_details?: Json
          p_ip_address?: unknown
          p_performed_by: string
          p_target_count?: number
          p_target_service_id?: string
        }
        Returns: string
      }
      soft_delete_service: { Args: { service_uuid: string }; Returns: Json }
      transfer_ownership: {
        Args: {
          p_current_owner_id: string
          p_new_owner_id: string
          p_org_id: string
        }
        Returns: Json
      }
      update_reindex_progress: {
        Args: {
          p_error_message?: string
          p_processed_count: number
          p_progress_id: string
          p_status?: string
        }
        Returns: boolean
      }
      user_can_manage_service: {
        Args: { service_uuid: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
