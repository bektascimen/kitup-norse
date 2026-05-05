export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          cover_image_url: string | null;
          created_at: string;
          day_count: number;
          description_key: string;
          difficulty: Database['public']['Enums']['difficulty'];
          id: string;
          slug: string;
          status: Database['public']['Enums']['course_status'];
          title_key: string;
          tone: string | null;
        };
        Insert: {
          cover_image_url?: string | null;
          created_at?: string;
          day_count: number;
          description_key: string;
          difficulty?: Database['public']['Enums']['difficulty'];
          id?: string;
          slug: string;
          status?: Database['public']['Enums']['course_status'];
          title_key: string;
          tone?: string | null;
        };
        Update: {
          cover_image_url?: string | null;
          created_at?: string;
          day_count?: number;
          description_key?: string;
          difficulty?: Database['public']['Enums']['difficulty'];
          id?: string;
          slug?: string;
          status?: Database['public']['Enums']['course_status'];
          title_key?: string;
          tone?: string | null;
        };
        Relationships: [];
      };
      generation_jobs: {
        Row: {
          created_at: string;
          error_msg: string | null;
          id: string;
          input_payload: Json;
          output_ref: string | null;
          requested_by: string | null;
          status: Database['public']['Enums']['job_status'];
          type: Database['public']['Enums']['job_type'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error_msg?: string | null;
          id?: string;
          input_payload: Json;
          output_ref?: string | null;
          requested_by?: string | null;
          status?: Database['public']['Enums']['job_status'];
          type: Database['public']['Enums']['job_type'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error_msg?: string | null;
          id?: string;
          input_payload?: Json;
          output_ref?: string | null;
          requested_by?: string | null;
          status?: Database['public']['Enums']['job_status'];
          type?: Database['public']['Enums']['job_type'];
          updated_at?: string;
        };
        Relationships: [];
      };
      lessons: {
        Row: {
          audio_url: string | null;
          body_key: string;
          course_id: string;
          created_at: string;
          day_number: number;
          est_minutes: number;
          hero_image_url: string | null;
          id: string;
          title_key: string;
        };
        Insert: {
          audio_url?: string | null;
          body_key: string;
          course_id: string;
          created_at?: string;
          day_number: number;
          est_minutes?: number;
          hero_image_url?: string | null;
          id?: string;
          title_key: string;
        };
        Update: {
          audio_url?: string | null;
          body_key?: string;
          course_id?: string;
          created_at?: string;
          day_number?: number;
          est_minutes?: number;
          hero_image_url?: string | null;
          id?: string;
          title_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lessons_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          anonymous: boolean;
          created_at: string;
          display_name: string | null;
          id: string;
          locale: string;
          notification_time: string;
        };
        Insert: {
          anonymous?: boolean;
          created_at?: string;
          display_name?: string | null;
          id: string;
          locale?: string;
          notification_time?: string;
        };
        Update: {
          anonymous?: boolean;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          locale?: string;
          notification_time?: string;
        };
        Relationships: [];
      };
      quiz_options: {
        Row: {
          id: string;
          is_correct: boolean;
          label_key: string;
          position: number;
          question_id: string;
        };
        Insert: {
          id?: string;
          is_correct?: boolean;
          label_key: string;
          position: number;
          question_id: string;
        };
        Update: {
          id?: string;
          is_correct?: boolean;
          label_key?: string;
          position?: number;
          question_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quiz_options_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'quiz_questions';
            referencedColumns: ['id'];
          },
        ];
      };
      quiz_questions: {
        Row: {
          explanation_key: string | null;
          id: string;
          position: number;
          quiz_id: string;
          stem_key: string;
          type: Database['public']['Enums']['quiz_question_type'];
        };
        Insert: {
          explanation_key?: string | null;
          id?: string;
          position: number;
          quiz_id: string;
          stem_key: string;
          type: Database['public']['Enums']['quiz_question_type'];
        };
        Update: {
          explanation_key?: string | null;
          id?: string;
          position?: number;
          quiz_id?: string;
          stem_key?: string;
          type?: Database['public']['Enums']['quiz_question_type'];
        };
        Relationships: [
          {
            foreignKeyName: 'quiz_questions_quiz_id_fkey';
            columns: ['quiz_id'];
            isOneToOne: false;
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          },
        ];
      };
      quizzes: {
        Row: {
          id: string;
          lesson_id: string;
          pass_threshold: number;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          pass_threshold?: number;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          pass_threshold?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'quizzes_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: true;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
        ];
      };
      review_queue: {
        Row: {
          due_at: string;
          ease_factor: number;
          id: string;
          interval_days: number;
          question_id: string;
          user_id: string;
        };
        Insert: {
          due_at: string;
          ease_factor?: number;
          id?: string;
          interval_days?: number;
          question_id: string;
          user_id: string;
        };
        Update: {
          due_at?: string;
          ease_factor?: number;
          id?: string;
          interval_days?: number;
          question_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_queue_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'quiz_questions';
            referencedColumns: ['id'];
          },
        ];
      };
      translations: {
        Row: {
          key: string;
          locale: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          key: string;
          locale: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          key?: string;
          locale?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      user_bookmarks: {
        Row: {
          created_at: string;
          lesson_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          lesson_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          lesson_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_bookmarks_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
        ];
      };
      user_progress: {
        Row: {
          attempts: number;
          completed_at: string | null;
          lesson_id: string;
          score: number | null;
          user_id: string;
        };
        Insert: {
          attempts?: number;
          completed_at?: string | null;
          lesson_id: string;
          score?: number | null;
          user_id: string;
        };
        Update: {
          attempts?: number;
          completed_at?: string | null;
          lesson_id?: string;
          score?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_progress_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
        ];
      };
      user_streaks: {
        Row: {
          current_streak: number;
          last_active_date: string | null;
          longest_streak: number;
          user_id: string;
        };
        Insert: {
          current_streak?: number;
          last_active_date?: string | null;
          longest_streak?: number;
          user_id: string;
        };
        Update: {
          current_streak?: number;
          last_active_date?: string | null;
          longest_streak?: number;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      course_status: 'draft' | 'published' | 'archived';
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      job_status: 'pending' | 'running' | 'done' | 'failed';
      job_type: 'course' | 'translation' | 'quiz';
      quiz_question_type: 'multiple_choice' | 'true_false';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      course_status: ['draft', 'published', 'archived'],
      difficulty: ['beginner', 'intermediate', 'advanced'],
      job_status: ['pending', 'running', 'done', 'failed'],
      job_type: ['course', 'translation', 'quiz'],
      quiz_question_type: ['multiple_choice', 'true_false'],
    },
  },
} as const;
