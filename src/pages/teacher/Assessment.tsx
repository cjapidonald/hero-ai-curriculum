import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface AssessmentProps {
  teacherId: string;
}

const Assessment = ({ teacherId }: AssessmentProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Assessment</h2>
        <p className="text-muted-foreground">
          Create and manage student assessments with rubric-based scoring
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Assessment Tools Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Create assessments with custom rubrics (R1-R5), assign scores, provide feedback,
            and publish results for students to view.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assessment;
