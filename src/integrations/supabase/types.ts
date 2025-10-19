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
      admins: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          password: string
          phone: string | null
          profile_image_url: string | null
          surname: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          password: string
          phone?: string | null
          profile_image_url?: string | null
          surname: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          password?: string
          phone?: string | null
          profile_image_url?: string | null
          surname?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
            referencedRelation: "teacher_dashboard_view"
            referencedColumns: ["teacher_id"]
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
      attendance: {
        Row: {
          class_date: string
          created_at: string | null
          enrollment_id: string
          id: string
          late: boolean | null
          notes: string | null
          present: boolean | null
          recorded_by: string | null
        }
        Insert: {
          class_date: string
          created_at?: string | null
          enrollment_id: string
          id?: string
          late?: boolean | null
          notes?: string | null
          present?: boolean | null
          recorded_by?: string | null
        }
        Update: {
          class_date?: string
          created_at?: string | null
          enrollment_id?: string
          id?: string
          late?: boolean | null
          notes?: string | null
          present?: boolean | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
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
        Relationships: []
      }
      classes: {
        Row: {
          class_name: string
          classroom_location: string | null
          created_at: string | null
          current_students: number | null
          end_date: string | null
          end_time: string | null
          id: string
          is_active: boolean | null
          max_students: number | null
          schedule_days: Database["public"]["Enums"]["class_day"][] | null
          stage: Database["public"]["Enums"]["cambridge_stage"]
          start_date: string | null
          start_time: string | null
          teacher_name: string | null
          updated_at: string | null
        }
        Insert: {
          class_name: string
          classroom_location?: string | null
          created_at?: string | null
          current_students?: number | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          schedule_days?: Database["public"]["Enums"]["class_day"][] | null
          stage: Database["public"]["Enums"]["cambridge_stage"]
          start_date?: string | null
          start_time?: string | null
          teacher_name?: string | null
          updated_at?: string | null
        }
        Update: {
          class_name?: string
          classroom_location?: string | null
          created_at?: string | null
          current_students?: number | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          schedule_days?: Database["public"]["Enums"]["class_day"][] | null
          stage?: Database["public"]["Enums"]["cambridge_stage"]
          start_date?: string | null
          start_time?: string | null
          teacher_name?: string | null
          updated_at?: string | null
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
            referencedRelation: "teacher_dashboard_view"
            referencedColumns: ["teacher_id"]
          },
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
      enrollments: {
        Row: {
          attendance_rate: number | null
          class_id: string
          completion_date: string | null
          created_at: string | null
          enrollment_date: string | null
          id: string
          is_active: boolean | null
          progress_notes: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          attendance_rate?: number | null
          class_id: string
          completion_date?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          is_active?: boolean | null
          progress_notes?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          attendance_rate?: number | null
          class_id?: string
          completion_date?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          is_active?: boolean | null
          progress_notes?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "active_students_with_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_skills_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          attended: boolean | null
          child_age: number | null
          child_name: string
          email: string | null
          event_id: string
          id: string
          notes: string | null
          parent_name: string
          payment_status: string | null
          phone: string
          registered_at: string | null
          student_id: string | null
        }
        Insert: {
          attended?: boolean | null
          child_age?: number | null
          child_name: string
          email?: string | null
          event_id: string
          id?: string
          notes?: string | null
          parent_name: string
          payment_status?: string | null
          phone: string
          registered_at?: string | null
          student_id?: string | null
        }
        Update: {
          attended?: boolean | null
          child_age?: number | null
          child_name?: string
          email?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          parent_name?: string
          payment_status?: string | null
          phone?: string
          registered_at?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "upcoming_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "active_students_with_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_skills_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "event_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          age_max: number | null
          age_min: number | null
          created_at: string | null
          current_participants: number | null
          description: string | null
          end_time: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          image_url: string | null
          is_published: boolean | null
          location: string | null
          max_participants: number | null
          price: number | null
          registration_deadline: string | null
          start_time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location?: string | null
          max_participants?: number | null
          price?: number | null
          registration_deadline?: string | null
          start_time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location?: string | null
          max_participants?: number | null
          price?: number | null
          registration_deadline?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          certificate_number: string | null
          certificate_url: string | null
          created_at: string | null
          exam_date: string
          exam_type: Database["public"]["Enums"]["cambridge_exam"]
          id: string
          listening_shields: number | null
          notes: string | null
          reading_writing_shields: number | null
          speaking_shields: number | null
          student_id: string
          total_shields: number | null
          updated_at: string | null
        }
        Insert: {
          certificate_number?: string | null
          certificate_url?: string | null
          created_at?: string | null
          exam_date: string
          exam_type: Database["public"]["Enums"]["cambridge_exam"]
          id?: string
          listening_shields?: number | null
          notes?: string | null
          reading_writing_shields?: number | null
          speaking_shields?: number | null
          student_id: string
          total_shields?: number | null
          updated_at?: string | null
        }
        Update: {
          certificate_number?: string | null
          certificate_url?: string | null
          created_at?: string | null
          exam_date?: string
          exam_type?: Database["public"]["Enums"]["cambridge_exam"]
          id?: string
          listening_shields?: number | null
          notes?: string | null
          reading_writing_shields?: number | null
          speaking_shields?: number | null
          student_id?: string
          total_shields?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "active_students_with_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_skills_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
      inquiries: {
        Row: {
          child_age: number
          child_name: string
          created_at: string | null
          current_level: Database["public"]["Enums"]["english_level"] | null
          email: string | null
          how_did_hear: string | null
          id: string
          interested_in: Database["public"]["Enums"]["inquiry_type"][] | null
          message: string
          parent_id: string | null
          parent_name: string
          phone: string
          preferred_contact:
            | Database["public"]["Enums"]["contact_method"]
            | null
          responded_at: string | null
          responded_by: string | null
          response_notes: string | null
          status: string | null
        }
        Insert: {
          child_age: number
          child_name: string
          created_at?: string | null
          current_level?: Database["public"]["Enums"]["english_level"] | null
          email?: string | null
          how_did_hear?: string | null
          id?: string
          interested_in?: Database["public"]["Enums"]["inquiry_type"][] | null
          message: string
          parent_id?: string | null
          parent_name: string
          phone: string
          preferred_contact?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          responded_at?: string | null
          responded_by?: string | null
          response_notes?: string | null
          status?: string | null
        }
        Update: {
          child_age?: number
          child_name?: string
          created_at?: string | null
          current_level?: Database["public"]["Enums"]["english_level"] | null
          email?: string | null
          how_did_hear?: string | null
          id?: string
          interested_in?: Database["public"]["Enums"]["inquiry_type"][] | null
          message?: string
          parent_id?: string | null
          parent_name?: string
          phone?: string
          preferred_contact?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          responded_at?: string | null
          responded_by?: string | null
          response_notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          added_by: string | null
          created_at: string | null
          curriculum_id: string
          id: string
          notes: string | null
          position: number
          resource_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          curriculum_id: string
          id?: string
          notes?: string | null
          position?: number
          resource_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          curriculum_id?: string
          id?: string
          notes?: string | null
          position?: number
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_resources_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          address: string | null
          agree_to_updates: boolean | null
          created_at: string | null
          email: string | null
          full_name: string
          how_did_hear: string | null
          id: string
          phone: string
          preferred_contact:
            | Database["public"]["Enums"]["contact_method"]
            | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          agree_to_updates?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name: string
          how_did_hear?: string | null
          id?: string
          phone: string
          preferred_contact?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          agree_to_updates?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          how_did_hear?: string | null
          id?: string
          phone?: string
          preferred_contact?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          enrollment_id: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_for: string | null
          payment_method: string | null
          receipt_number: string | null
          student_id: string
          term: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_for?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          student_id: string
          term?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_for?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          student_id?: string
          term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "active_students_with_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_skills_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          base_amount: number
          bonus: number | null
          created_at: string | null
          created_by: string | null
          deductions: number | null
          hourly_rate: number | null
          hours_worked: number | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_status:
            | Database["public"]["Enums"]["payment_status_type"]
            | null
          period_end: string
          period_start: string
          teacher_id: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          base_amount: number
          bonus?: number | null
          created_at?: string | null
          created_by?: string | null
          deductions?: number | null
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?:
            | Database["public"]["Enums"]["payment_status_type"]
            | null
          period_end: string
          period_start: string
          teacher_id: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          base_amount?: number
          bonus?: number | null
          created_at?: string | null
          created_by?: string | null
          deductions?: number | null
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?:
            | Database["public"]["Enums"]["payment_status_type"]
            | null
          period_end?: string
          period_start?: string
          teacher_id?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_dashboard_view"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "payroll_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          file_url: string | null
          id: string
          image_url: string | null
          instructions: string | null
          is_active: boolean | null
          is_public: boolean | null
          materials_needed: string[] | null
          objectives: string[] | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          stage: Database["public"]["Enums"]["cambridge_stage"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          materials_needed?: string[] | null
          objectives?: string[] | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          stage?: Database["public"]["Enums"]["cambridge_stage"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          materials_needed?: string[] | null
          objectives?: string[] | null
          resource_type?: Database["public"]["Enums"]["resource_type"]
          stage?: Database["public"]["Enums"]["cambridge_stage"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          skill_code: string
          skill_name: string
          target_stage: Database["public"]["Enums"]["cambridge_stage"][] | null
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          skill_code: string
          skill_name: string
          target_stage?: Database["public"]["Enums"]["cambridge_stage"][] | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          skill_code?: string
          skill_name?: string
          target_stage?: Database["public"]["Enums"]["cambridge_stage"][] | null
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "teacher_dashboard_view"
            referencedColumns: ["teacher_id"]
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
      student_progress: {
        Row: {
          assessed_by: string | null
          assessment_date: string | null
          created_at: string | null
          enrollment_id: string
          id: string
          level_score: number | null
          notes: string | null
          skill_area: string
          student_id: string
        }
        Insert: {
          assessed_by?: string | null
          assessment_date?: string | null
          created_at?: string | null
          enrollment_id: string
          id?: string
          level_score?: number | null
          notes?: string | null
          skill_area: string
          student_id: string
        }
        Update: {
          assessed_by?: string | null
          assessment_date?: string | null
          created_at?: string | null
          enrollment_id?: string
          id?: string
          level_score?: number | null
          notes?: string | null
          skill_area?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "active_students_with_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_skills_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_skills: {
        Row: {
          assessed_by: string | null
          created_at: string | null
          current_score: number | null
          id: string
          last_assessed_date: string | null
          notes: string | null
          proficiency_level:
            | Database["public"]["Enums"]["proficiency_level"]
            | null
          skill_id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          assessed_by?: string | null
          created_at?: string | null
          current_score?: number | null
          id?: string
          last_assessed_date?: string | null
          notes?: string | null
          proficiency_level?:
            | Database["public"]["Enums"]["proficiency_level"]
            | null
          skill_id: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          assessed_by?: string | null
          created_at?: string | null
          current_score?: number | null
          id?: string
          last_assessed_date?: string | null
          notes?: string | null
          proficiency_level?:
            | Database["public"]["Enums"]["proficiency_level"]
            | null
          skill_id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_skills_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "active_students_with_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_skills_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          age: number | null
          assigned_stage: Database["public"]["Enums"]["cambridge_stage"] | null
          created_at: string | null
          current_level: Database["public"]["Enums"]["english_level"] | null
          date_of_birth: string | null
          enrollment_date: string | null
          full_name: string
          id: string
          notes: string | null
          parent_id: string
          profile_photo_url: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          assigned_stage?: Database["public"]["Enums"]["cambridge_stage"] | null
          created_at?: string | null
          current_level?: Database["public"]["Enums"]["english_level"] | null
          date_of_birth?: string | null
          enrollment_date?: string | null
          full_name: string
          id?: string
          notes?: string | null
          parent_id: string
          profile_photo_url?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          assigned_stage?: Database["public"]["Enums"]["cambridge_stage"] | null
          created_at?: string | null
          current_level?: Database["public"]["Enums"]["english_level"] | null
          date_of_birth?: string | null
          enrollment_date?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          parent_id?: string
          profile_photo_url?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          class_id: string | null
          created_at: string | null
          created_by: string | null
          curriculum_id: string | null
          end_time: string | null
          id: string
          location: string | null
          notes: string | null
          start_time: string | null
          status: string | null
          teacher_id: string
          teaching_date: string
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          curriculum_id?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          start_time?: string | null
          status?: string | null
          teacher_id: string
          teaching_date: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          curriculum_id?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          start_time?: string | null
          status?: string | null
          teacher_id?: string
          teaching_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_dashboard_view"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_notes: {
        Row: {
          created_at: string | null
          id: string
          is_private: boolean | null
          note_text: string
          note_type: string | null
          related_curriculum_id: string | null
          related_skill_id: string | null
          student_id: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note_text: string
          note_type?: string | null
          related_curriculum_id?: string | null
          related_skill_id?: string | null
          student_id: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note_text?: string
          note_type?: string | null
          related_curriculum_id?: string | null
          related_skill_id?: string | null
          student_id?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_notes_related_curriculum_id_fkey"
            columns: ["related_curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_notes_related_skill_id_fkey"
            columns: ["related_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "active_students_with_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_skills_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "teacher_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_dashboard_view"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          address: string | null
          bank_account_number: string | null
          bank_name: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          hourly_rate: number | null
          id: string
          languages_spoken: string[] | null
          qualifications: string[] | null
          specializations: string[] | null
          updated_at: string | null
          years_of_experience: number | null
        }
        Insert: {
          address?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          hourly_rate?: number | null
          id: string
          languages_spoken?: string[] | null
          qualifications?: string[] | null
          specializations?: string[] | null
          updated_at?: string | null
          years_of_experience?: number | null
        }
        Update: {
          address?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          hourly_rate?: number | null
          id?: string
          languages_spoken?: string[] | null
          qualifications?: string[] | null
          specializations?: string[] | null
          updated_at?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "teacher_dashboard_view"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
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
      trial_bookings: {
        Row: {
          assigned_class_id: string | null
          attended: boolean | null
          child_age: number
          child_name: string
          created_at: string | null
          current_level: Database["public"]["Enums"]["english_level"] | null
          email: string | null
          feedback: string | null
          id: string
          parent_name: string
          phone: string
          preferred_date: string | null
          preferred_time: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_class_id?: string | null
          attended?: boolean | null
          child_age: number
          child_name: string
          created_at?: string | null
          current_level?: Database["public"]["Enums"]["english_level"] | null
          email?: string | null
          feedback?: string | null
          id?: string
          parent_name: string
          phone: string
          preferred_date?: string | null
          preferred_time?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_class_id?: string | null
          attended?: boolean | null
          child_age?: number
          child_name?: string
          created_at?: string | null
          current_level?: Database["public"]["Enums"]["english_level"] | null
          email?: string | null
          feedback?: string | null
          id?: string
          parent_name?: string
          phone?: string
          preferred_date?: string | null
          preferred_time?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_bookings_assigned_class_id_fkey"
            columns: ["assigned_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      active_students_with_classes: {
        Row: {
          age: number | null
          assigned_stage: Database["public"]["Enums"]["cambridge_stage"] | null
          attendance_rate: number | null
          class_name: string | null
          class_stage: Database["public"]["Enums"]["cambridge_stage"] | null
          current_level: Database["public"]["Enums"]["english_level"] | null
          enrollment_date: string | null
          id: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          student_name: string | null
          teacher_name: string | null
        }
        Relationships: []
      }
      student_skills_summary: {
        Row: {
          average_score: number | null
          category: Database["public"]["Enums"]["skill_category"] | null
          full_name: string | null
          last_assessed: string | null
          skills_in_category: number | null
          student_id: string | null
        }
        Relationships: []
      }
      teacher_dashboard_view: {
        Row: {
          assigned_classes_count: number | null
          email: string | null
          hourly_rate: number | null
          teacher_id: string | null
          teacher_name: string | null
          total_students: number | null
          upcoming_assignments: number | null
        }
        Relationships: []
      }
      upcoming_events: {
        Row: {
          age_max: number | null
          age_min: number | null
          current_participants: number | null
          description: string | null
          end_time: string | null
          event_date: string | null
          event_type: Database["public"]["Enums"]["event_type"] | null
          id: string | null
          image_url: string | null
          location: string | null
          max_participants: number | null
          price: number | null
          spots_remaining: number | null
          start_time: string | null
          title: string | null
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          current_participants?: number | null
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string | null
          image_url?: string | null
          location?: string | null
          max_participants?: number | null
          price?: number | null
          spots_remaining?: never
          start_time?: string | null
          title?: string | null
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          current_participants?: number | null
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string | null
          image_url?: string | null
          location?: string | null
          max_participants?: number | null
          price?: number | null
          spots_remaining?: never
          start_time?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cambridge_exam: "starters" | "movers" | "flyers"
      cambridge_stage:
        | "stage_1"
        | "stage_2"
        | "stage_3"
        | "stage_4"
        | "stage_5"
        | "stage_6"
      class_day:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      contact_method: "zalo" | "email" | "phone"
      english_level: "beginner" | "some_english" | "confident" | "unsure"
      event_type:
        | "workshop"
        | "exam"
        | "competition"
        | "holiday_camp"
        | "parent_meeting"
        | "cultural_event"
      inquiry_type:
        | "trial_class"
        | "curriculum_info"
        | "center_tour"
        | "event_registration"
        | "pricing"
        | "other"
      payment_status_type:
        | "pending"
        | "paid"
        | "partial"
        | "overdue"
        | "cancelled"
      proficiency_level:
        | "beginner"
        | "elementary"
        | "pre_intermediate"
        | "intermediate"
        | "upper_intermediate"
        | "advanced"
      resource_type:
        | "warmup"
        | "activity"
        | "game"
        | "worksheet"
        | "video"
        | "audio"
        | "presentation"
        | "assessment"
        | "homework"
        | "printable"
      skill_category:
        | "listening"
        | "speaking"
        | "reading"
        | "writing"
        | "vocabulary"
        | "grammar"
        | "pronunciation"
        | "fluency"
        | "comprehension"
        | "social_skills"
      student_status: "inquiry" | "trial" | "active" | "inactive" | "graduated"
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
      cambridge_exam: ["starters", "movers", "flyers"],
      cambridge_stage: [
        "stage_1",
        "stage_2",
        "stage_3",
        "stage_4",
        "stage_5",
        "stage_6",
      ],
      class_day: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      contact_method: ["zalo", "email", "phone"],
      english_level: ["beginner", "some_english", "confident", "unsure"],
      event_type: [
        "workshop",
        "exam",
        "competition",
        "holiday_camp",
        "parent_meeting",
        "cultural_event",
      ],
      inquiry_type: [
        "trial_class",
        "curriculum_info",
        "center_tour",
        "event_registration",
        "pricing",
        "other",
      ],
      payment_status_type: [
        "pending",
        "paid",
        "partial",
        "overdue",
        "cancelled",
      ],
      proficiency_level: [
        "beginner",
        "elementary",
        "pre_intermediate",
        "intermediate",
        "upper_intermediate",
        "advanced",
      ],
      resource_type: [
        "warmup",
        "activity",
        "game",
        "worksheet",
        "video",
        "audio",
        "presentation",
        "assessment",
        "homework",
        "printable",
      ],
      skill_category: [
        "listening",
        "speaking",
        "reading",
        "writing",
        "vocabulary",
        "grammar",
        "pronunciation",
        "fluency",
        "comprehension",
        "social_skills",
      ],
      student_status: ["inquiry", "trial", "active", "inactive", "graduated"],
    },
  },
} as const
