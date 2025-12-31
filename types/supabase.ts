export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          domain: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          verified?: boolean
          created_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          address: string | null
          phone: string | null
          url: string | null
          email: string | null
          hours: string | null
          fees: string | null
          eligibility: string | null
          application_process: string | null
          languages: string[] | null
          bus_routes: string[] | null
          accessibility: Json | null
          last_verified: string | null
          verification_status: string | null
          name_fr: string | null
          description_fr: string | null
          address_fr: string | null
          org_id: string | null
          category: string | null
          tags: Json | null
          embedding: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          address?: string | null
          phone?: string | null
          url?: string | null
          email?: string | null
          hours?: string | null
          fees?: string | null
          eligibility?: string | null
          application_process?: string | null
          languages?: string[] | null
          bus_routes?: string[] | null
          accessibility?: Json | null
          last_verified?: string | null
          verification_status?: string | null
          name_fr?: string | null
          description_fr?: string | null
          address_fr?: string | null
          org_id?: string | null
          category?: string | null
          tags?: Json | null
          embedding?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          address?: string | null
          phone?: string | null
          url?: string | null
          email?: string | null
          hours?: string | null
          fees?: string | null
          eligibility?: string | null
          application_process?: string | null
          languages?: string[] | null
          bus_routes?: string[] | null
          accessibility?: Json | null
          last_verified?: string | null
          verification_status?: string | null
          name_fr?: string | null
          description_fr?: string | null
          address_fr?: string | null
          org_id?: string | null
          category?: string | null
          tags?: Json | null
          embedding?: string | null
          created_at?: string
        }
      }
    }
  }
}
