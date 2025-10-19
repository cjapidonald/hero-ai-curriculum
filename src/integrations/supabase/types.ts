export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assessment: {
        Row: {
          assessment_date: string | null
          class: string | null
          created_at: string | null
          feedback: string | null
          id: string
          published: boolean | null
          r1: string | null
          r1_score: number | null
          r2: string | null
          r2_score: number | null
          r3: string | null
          r3_score: number | null
          r4: string | null
          r4_score: number | null
          r5: string | null
          r5_score: number | null
          rubrics: string | null
          student_id: string | null
          student_name: string
          teacher_id: string | null
          test_name: string
          total_score: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_date?: string | null
          class?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          published?: boolean | null
          r1?: string | null
          r1_score?: number | null
          r2?: string | null
          r2_score?: number | null
          r3?: string | null
          r3_score?: number | null
          r4?: string | null
          r4_score?: number | null
          r5?: string | null
          r5_score?: number | null
          rubrics?: string | null
          student_id?: string | null
          student_name: string
          teacher_id?: string | null
          test_name: string
          total_score?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_date?: string | null
          class?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          published?: boolean | null
          r1?: string | null
          r1_score?: number | null
          r2?: string | null
          r2_score?: number | null
          r3?: string | null
          r3_score?: number | null
          r4?: string | null
          r4_score?: number | null
          r5?: string | null
          r5_score?: number | null
          rubrics?: string | null
          student_id?: string | null
          student_name?: string
          teacher_id?: string | null
          test_name?: string
          total_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "dashboard_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string | null
          author_id: string | null
          category: string | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          published: boolean | null
          published_date: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          published_date?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          published_date?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          child_age: number | null
          child_name: string
          consent_updates: boolean | null
          contact_method: string | null
          created_at: string | null
          email: string | null
          english_level: string | null
          heard_from: string | null
          id: string
          interests: string[] | null
          message: string | null
          parent_name: string
          phone: string
        }
        Insert: {
          child_age?: number | null
          child_name: string
          consent_updates?: boolean | null
          contact_method?: string | null
          created_at?: string | null
          email?: string | null
          english_level?: string | null
          heard_from?: string | null
          id?: string
          interests?: string[] | null
          message?: string | null
          parent_name: string
          phone: string
        }
        Update: {
          child_age?: number | null
          child_name?: string
          consent_updates?: boolean | null
          contact_method?: string | null
          created_at?: string | null
          email?: string | null
          english_level?: string | null
          heard_from?: string | null
          id?: string
          interests?: string[] | null
          message?: string | null
          parent_name?: string
          phone?: string
        }
        Relationships: []
      }
      curriculum: {
        Row: {
          a1_name: string | null
          a1_type: string | null
          a1_url: string | null
          a2_name: string | null
          a2_type: string | null
          a2_url: string | null
          a3_name: string | null
          a3_type: string | null
          a3_url: string | null
          a4_name: string | null
          a4_type: string | null
          a4_url: string | null
          created_at: string | null
          hw1_name: string | null
          hw1_type: string | null
          hw1_url: string | null
          hw2_name: string | null
          hw2_type: string | null
          hw2_url: string | null
          hw3_name: string | null
          hw3_type: string | null
          hw3_url: string | null
          hw4_name: string | null
          hw4_type: string | null
          hw4_url: string | null
          hw5_name: string | null
          hw5_type: string | null
          hw5_url: string | null
          hw6_name: string | null
          hw6_type: string | null
          hw6_url: string | null
          id: string
          lesson_date: string | null
          lesson_skills: string | null
          lesson_title: string
          ma1_name: string | null
          ma1_type: string | null
          ma1_url: string | null
          ma2_name: string | null
          ma2_type: string | null
          ma2_url: string | null
          ma3_name: string | null
          ma3_type: string | null
          ma3_url: string | null
          ma4_name: string | null
          ma4_type: string | null
          ma4_url: string | null
          ma5_name: string | null
          ma5_type: string | null
          ma5_url: string | null
          p1_name: string | null
          p1_type: string | null
          p1_url: string | null
          p2_name: string | null
          p2_type: string | null
          p2_url: string | null
          p3_name: string | null
          p3_type: string | null
          p3_url: string | null
          p4_name: string | null
          p4_type: string | null
          p4_url: string | null
          subject: string | null
          success_criteria: string | null
          teacher_id: string | null
          teacher_name: string | null
          updated_at: string | null
          wp1_name: string | null
          wp1_type: string | null
          wp1_url: string | null
          wp2_name: string | null
          wp2_type: string | null
          wp2_url: string | null
          wp3_name: string | null
          wp3_type: string | null
          wp3_url: string | null
          wp4_name: string | null
          wp4_type: string | null
          wp4_url: string | null
        }
        Insert: {
          a1_name?: string | null
          a1_type?: string | null
          a1_url?: string | null
          a2_name?: string | null
          a2_type?: string | null
          a2_url?: string | null
          a3_name?: string | null
          a3_type?: string | null
          a3_url?: string | null
          a4_name?: string | null
          a4_type?: string | null
          a4_url?: string | null
          created_at?: string | null
          hw1_name?: string | null
          hw1_type?: string | null
          hw1_url?: string | null
          hw2_name?: string | null
          hw2_type?: string | null
          hw2_url?: string | null
          hw3_name?: string | null
          hw3_type?: string | null
          hw3_url?: string | null
          hw4_name?: string | null
          hw4_type?: string | null
          hw4_url?: string | null
          hw5_name?: string | null
          hw5_type?: string | null
          hw5_url?: string | null
          hw6_name?: string | null
          hw6_type?: string | null
          hw6_url?: string | null
          id?: string
          lesson_date?: string | null
          lesson_skills?: string | null
          lesson_title: string
          ma1_name?: string | null
          ma1_type?: string | null
          ma1_url?: string | null
          ma2_name?: string | null
          ma2_type?: string | null
          ma2_url?: string | null
          ma3_name?: string | null
          ma3_type?: string | null
          ma3_url?: string | null
          ma4_name?: string | null
          ma4_type?: string | null
          ma4_url?: string | null
          ma5_name?: string | null
          ma5_type?: string | null
          ma5_url?: string | null
          p1_name?: string | null
          p1_type?: string | null
          p1_url?: string | null
          p2_name?: string | null
          p2_type?: string | null
          p2_url?: string | null
          p3_name?: string | null
          p3_type?: string | null
          p3_url?: string | null
          p4_name?: string | null
          p4_type?: string | null
          p4_url?: string | null
          subject?: string | null
          success_criteria?: string | null
          teacher_id?: string | null
          teacher_name?: string | null
          updated_at?: string | null
          wp1_name?: string | null
          wp1_type?: string | null
          wp1_url?: string | null
          wp2_name?: string | null
          wp2_type?: string | null
          wp2_url?: string | null
          wp3_name?: string | null
          wp3_type?: string | null
          wp3_url?: string | null
          wp4_name?: string | null
          wp4_type?: string | null
          wp4_url?: string | null
        }
        Update: {
          a1_name?: string | null
          a1_type?: string | null
          a1_url?: string | null
          a2_name?: string | null
          a2_type?: string | null
          a2_url?: string | null
          a3_name?: string | null
          a3_type?: string | null
          a3_url?: string | null
          a4_name?: string | null
          a4_type?: string | null
          a4_url?: string | null
          created_at?: string | null
          hw1_name?: string | null
          hw1_type?: string | null
          hw1_url?: string | null
          hw2_name?: string | null
          hw2_type?: string | null
          hw2_url?: string | null
          hw3_name?: string | null
          hw3_type?: string | null
          hw3_url?: string | null
          hw4_name?: string | null
          hw4_type?: string | null
          hw4_url?: string | null
          hw5_name?: string | null
          hw5_type?: string | null
          hw5_url?: string | null
          hw6_name?: string | null
          hw6_type?: string | null
          hw6_url?: string | null
          id?: string
          lesson_date?: string | null
          lesson_skills?: string | null
          lesson_title?: string
          ma1_name?: string | null
          ma1_type?: string | null
          ma1_url?: string | null
          ma2_name?: string | null
          ma2_type?: string | null
          ma2_url?: string | null
          ma3_name?: string | null
          ma3_type?: string | null
          ma3_url?: string | null
          ma4_name?: string | null
          ma4_type?: string | null
          ma4_url?: string | null
          ma5_name?: string | null
          ma5_type?: string | null
          ma5_url?: string | null
          p1_name?: string | null
          p1_type?: string | null
          p1_url?: string | null
          p2_name?: string | null
          p2_type?: string | null
          p2_url?: string | null
          p3_name?: string | null
          p3_type?: string | null
          p3_url?: string | null
          p4_name?: string | null
          p4_type?: string | null
          p4_url?: string | null
          subject?: string | null
          success_criteria?: string | null
          teacher_id?: string | null
          teacher_name?: string | null
          updated_at?: string | null
          wp1_name?: string | null
          wp1_type?: string | null
          wp1_url?: string | null
          wp2_name?: string | null
          wp2_type?: string | null
          wp2_url?: string | null
          wp3_name?: string | null
          wp3_type?: string | null
          wp3_url?: string | null
          wp4_name?: string | null
          wp4_type?: string | null
          wp4_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_students: {
        Row: {
          attendance_rate: number | null
          birthday: string | null
          class: string | null
          created_at: string | null
          email: string
          gender: string | null
          id: string
          is_active: boolean | null
          level: string | null
          location: string | null
          name: string
          parent_name: string | null
          parent_zalo_nr: string | null
          password: string | null
          placement_test_listening: string | null
          placement_test_reading: string | null
          placement_test_speaking: string | null
          placement_test_writing: string | null
          profile_image_url: string | null
          sessions: number | null
          sessions_left: number | null
          subject: string | null
          surname: string
          updated_at: string | null
        }
        Insert: {
          attendance_rate?: number | null
          birthday?: string | null
          class?: string | null
          created_at?: string | null
          email: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          location?: string | null
          name: string
          parent_name?: string | null
          parent_zalo_nr?: string | null
          password?: string | null
          placement_test_listening?: string | null
          placement_test_reading?: string | null
          placement_test_speaking?: string | null
          placement_test_writing?: string | null
          profile_image_url?: string | null
          sessions?: number | null
          sessions_left?: number | null
          subject?: string | null
          surname: string
          updated_at?: string | null
        }
        Update: {
          attendance_rate?: number | null
          birthday?: string | null
          class?: string | null
          created_at?: string | null
          email?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          location?: string | null
          name?: string
          parent_name?: string | null
          parent_zalo_nr?: string | null
          password?: string | null
          placement_test_listening?: string | null
          placement_test_reading?: string | null
          placement_test_speaking?: string | null
          placement_test_writing?: string | null
          profile_image_url?: string | null
          sessions?: number | null
          sessions_left?: number | null
          subject?: string | null
          surname?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          child_age: number
          child_name: string
          created_at: string | null
          email: string | null
          event_name: string
          id: string
          parent_name: string
          phone: string
          photo_consent: boolean | null
          special_needs: string | null
        }
        Insert: {
          child_age: number
          child_name: string
          created_at?: string | null
          email?: string | null
          event_name: string
          id?: string
          parent_name: string
          phone: string
          photo_consent?: boolean | null
          special_needs?: string | null
        }
        Update: {
          child_age?: number
          child_name?: string
          created_at?: string | null
          email?: string | null
          event_name?: string
          id?: string
          parent_name?: string
          phone?: string
          photo_consent?: boolean | null
          special_needs?: string | null
        }
        Relationships: []
      }
      homework_completion: {
        Row: {
          completed: boolean | null
          completed_date: string | null
          created_at: string | null
          curriculum_id: string | null
          homework_item: string | null
          id: string
          notes: string | null
          student_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string | null
          curriculum_id?: string | null
          homework_item?: string | null
          id?: string
          notes?: string | null
          student_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string | null
          curriculum_id?: string | null
          homework_item?: string | null
          id?: string
          notes?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_completion_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_completion_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "dashboard_students"
            referencedColumns: ["id"]
          },
        ]
      }
      skills_evaluation: {
        Row: {
          average_score: number | null
          class: string | null
          created_at: string | null
          e1: string | null
          e1_score: number | null
          e2: string | null
          e2_score: number | null
          e3: string | null
          e3_score: number | null
          e4: string | null
          e4_score: number | null
          e5: string | null
          e5_score: number | null
          e6: string | null
          e6_score: number | null
          evaluation_date: string | null
          id: string
          notes: string | null
          skill_category: string | null
          skill_name: string
          student_id: string | null
          student_name: string
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          average_score?: number | null
          class?: string | null
          created_at?: string | null
          e1?: string | null
          e1_score?: number | null
          e2?: string | null
          e2_score?: number | null
          e3?: string | null
          e3_score?: number | null
          e4?: string | null
          e4_score?: number | null
          e5?: string | null
          e5_score?: number | null
          e6?: string | null
          e6_score?: number | null
          evaluation_date?: string | null
          id?: string
          notes?: string | null
          skill_category?: string | null
          skill_name: string
          student_id?: string | null
          student_name: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          average_score?: number | null
          class?: string | null
          created_at?: string | null
          e1?: string | null
          e1_score?: number | null
          e2?: string | null
          e2_score?: number | null
          e3?: string | null
          e3_score?: number | null
          e4?: string | null
          e4_score?: number | null
          e5?: string | null
          e5_score?: number | null
          e6?: string | null
          e6_score?: number | null
          evaluation_date?: string | null
          id?: string
          notes?: string | null
          skill_category?: string | null
          skill_name?: string
          student_id?: string | null
          student_name?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_evaluation_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "dashboard_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_evaluation_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_payroll: {
        Row: {
          attendance_status: string | null
          bonus_amount: number | null
          class_name: string
          created_at: string | null
          deduction_amount: number | null
          hourly_rate: number | null
          hours_taught: number | null
          id: string
          lesson_title: string | null
          notes: string | null
          payout_date: string | null
          payout_status: string | null
          session_date: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          attendance_status?: string | null
          bonus_amount?: number | null
          class_name: string
          created_at?: string | null
          deduction_amount?: number | null
          hourly_rate?: number | null
          hours_taught?: number | null
          id?: string
          lesson_title?: string | null
          notes?: string | null
          payout_date?: string | null
          payout_status?: string | null
          session_date: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          attendance_status?: string | null
          bonus_amount?: number | null
          class_name?: string
          created_at?: string | null
          deduction_amount?: number | null
          hourly_rate?: number | null
          hours_taught?: number | null
          id?: string
          lesson_title?: string | null
          notes?: string | null
          payout_date?: string | null
          payout_status?: string | null
          session_date?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_payroll_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          password: string | null
          phone: string | null
          profile_image_url: string | null
          subject: string | null
          surname: string
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          password?: string | null
          phone?: string | null
          profile_image_url?: string | null
          subject?: string | null
          surname: string
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          password?: string | null
          phone?: string | null
          profile_image_url?: string | null
          subject?: string | null
          surname?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
