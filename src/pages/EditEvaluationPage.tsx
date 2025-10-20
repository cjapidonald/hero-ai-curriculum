
import React from 'react';
import { useParams } from 'react-router-dom';
import ClassroomObservationForm from '@/components/teacher/ClassroomObservationForm';

const EditEvaluationPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div className="text-center py-8">No evaluation ID provided.</div>;
  }

  // The ClassroomObservationForm will now fetch all necessary data
  return (
    <div className="container mx-auto py-8">
      <ClassroomObservationForm evaluationId={id} />
    </div>
  );
};

export default EditEvaluationPage;
