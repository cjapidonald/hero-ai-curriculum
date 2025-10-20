
import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuthContext } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

interface EvaluationsListProps {
  mode: 'teacher' | 'admin';
  teacherId?: string;
}

const EvaluationsList: React.FC<EvaluationsListProps> = ({ mode, teacherId }) => {
  const { toast } = useToast();
  const auth = useContext(AuthContext);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!auth?.user) return;

      try {
        setLoading(true);
        let query = supabase.from('teacher_evaluations').select('*, teacher:teachers(name, surname), evaluator:users(first_name, last_name)');

        if (teacherId) {
          query = query.eq('teacher_id', teacherId);
        } else if (mode === 'teacher') {
          query = query.eq('teacher_id', auth.user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        setEvaluations(data || []);

      } catch (error: any) {
        toast({
          title: 'Error fetching evaluations',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [auth?.user, mode, teacherId, toast]);

  if (loading) {
    return <div>Loading evaluations...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Evaluations</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Evaluator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluations.map(evaluation => (
              <TableRow key={evaluation.id}>
                <TableCell>{new Date(evaluation.evaluation_date).toLocaleDateString()}</TableCell>
                <TableCell>{evaluation.teacher.name} {evaluation.teacher.surname}</TableCell>
                <TableCell>{evaluation.evaluator.first_name} {evaluation.evaluator.last_name}</TableCell>
                <TableCell><Badge>{evaluation.status}</Badge></TableCell>
                <TableCell>
                  <Link to={`/evaluation/${evaluation.id}`} className="text-blue-500 hover:underline">
                    View Details
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default EvaluationsList;
