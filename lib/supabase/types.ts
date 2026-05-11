export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      meta_user_tokens: {
        Row: {
          user_id: string;
          access_token: string;
          token_expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          access_token: string;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          access_token?: string;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      meta_ad_accounts: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          meta_account_id: string;
          name: string;
          status: string;
          token_status: string;
          token_expires_at: string | null;
          connected_at: string;
          last_activity_at: string | null;
          monthly_spend: number;
          spend_delta: string | null;
          spend_delta_type: string;
          total_ads: number;
          ads_this_month: number;
          approval_rate: number | null;
          approval_delta: string | null;
          default_budget: number | null;
          default_structure: string | null;
          default_anti_spy: boolean | null;
          spend_history: Json;
          spend_series_extended: Json;
          recent_uploads: Json;
          ads_approved: number | null;
          ads_pending: number | null;
          ads_rejected: number | null;
          uploads_in_period: number | null;
          uploads_with_error: number | null;
          nickname: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id?: string | null;
          meta_account_id: string;
          name: string;
          status?: string;
          token_status?: string;
          token_expires_at?: string | null;
          connected_at?: string;
          last_activity_at?: string | null;
          monthly_spend?: number;
          spend_delta?: string | null;
          spend_delta_type?: string;
          total_ads?: number;
          ads_this_month?: number;
          approval_rate?: number | null;
          approval_delta?: string | null;
          default_budget?: number | null;
          default_structure?: string | null;
          default_anti_spy?: boolean | null;
          spend_history?: Json;
          spend_series_extended?: Json;
          recent_uploads?: Json;
          ads_approved?: number | null;
          ads_pending?: number | null;
          ads_rejected?: number | null;
          uploads_in_period?: number | null;
          uploads_with_error?: number | null;
          nickname?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workspace_id?: string | null;
          meta_account_id?: string;
          name?: string;
          status?: string;
          token_status?: string;
          token_expires_at?: string | null;
          connected_at?: string;
          last_activity_at?: string | null;
          monthly_spend?: number;
          spend_delta?: string | null;
          spend_delta_type?: string;
          total_ads?: number;
          ads_this_month?: number;
          approval_rate?: number | null;
          approval_delta?: string | null;
          default_budget?: number | null;
          default_structure?: string | null;
          default_anti_spy?: boolean | null;
          spend_history?: Json;
          spend_series_extended?: Json;
          recent_uploads?: Json;
          ads_approved?: number | null;
          ads_pending?: number | null;
          ads_rejected?: number | null;
          uploads_in_period?: number | null;
          uploads_with_error?: number | null;
          nickname?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campanhas: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          name: string;
          account_name: string;
          account_meta_id: string;
          structure: string;
          objective: string;
          daily_budget: number;
          anti_spy: boolean;
          status: string;
          ads_created: number;
          ads_total: number;
          created_at: string;
          trend: Json;
          creatives: Json;
          errors: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id?: string | null;
          name: string;
          account_name: string;
          account_meta_id: string;
          structure: string;
          objective: string;
          daily_budget?: number;
          anti_spy?: boolean;
          status?: string;
          ads_created?: number;
          ads_total?: number;
          created_at?: string;
          trend?: Json;
          creatives?: Json;
          errors?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          workspace_id?: string | null;
          name?: string;
          account_name?: string;
          account_meta_id?: string;
          structure?: string;
          objective?: string;
          daily_budget?: number;
          anti_spy?: boolean;
          status?: string;
          ads_created?: number;
          ads_total?: number;
          created_at?: string;
          trend?: Json;
          creatives?: Json;
          errors?: Json | null;
        };
        Relationships: [];
      };
      upload_jobs: {
        Row: {
          id: string;
          user_id: string;
          account_name: string;
          total: number;
          done: number;
          status: string;
          started_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_name: string;
          total?: number;
          done?: number;
          status?: string;
          started_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_name?: string;
          total?: number;
          done?: number;
          status?: string;
          started_at?: string;
        };
        Relationships: [];
      };
      activity_events: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          message: string;
          account: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          message: string;
          account: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          message?: string;
          account?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      home_kpis: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          value: string;
          delta: string | null;
          delta_type: string;
          icon_color: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          value: string;
          delta?: string | null;
          delta_type?: string;
          icon_color?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          value?: string;
          delta?: string | null;
          delta_type?: string;
          icon_color?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      creative_library_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          format: string;
          status: string;
          campaigns_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          format: string;
          status?: string;
          campaigns_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          format?: string;
          status?: string;
          campaigns_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_publicos: {
        Row: {
          id: string;
          user_id: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          payload: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
