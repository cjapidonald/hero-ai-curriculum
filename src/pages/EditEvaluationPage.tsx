
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ClassroomObservationForm, {
  ClassroomObservationFormProps,
  ObservationClass,
} from '@/components/teacher/ClassroomObservationForm';
import { supabase } from '@/integrations/supabase/client';

const EditEvaluationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<ClassroomObservationFormProps['teacher'] | null>(null);
  const [classes, setClasses] = useState<ObservationClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('No evaluation ID provided.');
      return;
    }

    const fetchEvaluation = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: evaluationData, error: evaluationError } = await supabase
          .from('teacher_evaluations' as any)
          .select(`
            id,
            teacher:teachers (
              id,
              name,
              surname,
              assigned_classes
            ),
            class:classes!teacher_evaluations_class_id_fkey (
              id,
              class_name,
              classroom,
              classroom_location,
              current_students,
              end_date,
              end_time,
              is_active,
              level,
              max_students,
              schedule,
              schedule_days,
              stage,
              start_date,
              start_time,
              teacher_id,
              teacher_name,
              updated_at
            )
          `)
          .eq('id', id)
          .single();

        if (evaluationError) throw evaluationError;

        if (!evaluationData?.teacher) {
          setError('Teacher information for this evaluation could not be found.');
          setTeacher(null);
          setClasses([]);
          return;
        }

        const teacherData = evaluationData.teacher as ClassroomObservationFormProps['teacher'];
        setTeacher(teacherData);

        const { data: teacherClassesData, error: teacherClassesError } = await supabase
          .from('classes' as any)
          .select('*')
          .eq('teacher_id', teacherData.id);

        if (teacherClassesError) throw teacherClassesError;

        let combinedClasses = (teacherClassesData as ObservationClass[] | null) ?? [];

        if (evaluationData.class) {
          const evaluationClass = evaluationData.class as ObservationClass;
          const alreadyIncluded = combinedClasses.some((cls) => cls.id === evaluationClass.id);
          if (!alreadyIncluded) {
            combinedClasses = [...combinedClasses, evaluationClass];
          }
        }

        setClasses(combinedClasses);
      } catch (err: any) {
        console.error('Error loading evaluation data:', err);
        setError(err.message || 'Failed to load evaluation data.');
        setTeacher(null);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [id]);

  if (!id) {
    return <div className="text-center py-8">No evaluation ID provided.</div>;
  }

  if (loading) {
    return <div className="text-center py-8">Loading evaluation...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (!teacher) {
    return <div className="text-center py-8">Evaluation not found.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <ClassroomObservationForm
        teacher={teacher}
        classes={classes}
        onClose={() => navigate(-1)}
      />
    </div>
  );
};

export default EditEvaluationPage;
