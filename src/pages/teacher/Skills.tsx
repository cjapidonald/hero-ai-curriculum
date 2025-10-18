import { Card, CardContent } from '@/components/ui/card';
import { Award } from 'lucide-react';

interface SkillsProps {
  teacherId: string;
}

const Skills = ({ teacherId }: SkillsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Skills</h2>
        <p className="text-muted-foreground">
          Track student skills across Writing, Reading, Listening, and Speaking
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Award className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Skills Tracking Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Evaluate individual skills with detailed assessments (E1-E6), track progress across
            four main categories, and view skill development over time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Skills;
