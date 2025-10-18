import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface MyStudentsProps {
  teacherId: string;
}

const MyStudents = ({ teacherId }: MyStudentsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">My Students</h2>
        <p className="text-muted-foreground">
          View and manage student information (excluding parent contact details)
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Student Management Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            View detailed student profiles including placement test results, attendance rates,
            sessions tracking, and learning levels. (Parent contact info is admin-only)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyStudents;
