import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Skill {
  id: string;
  stage_id: string;
  category: string;
  code: string;
  name: string;
  factor: number | null;
  is_pass_fail: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface StudentSkillEvaluation {
  id: string;
  student_id: string;
  skill_id: string;
  teacher_id: string;
  class_id: string;
  score: number | null;
  max_score: number;
  passed: boolean | null;
  comments: string | null;
  evaluation_date: string;
  created_at: string;
  updated_at: string;
}

export interface HomeworkAssignment {
  id: string;
  skill_id: string;
  student_id: string;
  teacher_id: string;
  class_id: string;
  title: string;
  description: string | null;
  resource_id: string | null;
  due_date: string | null;
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  submitted_at: string | null;
  submission_notes: string | null;
  teacher_feedback: string | null;
  feedback_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  student_id: string;
  type: 'homework_assigned' | 'homework_graded' | 'skill_improvement' | 'general';
  title: string;
  message: string;
  homework_id: string | null;
  skill_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const useFormativeAssessment = (teacherId: string) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSkills = useCallback(async (stageId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('skills')
        .select('*')
        .order('display_order', { ascending: true });

      if (stageId) {
        query = query.eq('stage_id', stageId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast({
        title: 'Error',
        description: 'Failed to load skills',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchStudentEvaluations = async (studentId: string, skillId?: string) => {
    try {
      let query = supabase
        .from('student_skill_evaluations')
        .select('*')
        .eq('student_id', studentId)
        .order('evaluation_date', { ascending: false });

      if (skillId) {
        query = query.eq('skill_id', skillId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load evaluations',
        variant: 'destructive',
      });
      return [];
    }
  };

  const createEvaluation = async (evaluation: Omit<StudentSkillEvaluation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('student_skill_evaluations')
        .insert(evaluation)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Evaluation created successfully',
      });

      return data;
    } catch (error) {
      console.error('Error creating evaluation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create evaluation',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateEvaluation = async (id: string, updates: Partial<StudentSkillEvaluation>) => {
    try {
      const { data, error } = await supabase
        .from('student_skill_evaluations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Evaluation updated successfully',
      });

      return data;
    } catch (error) {
      console.error('Error updating evaluation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update evaluation',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const assignHomework = async (homework: Omit<HomeworkAssignment, 'id' | 'created_at' | 'updated_at' | 'status' | 'submitted_at' | 'submission_notes' | 'teacher_feedback' | 'feedback_date'>) => {
    try {
      const { data, error } = await supabase
        .from('homework_assignments')
        .insert(homework)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Homework assigned successfully. Student will be notified.',
      });

      return data;
    } catch (error) {
      console.error('Error assigning homework:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign homework',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const fetchStudentHomework = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('homework_assignments')
        .select('*, skills(name, code, category)')
        .eq('student_id', studentId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching homework:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return {
    skills,
    loading,
    fetchSkills,
    fetchStudentEvaluations,
    createEvaluation,
    updateEvaluation,
    assignHomework,
    fetchStudentHomework,
  };
};

export const useNotifications = (studentId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const notifs = data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('student_id', studentId)
        .eq('is_read', false);

      if (error) throw error;
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel(`notifications:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, studentId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
};
