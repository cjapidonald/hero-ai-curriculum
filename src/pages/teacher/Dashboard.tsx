
import React from 'react';
import EvaluationsList from '@/components/teacher/EvaluationsList';

const TeacherDashboard = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">My Dashboard</h1>
      <EvaluationsList mode="teacher" />
    </div>
  );
};

export default TeacherDashboard;
