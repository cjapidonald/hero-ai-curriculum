import { Card, CardContent } from '@/components/ui/card';
import { BookMarked } from 'lucide-react';

interface CurriculumTabProps {
  teacherId: string;
  teacherName: string;
}

const CurriculumTab = ({ teacherId, teacherName }: CurriculumTabProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Curriculum</h2>
        <p className="text-muted-foreground">
          Manage lesson plans with warm-ups, main activities, assessments, homework, and worksheets
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <BookMarked className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Curriculum Management Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Create and manage lesson plans with materials including warm-ups (WP1-4), main activities (MA1-5),
            assessments (A1-4), homework (HW1-6), and print worksheets (P1-4).
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Teacher: {teacherName}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurriculumTab;
