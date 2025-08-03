export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          event_type: string
          id: string
          ip_address: unknown | null
          page_url: string | null
          properties: Json | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          properties?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          properties?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_performance_metrics: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          method: string
          response_time_ms: number
          status_code: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          method: string
          response_time_ms: number
          status_code: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          method?: string
          response_time_ms?: number
          status_code?: number
          user_id?: string | null
        }
        Relationships: []
      }
      automation_performance_log: {
        Row: {
          automation_type: string
          created_at: string
          details: Json | null
          error_message: string | null
          execution_time_ms: number
          id: string
          success: boolean
        }
        Insert: {
          automation_type: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          execution_time_ms: number
          id?: string
          success?: boolean
        }
        Update: {
          automation_type?: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          execution_time_ms?: number
          id?: string
          success?: boolean
        }
        Relationships: []
      }
      challenge_conversations: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          sender_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          sender_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_conversations_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_matches: {
        Row: {
          challenge_id: string
          challenger_confirmed: boolean | null
          challenger_score: number | null
          club_confirmed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          opponent_confirmed: boolean | null
          opponent_score: number | null
          started_at: string | null
          status: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          challenge_id: string
          challenger_confirmed?: boolean | null
          challenger_score?: number | null
          club_confirmed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          opponent_confirmed?: boolean | null
          opponent_score?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          challenge_id?: string
          challenger_confirmed?: boolean | null
          challenger_score?: number | null
          club_confirmed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          opponent_confirmed?: boolean | null
          opponent_score?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_matches_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_challenge_matches_challenge"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          bet_points: number | null
          challenge_message: string | null
          challenge_type: string | null
          challenger_id: string
          challenger_score: number | null
          club_id: string | null
          completed_at: string | null
          created_at: string
          expires_at: string | null
          handicap_05_rank: string | null
          handicap_1_rank: string | null
          handicap_data: Json | null
          id: string
          is_open_challenge: boolean | null
          message: string | null
          opponent_id: string | null
          opponent_score: number | null
          race_to: number | null
          responded_at: string | null
          response_message: string | null
          scheduled_time: string | null
          started_at: string | null
          status: string
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          bet_points?: number | null
          challenge_message?: string | null
          challenge_type?: string | null
          challenger_id: string
          challenger_score?: number | null
          club_id?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          handicap_05_rank?: string | null
          handicap_1_rank?: string | null
          handicap_data?: Json | null
          id?: string
          is_open_challenge?: boolean | null
          message?: string | null
          opponent_id?: string | null
          opponent_score?: number | null
          race_to?: number | null
          responded_at?: string | null
          response_message?: string | null
          scheduled_time?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          bet_points?: number | null
          challenge_message?: string | null
          challenge_type?: string | null
          challenger_id?: string
          challenger_score?: number | null
          club_id?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          handicap_05_rank?: string | null
          handicap_1_rank?: string | null
          handicap_data?: Json | null
          id?: string
          is_open_challenge?: boolean | null
          message?: string | null
          opponent_id?: string | null
          opponent_score?: number | null
          race_to?: number | null
          responded_at?: string | null
          response_message?: string | null
          scheduled_time?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "challenges_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_opponent_id_fkey"
            columns: ["opponent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_type: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_type: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      club_facilities: {
        Row: {
          capacity: number | null
          club_id: string
          condition_rating: number | null
          created_at: string | null
          facility_code: string | null
          facility_name: string
          facility_type: string
          id: string
          last_maintenance_date: string | null
          maintenance_notes: string | null
          next_maintenance_date: string | null
          specifications: Json | null
          status: string | null
          total_usage_hours: number | null
          updated_at: string | null
          usage_this_month: number | null
        }
        Insert: {
          capacity?: number | null
          club_id: string
          condition_rating?: number | null
          created_at?: string | null
          facility_code?: string | null
          facility_name: string
          facility_type: string
          id?: string
          last_maintenance_date?: string | null
          maintenance_notes?: string | null
          next_maintenance_date?: string | null
          specifications?: Json | null
          status?: string | null
          total_usage_hours?: number | null
          updated_at?: string | null
          usage_this_month?: number | null
        }
        Update: {
          capacity?: number | null
          club_id?: string
          condition_rating?: number | null
          created_at?: string | null
          facility_code?: string | null
          facility_name?: string
          facility_type?: string
          id?: string
          last_maintenance_date?: string | null
          maintenance_notes?: string | null
          next_maintenance_date?: string | null
          specifications?: Json | null
          status?: string | null
          total_usage_hours?: number | null
          updated_at?: string | null
          usage_this_month?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_club_facilities_club_id"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_instructors: {
        Row: {
          availability_schedule: Json | null
          avatar_url: string | null
          bio: string | null
          certifications: Json | null
          club_id: string
          created_at: string | null
          email: string | null
          experience_years: number | null
          full_name: string
          hired_date: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          rating: number | null
          specializations: string[] | null
          success_rate: number | null
          total_students: number | null
          updated_at: string | null
          user_id: string | null
          verified_ranks: string[] | null
        }
        Insert: {
          availability_schedule?: Json | null
          avatar_url?: string | null
          bio?: string | null
          certifications?: Json | null
          club_id: string
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          full_name: string
          hired_date?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          rating?: number | null
          specializations?: string[] | null
          success_rate?: number | null
          total_students?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified_ranks?: string[] | null
        }
        Update: {
          availability_schedule?: Json | null
          avatar_url?: string | null
          bio?: string | null
          certifications?: Json | null
          club_id?: string
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          full_name?: string
          hired_date?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          rating?: number | null
          specializations?: string[] | null
          success_rate?: number | null
          total_students?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified_ranks?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_club_instructors_club_id"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          created_at: string | null
          expiry_date: string | null
          id: string
          join_date: string | null
          last_visit: string | null
          membership_fee: number | null
          membership_number: string | null
          membership_type: string | null
          notification_preferences: Json | null
          outstanding_balance: number | null
          preferred_table_types: string[] | null
          preferred_time_slots: string[] | null
          status: string | null
          total_hours_played: number | null
          total_visits: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          join_date?: string | null
          last_visit?: string | null
          membership_fee?: number | null
          membership_number?: string | null
          membership_type?: string | null
          notification_preferences?: Json | null
          outstanding_balance?: number | null
          preferred_table_types?: string[] | null
          preferred_time_slots?: string[] | null
          status?: string | null
          total_hours_played?: number | null
          total_visits?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          join_date?: string | null
          last_visit?: string | null
          membership_fee?: number | null
          membership_number?: string | null
          membership_type?: string | null
          notification_preferences?: Json | null
          outstanding_balance?: number | null
          preferred_table_types?: string[] | null
          preferred_time_slots?: string[] | null
          status?: string | null
          total_hours_played?: number | null
          total_visits?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_club_members_club_id"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_profiles: {
        Row: {
          address: string | null
          available_tables: number | null
          club_name: string
          contact_info: string | null
          created_at: string
          description: string | null
          hourly_rate: number | null
          id: string
          is_sabo_owned: boolean | null
          phone: string | null
          priority_score: number | null
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          address?: string | null
          available_tables?: number | null
          club_name: string
          contact_info?: string | null
          created_at?: string
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_sabo_owned?: boolean | null
          phone?: string | null
          priority_score?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          address?: string | null
          available_tables?: number | null
          club_name?: string
          contact_info?: string | null
          created_at?: string
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_sabo_owned?: boolean | null
          phone?: string | null
          priority_score?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      club_registrations: {
        Row: {
          address: string
          amenities: Json | null
          approval_date: string | null
          basic_hourly_rate: number
          business_license_url: string | null
          city: string
          club_code: string | null
          club_name: string
          coordinates: Json | null
          created_at: string | null
          deleted_at: string | null
          deposit_amount: number | null
          description: string | null
          district: string
          email: string | null
          facebook_url: string | null
          facilities: string[] | null
          id: string
          logo_url: string | null
          member_discount_rate: number | null
          monthly_fee: number | null
          opening_hours: Json
          payment_status: string | null
          peak_hour_rate: number | null
          phone: string
          photos: string[] | null
          postal_code: string | null
          province: string | null
          rejection_reason: string | null
          review_date: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          services: string[] | null
          setup_fee: number | null
          status: string | null
          submission_date: string | null
          table_count: number
          table_types: string[]
          tax_registration_url: string | null
          updated_at: string | null
          user_id: string
          website: string | null
          weekend_rate: number | null
        }
        Insert: {
          address: string
          amenities?: Json | null
          approval_date?: string | null
          basic_hourly_rate: number
          business_license_url?: string | null
          city: string
          club_code?: string | null
          club_name: string
          coordinates?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          deposit_amount?: number | null
          description?: string | null
          district: string
          email?: string | null
          facebook_url?: string | null
          facilities?: string[] | null
          id?: string
          logo_url?: string | null
          member_discount_rate?: number | null
          monthly_fee?: number | null
          opening_hours: Json
          payment_status?: string | null
          peak_hour_rate?: number | null
          phone: string
          photos?: string[] | null
          postal_code?: string | null
          province?: string | null
          rejection_reason?: string | null
          review_date?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          services?: string[] | null
          setup_fee?: number | null
          status?: string | null
          submission_date?: string | null
          table_count: number
          table_types: string[]
          tax_registration_url?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          weekend_rate?: number | null
        }
        Update: {
          address?: string
          amenities?: Json | null
          approval_date?: string | null
          basic_hourly_rate?: number
          business_license_url?: string | null
          city?: string
          club_code?: string | null
          club_name?: string
          coordinates?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          deposit_amount?: number | null
          description?: string | null
          district?: string
          email?: string | null
          facebook_url?: string | null
          facilities?: string[] | null
          id?: string
          logo_url?: string | null
          member_discount_rate?: number | null
          monthly_fee?: number | null
          opening_hours?: Json
          payment_status?: string | null
          peak_hour_rate?: number | null
          phone?: string
          photos?: string[] | null
          postal_code?: string | null
          province?: string | null
          rejection_reason?: string | null
          review_date?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          services?: string[] | null
          setup_fee?: number | null
          status?: string | null
          submission_date?: string | null
          table_count?: number
          table_types?: string[]
          tax_registration_url?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
          weekend_rate?: number | null
        }
        Relationships: []
      }
      club_tables: {
        Row: {
          club_id: string
          created_at: string
          current_match_id: string | null
          id: string
          last_used_at: string | null
          status: string
          table_name: string | null
          table_number: number
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          current_match_id?: string | null
          id?: string
          last_used_at?: string | null
          status?: string
          table_name?: string | null
          table_number: number
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          current_match_id?: string | null
          id?: string
          last_used_at?: string | null
          status?: string
          table_name?: string | null
          table_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          address: string | null
          contact_info: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_challenge_stats: {
        Row: {
          challenge_count: number | null
          challenge_date: string
          created_at: string
          id: string
          spa_points_earned: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_count?: number | null
          challenge_date: string
          created_at?: string
          id?: string
          spa_points_earned?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_count?: number | null
          challenge_date?: string
          created_at?: string
          id?: string
          spa_points_earned?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenge_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      elo_history: {
        Row: {
          created_at: string | null
          elo_change: number
          id: string
          match_id: string | null
          new_elo: number
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          elo_change: number
          id?: string
          match_id?: string | null
          new_elo: number
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          elo_change?: number
          id?: string
          match_id?: string | null
          new_elo?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      elo_rules: {
        Row: {
          condition_key: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          points_base: number
          points_multiplier: number
          rule_type: string
          tier_level: number | null
          updated_at: string
        }
        Insert: {
          condition_key: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          points_base?: number
          points_multiplier?: number
          rule_type: string
          tier_level?: number | null
          updated_at?: string
        }
        Update: {
          condition_key?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          points_base?: number
          points_multiplier?: number
          rule_type?: string
          tier_level?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      favorite_opponents: {
        Row: {
          created_at: string
          favorite_rank: number | null
          id: string
          losses: number | null
          matches_played: number | null
          opponent_user_id: string
          updated_at: string
          user_id: string
          wins: number | null
        }
        Insert: {
          created_at?: string
          favorite_rank?: number | null
          id?: string
          losses?: number | null
          matches_played?: number | null
          opponent_user_id: string
          updated_at?: string
          user_id: string
          wins?: number | null
        }
        Update: {
          created_at?: string
          favorite_rank?: number | null
          id?: string
          losses?: number | null
          matches_played?: number | null
          opponent_user_id?: string
          updated_at?: string
          user_id?: string
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "favorite_opponents_opponent_user_id_fkey"
            columns: ["opponent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "favorite_opponents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      instructor_certifications: {
        Row: {
          certificate_number: string | null
          certificate_url: string | null
          certification_name: string
          certification_type: string
          created_at: string | null
          expiry_date: string | null
          id: string
          instructor_id: string
          issue_date: string
          issuing_organization: string
          status: string | null
          updated_at: string | null
          valid_for_games: string[] | null
          valid_for_ranks: string[] | null
          verification_date: string | null
          verified_by: string | null
        }
        Insert: {
          certificate_number?: string | null
          certificate_url?: string | null
          certification_name: string
          certification_type: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          instructor_id: string
          issue_date: string
          issuing_organization: string
          status?: string | null
          updated_at?: string | null
          valid_for_games?: string[] | null
          valid_for_ranks?: string[] | null
          verification_date?: string | null
          verified_by?: string | null
        }
        Update: {
          certificate_number?: string | null
          certificate_url?: string | null
          certification_name?: string
          certification_type?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          instructor_id?: string
          issue_date?: string
          issuing_organization?: string
          status?: string | null
          updated_at?: string | null
          valid_for_games?: string[] | null
          valid_for_ranks?: string[] | null
          verification_date?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_instructor_certifications_instructor_id"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "club_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          created_at: string
          elo_after: number
          elo_before: number
          elo_change: number
          id: string
          match_id: string
          player_id: string
          result: string
          spa_points_earned: number
        }
        Insert: {
          created_at?: string
          elo_after?: number
          elo_before?: number
          elo_change?: number
          id?: string
          match_id: string
          player_id: string
          result: string
          spa_points_earned?: number
        }
        Update: {
          created_at?: string
          elo_after?: number
          elo_before?: number
          elo_change?: number
          id?: string
          match_id?: string
          player_id?: string
          result?: string
          spa_points_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          challenge_id: string | null
          created_at: string
          id: string
          match_type: string
          played_at: string | null
          player1_id: string
          player2_id: string
          scheduled_time: string | null
          score_player1: number | null
          score_player2: number | null
          status: string
          tournament_id: string | null
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          challenge_id?: string | null
          created_at?: string
          id?: string
          match_type?: string
          played_at?: string | null
          player1_id: string
          player2_id: string
          scheduled_time?: string | null
          score_player1?: number | null
          score_player2?: number | null
          status?: string
          tournament_id?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          challenge_id?: string | null
          created_at?: string
          id?: string
          match_type?: string
          played_at?: string | null
          player1_id?: string
          player2_id?: string
          scheduled_time?: string | null
          score_player1?: number | null
          score_player2?: number | null
          status?: string
          tournament_id?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: true
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          role: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          role?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mutual_ratings: {
        Row: {
          created_at: string
          id: string
          rated_entity_id: string
          rated_entity_type: string
          rater_id: string
          rating: number
          review_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          rated_entity_id: string
          rated_entity_type: string
          rater_id: string
          rating: number
          review_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          rated_entity_id?: string
          rated_entity_type?: string
          rater_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          auto_popup: boolean | null
          created_at: string
          deleted_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          priority: string | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          auto_popup?: boolean | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          auto_popup?: boolean | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      openai_usage_logs: {
        Row: {
          completion_tokens: number
          cost_usd: number
          created_at: string
          id: string
          model_id: string
          prompt_tokens: number
          request_type: string
          session_id: string | null
          total_tokens: number
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          id?: string
          model_id: string
          prompt_tokens?: number
          request_type: string
          session_id?: string | null
          total_tokens?: number
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          id?: string
          model_id?: string
          prompt_tokens?: number
          request_type?: string
          session_id?: string | null
          total_tokens?: number
          user_id?: string | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          metric_name: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string
        }
        Relationships: []
      }
      player_availability: {
        Row: {
          available_until: string | null
          created_at: string
          id: string
          is_active: boolean | null
          location: string | null
          max_distance_km: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_until?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_distance_km?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_until?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_distance_km?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_milestones: {
        Row: {
          completed_at: string
          created_at: string | null
          id: string
          milestone_id: string
          reward_claimed: boolean | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string | null
          id?: string
          milestone_id: string
          reward_claimed?: boolean | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string | null
          id?: string
          milestone_id?: string
          reward_claimed?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      player_rankings: {
        Row: {
          created_at: string
          current_rank: string | null
          current_rank_id: string | null
          elo_points: number | null
          id: string
          last_promotion_date: string | null
          losses: number | null
          promotion_eligible: boolean | null
          spa_points: number | null
          total_matches: number | null
          updated_at: string
          user_id: string
          verified_rank: string | null
          win_streak: number | null
          wins: number | null
        }
        Insert: {
          created_at?: string
          current_rank?: string | null
          current_rank_id?: string | null
          elo_points?: number | null
          id?: string
          last_promotion_date?: string | null
          losses?: number | null
          promotion_eligible?: boolean | null
          spa_points?: number | null
          total_matches?: number | null
          updated_at?: string
          user_id: string
          verified_rank?: string | null
          win_streak?: number | null
          wins?: number | null
        }
        Update: {
          created_at?: string
          current_rank?: string | null
          current_rank_id?: string | null
          elo_points?: number | null
          id?: string
          last_promotion_date?: string | null
          losses?: number | null
          promotion_eligible?: boolean | null
          spa_points?: number | null
          total_matches?: number | null
          updated_at?: string
          user_id?: string
          verified_rank?: string | null
          win_streak?: number | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_rankings_current_rank_id_fkey"
            columns: ["current_rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      player_stats: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          longest_win_streak: number
          spa_points_earned: number
          total_losses: number
          total_matches: number
          total_wins: number
          tournaments_played: number
          tournaments_won: number
          updated_at: string
          user_id: string
          win_percentage: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          longest_win_streak?: number
          spa_points_earned?: number
          total_losses?: number
          total_matches?: number
          total_wins?: number
          tournaments_played?: number
          tournaments_won?: number
          updated_at?: string
          user_id: string
          win_percentage?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          longest_win_streak?: number
          spa_points_earned?: number
          total_losses?: number
          total_matches?: number
          total_wins?: number
          tournaments_played?: number
          tournaments_won?: number
          updated_at?: string
          user_id?: string
          win_percentage?: number
        }
        Relationships: []
      }
      player_trust_scores: {
        Row: {
          created_at: string
          id: string
          last_calculated: string
          rating_count: number
          trust_percentage: number
          trust_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_calculated?: string
          rating_count?: number
          trust_percentage?: number
          trust_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_calculated?: string
          rating_count?: number
          trust_percentage?: number
          trust_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          created_at: string | null
          id: string
          location: string | null
          player1_id: string
          player2_id: string
          scheduled_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          player1_id: string
          player2_id: string
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          player1_id?: string
          player2_id?: string
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_role: string | null
          avatar_url: string | null
          ban_reason: string | null
          ban_status: string | null
          banned_at: string | null
          banned_by: string | null
          bio: string | null
          city: string | null
          completion_percentage: number | null
          cover_image_url: string | null
          created_at: string
          current_rank: Database["public"]["Enums"]["sabo_rank"] | null
          display_name: string | null
          district: string | null
          elo: number | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          is_demo_user: boolean | null
          member_since: string | null
          nickname: string | null
          phone: string | null
          role: string | null
          skill_level: string | null
          updated_at: string
          user_id: string
          verified_rank: string | null
        }
        Insert: {
          active_role?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          ban_status?: string | null
          banned_at?: string | null
          banned_by?: string | null
          bio?: string | null
          city?: string | null
          completion_percentage?: number | null
          cover_image_url?: string | null
          created_at?: string
          current_rank?: Database["public"]["Enums"]["sabo_rank"] | null
          display_name?: string | null
          district?: string | null
          elo?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_demo_user?: boolean | null
          member_since?: string | null
          nickname?: string | null
          phone?: string | null
          role?: string | null
          skill_level?: string | null
          updated_at?: string
          user_id: string
          verified_rank?: string | null
        }
        Update: {
          active_role?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          ban_status?: string | null
          banned_at?: string | null
          banned_by?: string | null
          bio?: string | null
          city?: string | null
          completion_percentage?: number | null
          cover_image_url?: string | null
          created_at?: string
          current_rank?: Database["public"]["Enums"]["sabo_rank"] | null
          display_name?: string | null
          district?: string | null
          elo?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_demo_user?: boolean | null
          member_since?: string | null
          nickname?: string | null
          phone?: string | null
          role?: string | null
          skill_level?: string | null
          updated_at?: string
          user_id?: string
          verified_rank?: string | null
        }
        Relationships: []
      }
      rank_requests: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          club_id: string | null
          created_at: string
          current_rank: string | null
          evidence_url: string | null
          id: string
          rejection_reason: string | null
          requested_rank: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          club_id?: string | null
          created_at?: string
          current_rank?: string | null
          evidence_url?: string | null
          id?: string
          rejection_reason?: string | null
          requested_rank: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          club_id?: string | null
          created_at?: string
          current_rank?: string | null
          evidence_url?: string | null
          id?: string
          rejection_reason?: string | null
          requested_rank?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_rank_requests_club_id"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rank_requests_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rank_test_results: {
        Row: {
          created_at: string | null
          detailed_feedback: string | null
          duration_minutes: number | null
          grade: string | null
          id: string
          overall_score: number
          pass_status: boolean | null
          percentile: number | null
          practical_score: number | null
          rank_verification_id: string
          recommendations: string | null
          skill_scores: Json | null
          test_data: Json | null
          test_date: string
          test_schedule_id: string | null
          theory_score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          detailed_feedback?: string | null
          duration_minutes?: number | null
          grade?: string | null
          id?: string
          overall_score: number
          pass_status?: boolean | null
          percentile?: number | null
          practical_score?: number | null
          rank_verification_id: string
          recommendations?: string | null
          skill_scores?: Json | null
          test_data?: Json | null
          test_date: string
          test_schedule_id?: string | null
          theory_score?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          detailed_feedback?: string | null
          duration_minutes?: number | null
          grade?: string | null
          id?: string
          overall_score?: number
          pass_status?: boolean | null
          percentile?: number | null
          practical_score?: number | null
          rank_verification_id?: string
          recommendations?: string | null
          skill_scores?: Json | null
          test_data?: Json | null
          test_date?: string
          test_schedule_id?: string | null
          theory_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_rank_test_results_schedule_id"
            columns: ["test_schedule_id"]
            isOneToOne: false
            referencedRelation: "test_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rank_test_results_verification_id"
            columns: ["rank_verification_id"]
            isOneToOne: false
            referencedRelation: "rank_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_verifications: {
        Row: {
          application_date: string | null
          application_notes: string | null
          areas_for_improvement: string[] | null
          certificate_number: string | null
          certificate_url: string | null
          club_id: string
          club_notes: string | null
          created_at: string | null
          current_rank: string | null
          evidence_photos: string[] | null
          id: string
          instructor_feedback: string | null
          instructor_id: string | null
          max_score: number | null
          payment_status: string | null
          practical_score: number | null
          rank_category: string | null
          requested_rank: string
          skills_assessment: Json | null
          status: string | null
          strengths: string[] | null
          student_feedback: string | null
          test_actual_date: string | null
          test_duration_minutes: number | null
          test_fee: number | null
          test_location: string | null
          test_scheduled_date: string | null
          test_score: number | null
          theory_score: number | null
          updated_at: string | null
          user_id: string
          verification_date: string | null
          verified_by: string | null
          video_evidence_url: string | null
        }
        Insert: {
          application_date?: string | null
          application_notes?: string | null
          areas_for_improvement?: string[] | null
          certificate_number?: string | null
          certificate_url?: string | null
          club_id: string
          club_notes?: string | null
          created_at?: string | null
          current_rank?: string | null
          evidence_photos?: string[] | null
          id?: string
          instructor_feedback?: string | null
          instructor_id?: string | null
          max_score?: number | null
          payment_status?: string | null
          practical_score?: number | null
          rank_category?: string | null
          requested_rank: string
          skills_assessment?: Json | null
          status?: string | null
          strengths?: string[] | null
          student_feedback?: string | null
          test_actual_date?: string | null
          test_duration_minutes?: number | null
          test_fee?: number | null
          test_location?: string | null
          test_scheduled_date?: string | null
          test_score?: number | null
          theory_score?: number | null
          updated_at?: string | null
          user_id: string
          verification_date?: string | null
          verified_by?: string | null
          video_evidence_url?: string | null
        }
        Update: {
          application_date?: string | null
          application_notes?: string | null
          areas_for_improvement?: string[] | null
          certificate_number?: string | null
          certificate_url?: string | null
          club_id?: string
          club_notes?: string | null
          created_at?: string | null
          current_rank?: string | null
          evidence_photos?: string[] | null
          id?: string
          instructor_feedback?: string | null
          instructor_id?: string | null
          max_score?: number | null
          payment_status?: string | null
          practical_score?: number | null
          rank_category?: string | null
          requested_rank?: string
          skills_assessment?: Json | null
          status?: string | null
          strengths?: string[] | null
          student_feedback?: string | null
          test_actual_date?: string | null
          test_duration_minutes?: number | null
          test_fee?: number | null
          test_location?: string | null
          test_scheduled_date?: string | null
          test_score?: number | null
          theory_score?: number | null
          updated_at?: string | null
          user_id?: string
          verification_date?: string | null
          verified_by?: string | null
          video_evidence_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_rank_verifications_club_id"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rank_verifications_instructor_id"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "club_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      ranks: {
        Row: {
          code: string
          created_at: string
          description: string | null
          elo_requirement: number
          id: string
          level: number | null
          rank_color: string | null
          rank_name: string
          rank_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          elo_requirement: number
          id?: string
          level?: number | null
          rank_color?: string | null
          rank_name: string
          rank_order: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          elo_requirement?: number
          id?: string
          level?: number | null
          rank_color?: string | null
          rank_name?: string
          rank_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          reward_claimed: boolean | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          reward_claimed?: boolean | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          reward_claimed?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          created_at: string
          id: string
          points_cost: number
          processed_at: string | null
          redeemed_at: string
          redemption_data: Json | null
          reward_type: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_cost: number
          processed_at?: string | null
          redeemed_at?: string
          redemption_data?: Json | null
          reward_type: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_cost?: number
          processed_at?: string | null
          redeemed_at?: string
          redemption_data?: Json | null
          reward_type?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sabo_challenges: {
        Row: {
          accepted_at: string | null
          challenger_final_score: number
          challenger_id: string
          created_at: string
          expires_at: string
          handicap_challenger: number
          handicap_opponent: number
          id: string
          opponent_final_score: number
          opponent_id: string
          race_to: number
          rack_history: Json
          score_confirmation_timestamp: string | null
          stake_amount: number
          started_at: string | null
          status: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          challenger_final_score?: number
          challenger_id: string
          created_at?: string
          expires_at?: string
          handicap_challenger?: number
          handicap_opponent?: number
          id?: string
          opponent_final_score?: number
          opponent_id: string
          race_to?: number
          rack_history?: Json
          score_confirmation_timestamp?: string | null
          stake_amount?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          challenger_final_score?: number
          challenger_id?: string
          created_at?: string
          expires_at?: string
          handicap_challenger?: number
          handicap_opponent?: number
          id?: string
          opponent_final_score?: number
          opponent_id?: string
          race_to?: number
          rack_history?: Json
          score_confirmation_timestamp?: string | null
          stake_amount?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      spa_points_log: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spa_points_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      spa_reward_milestones: {
        Row: {
          bonus_conditions: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_repeatable: boolean | null
          milestone_name: string
          milestone_type: string
          requirement_value: number
          spa_reward: number
          updated_at: string | null
        }
        Insert: {
          bonus_conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_repeatable?: boolean | null
          milestone_name: string
          milestone_type: string
          requirement_value: number
          spa_reward: number
          updated_at?: string | null
        }
        Update: {
          bonus_conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_repeatable?: boolean | null
          milestone_name?: string
          milestone_type?: string
          requirement_value?: number
          spa_reward?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      spa_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          source_type: string
          status: string | null
          transaction_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          source_type: string
          status?: string | null
          transaction_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          source_type?: string
          status?: string | null
          transaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spa_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      system_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          level: string
          message: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          level: string
          message: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      test_schedules: {
        Row: {
          booking_deadline: string | null
          cancellation_policy: string | null
          club_id: string
          created_at: string | null
          current_participants: number | null
          duration_minutes: number
          end_time: string
          equipment_needed: string[] | null
          id: string
          instructor_id: string | null
          max_participants: number | null
          rank_requirements: string[] | null
          skill_requirements: string[] | null
          start_time: string
          status: string | null
          test_date: string
          test_type: string
          updated_at: string | null
        }
        Insert: {
          booking_deadline?: string | null
          cancellation_policy?: string | null
          club_id: string
          created_at?: string | null
          current_participants?: number | null
          duration_minutes: number
          end_time: string
          equipment_needed?: string[] | null
          id?: string
          instructor_id?: string | null
          max_participants?: number | null
          rank_requirements?: string[] | null
          skill_requirements?: string[] | null
          start_time: string
          status?: string | null
          test_date: string
          test_type: string
          updated_at?: string | null
        }
        Update: {
          booking_deadline?: string | null
          cancellation_policy?: string | null
          club_id?: string
          created_at?: string | null
          current_participants?: number | null
          duration_minutes?: number
          end_time?: string
          equipment_needed?: string[] | null
          id?: string
          instructor_id?: string | null
          max_participants?: number | null
          rank_requirements?: string[] | null
          skill_requirements?: string[] | null
          start_time?: string
          status?: string | null
          test_date?: string
          test_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_test_schedules_club_id"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_test_schedules_instructor_id"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "club_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_automation_log: {
        Row: {
          automation_type: string
          completed_at: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          match_id: string | null
          status: string
          tournament_id: string
        }
        Insert: {
          automation_type: string
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          match_id?: string | null
          status?: string
          tournament_id: string
        }
        Update: {
          automation_type?: string
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          match_id?: string | null
          status?: string
          tournament_id?: string
        }
        Relationships: []
      }
      tournament_brackets: {
        Row: {
          bracket_data: Json | null
          bracket_type: string | null
          created_at: string
          id: string
          total_rounds: number
          tournament_id: string
          updated_at: string
        }
        Insert: {
          bracket_data?: Json | null
          bracket_type?: string | null
          created_at?: string
          id?: string
          total_rounds?: number
          tournament_id: string
          updated_at?: string
        }
        Update: {
          bracket_data?: Json | null
          bracket_type?: string | null
          created_at?: string
          id?: string
          total_rounds?: number
          tournament_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_matches: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          bracket_type: string | null
          branch_type: string | null
          created_at: string
          id: string
          is_third_place_match: boolean | null
          loser_branch: string | null
          match_number: number
          match_stage: string | null
          notes: string | null
          player1_id: string | null
          player2_id: string | null
          referee_id: string | null
          round_number: number
          round_position: number | null
          scheduled_time: string | null
          score_input_by: string | null
          score_player1: number | null
          score_player2: number | null
          score_status: string | null
          score_submitted_at: string | null
          status: string
          tournament_id: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          bracket_type?: string | null
          branch_type?: string | null
          created_at?: string
          id?: string
          is_third_place_match?: boolean | null
          loser_branch?: string | null
          match_number: number
          match_stage?: string | null
          notes?: string | null
          player1_id?: string | null
          player2_id?: string | null
          referee_id?: string | null
          round_number: number
          round_position?: number | null
          scheduled_time?: string | null
          score_input_by?: string | null
          score_player1?: number | null
          score_player2?: number | null
          score_status?: string | null
          score_submitted_at?: string | null
          status?: string
          tournament_id: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          bracket_type?: string | null
          branch_type?: string | null
          created_at?: string
          id?: string
          is_third_place_match?: boolean | null
          loser_branch?: string | null
          match_number?: number
          match_stage?: string | null
          notes?: string | null
          player1_id?: string | null
          player2_id?: string | null
          referee_id?: string | null
          round_number?: number
          round_position?: number | null
          scheduled_time?: string | null
          score_input_by?: string | null
          score_player1?: number | null
          score_player2?: number | null
          score_status?: string | null
          score_submitted_at?: string | null
          status?: string
          tournament_id?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_physical_prizes: {
        Row: {
          created_at: string
          estimated_value: number | null
          id: string
          image_url: string | null
          is_available: boolean | null
          item_description: string | null
          item_name: string
          position: number
          quantity: number | null
          sponsor_name: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_value?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          item_description?: string | null
          item_name: string
          position: number
          quantity?: number | null
          sponsor_name?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_value?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          item_description?: string | null
          item_name?: string
          position?: number
          quantity?: number | null
          sponsor_name?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_physical_prizes_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_point_configs: {
        Row: {
          base_points: number
          created_at: string
          id: string
          is_active: boolean | null
          point_type: string
          position_range: string
          rank_multiplier: Json | null
          tier_bonus: number | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          base_points?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          point_type: string
          position_range: string
          rank_multiplier?: Json | null
          tier_bonus?: number | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          base_points?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          point_type?: string
          position_range?: string
          rank_multiplier?: Json | null
          tier_bonus?: number | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_point_configs_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_prize_tiers: {
        Row: {
          cash_amount: number | null
          created_at: string
          elo_points: number | null
          id: string
          is_visible: boolean | null
          physical_items: string[] | null
          position: number
          position_name: string
          spa_points: number | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          cash_amount?: number | null
          created_at?: string
          elo_points?: number | null
          id?: string
          is_visible?: boolean | null
          physical_items?: string[] | null
          position: number
          position_name: string
          spa_points?: number | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          cash_amount?: number | null
          created_at?: string
          elo_points?: number | null
          id?: string
          is_visible?: boolean | null
          physical_items?: string[] | null
          position?: number
          position_name?: string
          spa_points?: number | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_prize_tiers_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          bracket_position: number | null
          created_at: string | null
          current_bracket: string | null
          elimination_round: number | null
          entry_fee: number | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_priority: number | null
          payment_status: string | null
          registration_date: string | null
          registration_status: string | null
          status: string | null
          tournament_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bracket_position?: number | null
          created_at?: string | null
          current_bracket?: string | null
          elimination_round?: number | null
          entry_fee?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_priority?: number | null
          payment_status?: string | null
          registration_date?: string | null
          registration_status?: string | null
          status?: string | null
          tournament_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bracket_position?: number | null
          created_at?: string | null
          current_bracket?: string | null
          elimination_round?: number | null
          entry_fee?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_priority?: number | null
          payment_status?: string | null
          registration_date?: string | null
          registration_status?: string | null
          status?: string | null
          tournament_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tournament_results: {
        Row: {
          created_at: string | null
          elo_points_earned: number | null
          final_position: number
          id: string
          matches_lost: number | null
          matches_played: number | null
          matches_won: number | null
          physical_rewards: string[] | null
          placement_type: string | null
          points_earned: number | null
          position: number | null
          prize_amount: number | null
          spa_points_earned: number | null
          tournament_id: string
          updated_at: string | null
          user_id: string
          win_percentage: number | null
        }
        Insert: {
          created_at?: string | null
          elo_points_earned?: number | null
          final_position: number
          id?: string
          matches_lost?: number | null
          matches_played?: number | null
          matches_won?: number | null
          physical_rewards?: string[] | null
          placement_type?: string | null
          points_earned?: number | null
          position?: number | null
          prize_amount?: number | null
          spa_points_earned?: number | null
          tournament_id: string
          updated_at?: string | null
          user_id: string
          win_percentage?: number | null
        }
        Update: {
          created_at?: string | null
          elo_points_earned?: number | null
          final_position?: number
          id?: string
          matches_lost?: number | null
          matches_played?: number | null
          matches_won?: number | null
          physical_rewards?: string[] | null
          placement_type?: string | null
          points_earned?: number | null
          position?: number | null
          prize_amount?: number | null
          spa_points_earned?: number | null
          tournament_id?: string
          updated_at?: string | null
          user_id?: string
          win_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_results_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tournament_reward_templates: {
        Row: {
          club_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          max_participants: number
          name: string
          rank_category: string
          reward_structure: Json
          tournament_type: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_participants: number
          name: string
          rank_category: string
          reward_structure?: Json
          tournament_type?: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          club_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_participants?: number
          name?: string
          rank_category?: string
          reward_structure?: Json
          tournament_type?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_reward_templates_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_seeding: {
        Row: {
          created_at: string | null
          id: string
          seed_position: number
          seeding_method: string | null
          tournament_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          seed_position: number
          seeding_method?: string | null
          tournament_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          seed_position?: number
          seeding_method?: string | null
          tournament_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_seeding_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_special_awards: {
        Row: {
          award_description: string | null
          award_name: string
          cash_amount: number | null
          created_at: string
          criteria: string | null
          elo_points: number | null
          id: string
          is_active: boolean | null
          physical_items: string[] | null
          spa_points: number | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          award_description?: string | null
          award_name: string
          cash_amount?: number | null
          created_at?: string
          criteria?: string | null
          elo_points?: number | null
          id?: string
          is_active?: boolean | null
          physical_items?: string[] | null
          spa_points?: number | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          award_description?: string | null
          award_name?: string
          cash_amount?: number | null
          created_at?: string
          criteria?: string | null
          elo_points?: number | null
          id?: string
          is_active?: boolean | null
          physical_items?: string[] | null
          spa_points?: number | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_special_awards_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_tiers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          min_participants: number
          points_multiplier: number
          qualification_required: boolean
          tier_level: number
          tier_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          min_participants?: number
          points_multiplier?: number
          qualification_required?: boolean
          tier_level: number
          tier_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          min_participants?: number
          points_multiplier?: number
          qualification_required?: boolean
          tier_level?: number
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          allow_all_ranks: boolean | null
          bracket_config: Json | null
          bracket_progression: Json | null
          club_id: string | null
          completed_at: string | null
          contact_info: string | null
          created_at: string
          created_by: string | null
          current_participants: number | null
          current_phase: string | null
          deleted_at: string | null
          description: string | null
          eligible_ranks: string[] | null
          elo_points_config: Json | null
          end_date: string | null
          entry_fee: number | null
          first_prize: number | null
          game_format: string | null
          has_third_place_match: boolean | null
          id: string
          is_draft: boolean | null
          is_public: boolean | null
          is_visible: boolean | null
          management_status: string | null
          max_participants: number | null
          max_rank_requirement: string | null
          min_rank_requirement: string | null
          name: string
          physical_prizes: Json | null
          prize_pool: number | null
          registration_end: string | null
          registration_start: string | null
          requires_approval: boolean | null
          rules: string | null
          second_prize: number | null
          spa_points_config: Json | null
          start_date: string | null
          status: string | null
          third_prize: number | null
          tier_level: number | null
          tournament_end: string | null
          tournament_start: string | null
          tournament_type: string | null
          updated_at: string
          venue_address: string | null
        }
        Insert: {
          allow_all_ranks?: boolean | null
          bracket_config?: Json | null
          bracket_progression?: Json | null
          club_id?: string | null
          completed_at?: string | null
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          current_participants?: number | null
          current_phase?: string | null
          deleted_at?: string | null
          description?: string | null
          eligible_ranks?: string[] | null
          elo_points_config?: Json | null
          end_date?: string | null
          entry_fee?: number | null
          first_prize?: number | null
          game_format?: string | null
          has_third_place_match?: boolean | null
          id?: string
          is_draft?: boolean | null
          is_public?: boolean | null
          is_visible?: boolean | null
          management_status?: string | null
          max_participants?: number | null
          max_rank_requirement?: string | null
          min_rank_requirement?: string | null
          name: string
          physical_prizes?: Json | null
          prize_pool?: number | null
          registration_end?: string | null
          registration_start?: string | null
          requires_approval?: boolean | null
          rules?: string | null
          second_prize?: number | null
          spa_points_config?: Json | null
          start_date?: string | null
          status?: string | null
          third_prize?: number | null
          tier_level?: number | null
          tournament_end?: string | null
          tournament_start?: string | null
          tournament_type?: string | null
          updated_at?: string
          venue_address?: string | null
        }
        Update: {
          allow_all_ranks?: boolean | null
          bracket_config?: Json | null
          bracket_progression?: Json | null
          club_id?: string | null
          completed_at?: string | null
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          current_participants?: number | null
          current_phase?: string | null
          deleted_at?: string | null
          description?: string | null
          eligible_ranks?: string[] | null
          elo_points_config?: Json | null
          end_date?: string | null
          entry_fee?: number | null
          first_prize?: number | null
          game_format?: string | null
          has_third_place_match?: boolean | null
          id?: string
          is_draft?: boolean | null
          is_public?: boolean | null
          is_visible?: boolean | null
          management_status?: string | null
          max_participants?: number | null
          max_rank_requirement?: string | null
          min_rank_requirement?: string | null
          name?: string
          physical_prizes?: Json | null
          prize_pool?: number | null
          registration_end?: string | null
          registration_start?: string | null
          requires_approval?: boolean | null
          rules?: string | null
          second_prize?: number | null
          spa_points_config?: Json | null
          start_date?: string | null
          status?: string | null
          third_prize?: number | null
          tier_level?: number | null
          tournament_end?: string | null
          tournament_start?: string | null
          tournament_type?: string | null
          updated_at?: string
          venue_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_chat_sessions: {
        Row: {
          chat_type: string
          created_at: string
          id: string
          last_message_at: string | null
          status: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_type?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_type?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_penalties: {
        Row: {
          appeal_reason: string | null
          appeal_status: string | null
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean | null
          issued_by: string | null
          penalty_type: string
          reason: string
          severity: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appeal_reason?: string | null
          appeal_status?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          issued_by?: string | null
          penalty_type: string
          reason: string
          severity?: string | null
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appeal_reason?: string | null
          appeal_status?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          issued_by?: string | null
          penalty_type?: string
          reason?: string
          severity?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_penalties_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_penalties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          streak_start_date: string | null
          streak_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_start_date?: string | null
          streak_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_start_date?: string | null
          streak_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          match_id: string | null
          status: string | null
          tournament_id: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          match_id?: string | null
          status?: string | null
          tournament_id?: string | null
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          match_id?: string | null
          status?: string | null
          tournament_id?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          points_balance: number | null
          status: string | null
          total_earned: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          points_balance?: number | null
          status?: string | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          points_balance?: number | null
          status?: string | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      web_vitals_metrics: {
        Row: {
          created_at: string
          id: string
          metric_name: string
          metric_value: number
          page_url: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metric_name: string
          metric_value: number
          page_url: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metric_name?: string
          metric_value?: number
          page_url?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      automation_performance_summary: {
        Row: {
          automation_type: string | null
          avg_execution_time_ms: number | null
          failed_operations: number | null
          hour_bucket: string | null
          max_execution_time_ms: number | null
          min_execution_time_ms: number | null
          successful_operations: number | null
          total_operations: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_challenge: {
        Args:
          | { p_challenge_id: string; p_user_id: string }
          | {
              p_challenge_id: string
              p_user_id: string
              p_scheduled_time?: string
            }
        Returns: Json
      }
      accept_open_challenge: {
        Args: { p_challenge_id: string; p_user_id: string }
        Returns: Json
      }
      add_third_place_match_to_existing_tournament: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      advance_double_elimination_loser: {
        Args: { p_match_id: string; p_loser_id: string }
        Returns: Json
      }
      advance_double_elimination_v9_fixed: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      advance_double_elimination_winner_comprehensive_v2: {
        Args: { p_match_id: string }
        Returns: Json
      }
      advance_double_elimination_winner_comprehensive_v4: {
        Args: { p_match_id: string }
        Returns: Json
      }
      advance_loser_branch_a: {
        Args: {
          p_tournament_id: string
          p_loser_id: string
          p_source_match: number
        }
        Returns: Json
      }
      advance_loser_branch_b: {
        Args: {
          p_tournament_id: string
          p_loser_id: string
          p_source_match: number
        }
        Returns: Json
      }
      advance_loser_to_bracket: {
        Args: { p_match_id: string; p_loser_id: string }
        Returns: Json
      }
      advance_loser_to_bracket_fixed: {
        Args:
          | { p_match_id: string; p_loser_id: string }
          | {
              p_tournament_id: string
              p_winner_match_id: string
              p_loser_id: string
            }
        Returns: Json
      }
      advance_sabo_tournament: {
        Args: { p_match_id: string; p_winner_id: string }
        Returns: Json
      }
      advance_winner_safe: {
        Args: { p_match_id: string }
        Returns: Json
      }
      advance_winner_simplified: {
        Args: { p_match_id: string }
        Returns: Json
      }
      analyze_double1_advancement_patterns: {
        Args: Record<PropertyKey, never>
        Returns: {
          from_round: number
          from_bracket: string
          player_role: string
          to_round: number
          to_bracket: string
          advancement_count: number
          pattern_description: string
        }[]
      }
      apply_tournament_reward_template: {
        Args: { p_tournament_id: string; p_template_id: string }
        Returns: Json
      }
      approve_rank_verification: {
        Args: { p_request_id: string }
        Returns: Json
      }
      assign_loser_to_branch: {
        Args: { p_loser_id: string; p_branch: string; p_tournament_id: string }
        Returns: undefined
      }
      assign_participant_to_next_match: {
        Args: {
          p_tournament_id: string
          p_round: number
          p_participant_id: string
        }
        Returns: undefined
      }
      assign_tournament_result_position: {
        Args: {
          p_tournament_id: string
          p_user_id: string
          p_position: number
          p_matches_played?: number
          p_matches_won?: number
          p_matches_lost?: number
        }
        Returns: Json
      }
      auto_advance_to_final: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      auto_advance_to_semifinal: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      auto_apply_default_tournament_rewards: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      auto_update_single_tournament_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      calculate_club_dashboard_stats: {
        Args: { p_club_id: string }
        Returns: Json
      }
      calculate_final_rankings: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      calculate_player_dashboard_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      calculate_sabo_handicap: {
        Args: {
          p_challenger_rank: Database["public"]["Enums"]["sabo_rank"]
          p_opponent_rank: Database["public"]["Enums"]["sabo_rank"]
          p_stake_amount: number
        }
        Returns: Json
      }
      calculate_tournament_results: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      calculate_tournament_spa: {
        Args: {
          p_player_rank: string
          p_tournament_type?: string
          p_position?: number
        }
        Returns: number
      }
      calculate_trust_score: {
        Args: { p_entity_type: string; p_entity_id: string }
        Returns: number
      }
      can_generate_bracket: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      check_and_award_milestones: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_automation_triggers_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_rank_promotion: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_round_readiness: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      check_sabo_system_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_tournament_advancement_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_tournament_completion_status: {
        Args: { p_tournament_id: string }
        Returns: {
          is_complete: boolean
          completion_details: Json
        }[]
      }
      check_tournament_triggers_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_expired_challenges: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_automation_logs: {
        Args: { p_days_to_keep?: number }
        Returns: Json
      }
      cleanup_old_tournament_data: {
        Args: { p_days_to_keep?: number }
        Returns: Json
      }
      cleanup_sample_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      club_confirm_payment: {
        Args: { p_tournament_id: string; p_user_id: string }
        Returns: boolean
      }
      complete_challenge: {
        Args: {
          p_challenge_id: string
          p_winner_id: string
          p_challenger_score: number
          p_opponent_score: number
        }
        Returns: Json
      }
      complete_challenge_match: {
        Args: {
          p_match_id: string
          p_winner_id: string
          p_loser_id: string
          p_wager_points?: number
        }
        Returns: Json
      }
      complete_challenge_match_with_bonuses: {
        Args: {
          p_match_id: string
          p_winner_id: string
          p_loser_id: string
          p_wager_points?: number
        }
        Returns: Json
      }
      complete_tournament_automatically: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      complete_tournament_workflow: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      create_bulk_notifications: {
        Args: {
          p_user_ids: string[]
          p_type: string
          p_title: string
          p_message: string
          p_priority?: string
        }
        Returns: number
      }
      create_challenge: {
        Args: {
          p_challenger_id: string
          p_opponent_id: string
          p_bet_points?: number
          p_race_to?: number
          p_message?: string
        }
        Returns: string
      }
      create_club_zero_data: {
        Args: { p_club_id: string; p_user_id: string }
        Returns: Json
      }
      create_double_elimination_tournament: {
        Args:
          | { p_tournament_data: Json }
          | {
              p_tournament_id: string
              p_participants: string[]
              p_bracket_style?: string
            }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_message: string
          p_priority?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_sabo_tournament_structure: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      create_tournament_from_double1_template: {
        Args: { p_new_tournament_id: string; p_player_ids: string[] }
        Returns: {
          success: boolean
          message: string
          matches_created: number
          template_used: string
        }[]
      }
      create_tournament_results_template: {
        Args: { p_tournament_id: string; p_max_participants?: number }
        Returns: Json
      }
      credit_spa_points: {
        Args:
          | {
              p_user_id: string
              p_points: number
              p_category: string
              p_description: string
            }
          | {
              p_user_id: string
              p_points: number
              p_description: string
              p_admin_id?: string
            }
        Returns: Json
      }
      debug_and_fix_bracket_advancement: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_apply_tournament_rewards: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      debug_tournament_state: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      edit_confirmed_score: {
        Args: {
          p_match_id: string
          p_new_player1_score: number
          p_new_player2_score: number
          p_admin_id: string
        }
        Returns: Json
      }
      emergency_complete_tournament_match: {
        Args: { p_match_id: string; p_winner_id: string }
        Returns: Json
      }
      expire_old_challenges: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      finalize_tournament: {
        Args: Record<PropertyKey, never> | { p_tournament_id: string }
        Returns: Json
      }
      fix_all_tournament_progression: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      fix_all_unadvanced_tournaments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_bracket_progression: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_complete_bracket_structure: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_double_elimination_bracket_sub_types: {
        Args: { p_tournament_id?: string }
        Returns: Json
      }
      fix_double1_tournament_bracket: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_double6_tournament_immediately: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_duplicate_loser_matches: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      fix_duplicate_players_in_losers: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      fix_loser_bracket_advancements: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      fix_loser_bracket_advancements_corrected: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      fix_loser_bracket_round_1_pairing: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      fix_loser_branch_finals: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_tournament_player_duplicates: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      fix_tournament_positions: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      fix_tournament_test6_progression: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      force_close_tournament_registration: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      force_complete_tournament_status: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      force_generate_tournament_results: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      force_start_tournament: {
        Args: { p_tournament_id: string; p_admin_id?: string }
        Returns: Json
      }
      generate_advanced_tournament_bracket: {
        Args: {
          p_tournament_id: string
          p_seeding_method?: string
          p_force_regenerate?: boolean
        }
        Returns: Json
      }
      generate_all_tournament_rounds: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      generate_complete_bracket: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      generate_complete_tournament_bracket: {
        Args:
          | { p_tournament_id: string }
          | { p_tournament_id: string; p_generation_type?: string }
        Returns: Json
      }
      generate_double_elimination_bracket_complete_v8: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      generate_double_elimination_bracket_v9: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      generate_sabo_tournament_bracket: {
        Args: { p_tournament_id: string; p_seeding_method?: string }
        Returns: Json
      }
      generate_single_elimination_bracket: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      generate_single_elimination_bracket_complete: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      generate_tournament_bracket: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      generate_tournament_results_from_tiers: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      get_15_task_system_status: {
        Args: Record<PropertyKey, never> | { p_tournament_id: string }
        Returns: {
          system_status: Json
        }[]
      }
      get_double_elimination_next_loser_match: {
        Args: { p_match_id: string }
        Returns: string
      }
      get_double_elimination_next_winner_match: {
        Args: { p_match_id: string }
        Returns: string
      }
      get_double_elimination_status: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      get_notification_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_notification_summary: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_player_activity_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_sabo_bracket_info: {
        Args: { p_round: number }
        Returns: Json
      }
      get_tournament_automation_status: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      get_tournament_bracket_status: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      get_tournament_registration_priority: {
        Args: { p_tournament_id: string; p_user_id: string }
        Returns: number
      }
      get_tournament_rewards_structured: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      get_tournaments_needing_attention: {
        Args: Record<PropertyKey, never>
        Returns: {
          tournament_id: string
          tournament_name: string
          status: string
          issue_type: string
          issue_description: string
          matches_completed: number
          matches_total: number
          current_round: number
          max_rounds: number
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_admin_role: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      increment_template_usage: {
        Args: { template_id: string }
        Returns: undefined
      }
      initialize_sabo_tournament: {
        Args: { p_tournament_id: string; p_player_ids: string[] }
        Returns: {
          success: boolean
          message: string
          matches_created: number
        }[]
      }
      initialize_tournament_rewards: {
        Args: { p_tournament_id: string; p_tier_level?: number }
        Returns: Json
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_final_match: {
        Args: { p_match_id: string }
        Returns: boolean
      }
      manage_tournament_state: {
        Args: {
          p_tournament_id: string
          p_new_status: string
          p_admin_id?: string
        }
        Returns: Json
      }
      mark_notifications_read: {
        Args: { p_user_id: string; p_notification_ids: string[] }
        Returns: Json
      }
      migrate_all_tournaments_to_sabo: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      migrate_simple_prize_distribution: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      migrate_tournament_rewards_to_tables: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      migrate_tournament_to_sabo: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      monitor_sabo_performance: {
        Args: Record<PropertyKey, never>
        Returns: {
          tournament_id: string
          avg_processing_time_ms: number
          total_automations: number
          success_rate: number
          last_automation: string
        }[]
      }
      optimize_leaderboard_query: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      populate_default_tournament_rewards: {
        Args: { tournament_id_param: string }
        Returns: Json
      }
      populate_sabo_tournament_players: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      process_challenge_completion: {
        Args: {
          p_challenge_id: string
          p_challenger_score: number
          p_opponent_score: number
          p_submitter_id: string
        }
        Returns: Json
      }
      process_grand_final_completion: {
        Args:
          | { p_tournament_id: string }
          | {
              p_tournament_id: string
              p_completed_match_id: string
              p_winner_id: string
            }
        Returns: {
          success: boolean
          winner_destination: string
          loser_destination: string
        }[]
      }
      process_losers_a_round1_completion: {
        Args: {
          p_tournament_id: string
          p_completed_match_id: string
          p_winner_id: string
        }
        Returns: {
          success: boolean
          winner_destination: string
          loser_destination: string
        }[]
      }
      process_losers_a_round2_completion: {
        Args: {
          p_tournament_id: string
          p_completed_match_id: string
          p_winner_id: string
        }
        Returns: {
          success: boolean
          winner_destination: string
          loser_destination: string
        }[]
      }
      process_losers_a_round3_completion: {
        Args: {
          p_tournament_id: string
          p_completed_match_id: string
          p_winner_id: string
        }
        Returns: {
          success: boolean
          winner_destination: string
          loser_destination: string
        }[]
      }
      process_losers_b_round1_completion: {
        Args: {
          p_tournament_id: string
          p_completed_match_id: string
          p_winner_id: string
        }
        Returns: {
          success: boolean
          winner_destination: string
          loser_destination: string
        }[]
      }
      process_losers_b_round2_completion: {
        Args: {
          p_tournament_id: string
          p_completed_match_id: string
          p_winner_id: string
        }
        Returns: {
          success: boolean
          winner_destination: string
          loser_destination: string
        }[]
      }
      process_losers_r101_completion: {
        Args: Record<PropertyKey, never> | { p_tournament_id: string }
        Returns: Json
      }
      process_losers_r102_completion: {
        Args: Record<PropertyKey, never> | { p_tournament_id: string }
        Returns: Json
      }
      process_losers_r103_completion: {
        Args: Record<PropertyKey, never> | { p_tournament_id: string }
        Returns: Json
      }
      process_losers_r201_completion: {
        Args: Record<PropertyKey, never> | { p_tournament_id: string }
        Returns: Json
      }
      process_losers_r202_completion: {
        Args: Record<PropertyKey, never> | { p_tournament_id: string }
        Returns: Json
      }
      process_refund: {
        Args: { p_transaction_id: string }
        Returns: Json
      }
      process_semifinal_completion: {
        Args: {
          p_tournament_id: string
          p_completed_match_id: string
          p_winner_id: string
        }
        Returns: {
          success: boolean
          winner_destination: string
          loser_destination: string
        }[]
      }
      process_semifinals_completion: {
        Args: Record<PropertyKey, never> | { p_tournament_id: string }
        Returns: Json
      }
      process_tournament_completion: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      process_tournament_match_elo: {
        Args: { p_match_id: string; p_winner_id: string; p_loser_id: string }
        Returns: Json
      }
      process_winners_round1_completion: {
        Args: {
          p_tournament_id: string
          p_completed_match_id: string
          p_winner_id: string
        }
        Returns: {
          success: boolean
          winner_destination: string
          loser_destination: string
        }[]
      }
      process_winners_round2_completion: {
        Args:
          | { p_tournament_id: string }
          | {
              p_tournament_id: string
              p_completed_match_id: string
              p_winner_id: string
            }
        Returns: {
          success: boolean
          winner_destination: string
          loser_destination: string
        }[]
      }
      process_winners_round3_completion: {
        Args:
          | { p_tournament_id: string }
          | {
              p_tournament_id: string
              p_completed_match_id: string
              p_winner_id: string
            }
        Returns: Json
      }
      recalculate_all_player_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      recover_tournament_automation: {
        Args: { p_tournament_id?: string }
        Returns: Json
      }
      recover_tournament_simplified: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      redeem_reward: {
        Args: {
          user_uuid: string
          reward_type: string
          reward_value: string
          points_cost: number
        }
        Returns: Json
      }
      refresh_leaderboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      repair_all_incomplete_tournaments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      repair_double_elimination_bracket: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      repair_double_elimination_v9: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      repair_sabo12_bracket: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      repair_sabo12_bracket_comprehensive: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      repair_tournament_advancement: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      replace_dummy_players_with_registrations: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      reset_and_repair_loser_bracket: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      reset_broken_sabo_tournaments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      retry_failed_sabo_advancements: {
        Args: { p_tournament_id?: string }
        Returns: Json
      }
      route_bracket_generation: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      sabo_system_health_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sabo_tournament_coordinator: {
        Args:
          | Record<PropertyKey, never>
          | { p_tournament_id: string; p_match_id: string }
        Returns: Json
      }
      seed_demo_users: {
        Args: { p_count?: number }
        Returns: Json
      }
      send_enhanced_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_type?: string
          p_auto_popup?: boolean
        }
        Returns: Json
      }
      setup_complete_double1_tournament: {
        Args: { p_tournament_id: string; p_auto_replace_players?: boolean }
        Returns: Json
      }
      setup_final_participants: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      setup_semifinal_from_branches: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      setup_semifinal_from_winners: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      setup_semifinal_participants: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      setup_semifinals_pairings: {
        Args: Record<PropertyKey, never> | { p_tournament_id: string }
        Returns: Json
      }
      simulate_sabo_match_progress: {
        Args: {
          p_challenge_id: string
          p_challenger_score: number
          p_opponent_score: number
          p_add_rack_result?: boolean
        }
        Returns: Json
      }
      standardize_double_elimination_structure: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      submit_double_elimination_score_v9: {
        Args: {
          p_match_id: string
          p_player1_score: number
          p_player2_score: number
        }
        Returns: Json
      }
      submit_sabo_match_score: {
        Args: {
          p_match_id: string
          p_player1_score: number
          p_player2_score: number
          p_submitted_by: string
        }
        Returns: Json
      }
      sync_all_completed_tournament_rewards: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sync_tournament_player_rewards: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      sync_tournament_points_to_rankings: {
        Args: { p_tournament_id?: string }
        Returns: Json
      }
      sync_tournament_rewards_from_tiers: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      sync_tournament_rewards_simple: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      test_advance_winners_r1_to_r2: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      test_auto_advancement: {
        Args: { p_tournament_id: string; p_match_number?: number }
        Returns: Json
      }
      test_double1_template_creation: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_new_sabo_tournament_creation: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_repair_current_tournament: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_tournamentbracketgenerator_fix: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_double_elimination_match_status: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      update_match_score_safe: {
        Args: {
          p_match_id: string
          p_player1_score: number
          p_player2_score: number
          p_submitted_by: string
        }
        Returns: Json
      }
      update_player_stats_from_match: {
        Args: {
          p_player1_id: string
          p_player2_id: string
          p_winner_id: string
        }
        Returns: undefined
      }
      update_rank_verification_simple: {
        Args: { p_request_id: string; p_status: string; p_admin_notes?: string }
        Returns: boolean
      }
      update_tournament_bracket_progression: {
        Args: {
          p_tournament_id: string
          p_progression_key: string
          p_value: boolean
        }
        Returns: Json
      }
      update_tournament_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_wallet_balance: {
        Args: {
          p_user_id: string
          p_amount: number
          p_transaction_type: string
          p_description?: string
        }
        Returns: Json
      }
      update_win_streak: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      validate_double_elimination_structure: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      validate_double1_advancement_rules: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_sabo_tournament_structure: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      validate_tournament_bracket_integrity: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      validate_tournament_structure_against_double1: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      verify_double1_pattern_compliance: {
        Args: { p_tournament_id: string }
        Returns: {
          round_number: number
          bracket_type: string
          expected_matches: number
          actual_matches: number
          compliance_status: string
        }[]
      }
      verify_match_result: {
        Args: { p_match_id: string; p_verifier_id: string }
        Returns: Json
      }
      verify_tournament_advancement: {
        Args: { p_tournament_id: string }
        Returns: {
          success: boolean
          verification_details: Json
        }[]
      }
      verify_tournament_structure: {
        Args: { p_tournament_id: string }
        Returns: {
          round_number: number
          expected_matches: number
          actual_matches: number
          status: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "club_owner" | "user"
      sabo_rank:
        | "K"
        | "K+"
        | "I"
        | "I+"
        | "H"
        | "H+"
        | "G"
        | "G+"
        | "F"
        | "F+"
        | "E"
        | "E+"
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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
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
    Enums: {
      app_role: ["admin", "moderator", "club_owner", "user"],
      sabo_rank: [
        "K",
        "K+",
        "I",
        "I+",
        "H",
        "H+",
        "G",
        "G+",
        "F",
        "F+",
        "E",
        "E+",
      ],
    },
  },
} as const
