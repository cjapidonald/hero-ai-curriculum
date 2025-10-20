
import React from 'react';
import { useParams } from 'react-router-dom';
import EvaluationDetails from '@/components/teacher/EvaluationDetails';

const EvaluationPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div className="text-center py-8">No evaluation ID provided.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <EvaluationDetails evaluationId={id} />
    </div>
  );
};

export default EvaluationPage;
