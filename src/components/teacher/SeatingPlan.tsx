import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Grid3x3, UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  name: string;
  surname: string;
  profile_image_url?: string;
}

type GeometryType = 'all' | 'groups' | 'pairs' | 'groups-of-3';

interface Position {
  x: number;
  y: number;
}

interface StudentPosition {
  studentId: string;
  position: Position;
  groupId?: number;
}

interface SeatingPlanProps {
  students: Student[];
  sessionId: string;
  attendance: Record<string, boolean>;
  onClose?: () => void;
}

const GEOMETRY_CONFIG = {
  all: {
    label: 'All Students',
    icon: Users,
    description: 'Full class view in rows',
    columns: 6,
  },
  groups: {
    label: 'Groups',
    icon: Grid3x3,
    description: 'Pin-based grouping (4-6 per group)',
    columns: 4,
  },
  pairs: {
    label: 'Pair Work',
    icon: UserCog,
    description: '2-person groups',
    columns: 4,
  },
  'groups-of-3': {
    label: 'Groups of 3',
    icon: Users,
    description: '3-person groups',
    columns: 4,
  },
};

export default function SeatingPlan({
  students,
  sessionId,
  attendance,
  onClose,
}: SeatingPlanProps) {
  const { toast } = useToast();
  const [geometry, setGeometry] = useState<GeometryType>('all');
  const [studentPositions, setStudentPositions] = useState<StudentPosition[]>([]);
  const [draggedStudent, setDraggedStudent] = useState<string | null>(null);

  // Filter to only present students
  const presentStudents = students.filter((s) => attendance[s.id]);

  useEffect(() => {
    loadSeatingPlan();
  }, [sessionId]);

  useEffect(() => {
    // Auto-arrange when geometry changes
    autoArrange();
  }, [geometry, presentStudents.length]);

  const loadSeatingPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_sessions')
        .select('seating_plan')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      if (data?.seating_plan && typeof data.seating_plan === 'object') {
        const plan = data.seating_plan as any;
        if (plan.positions && Array.isArray(plan.positions)) {
          setStudentPositions(plan.positions);
        }
        if (plan.geometry) {
          setGeometry(plan.geometry);
        }
      } else {
        autoArrange();
      }
    } catch (error) {
      console.error('Error loading seating plan:', error);
      autoArrange();
    }
  };

  const saveSeatingPlan = async (positions: StudentPosition[], geo: GeometryType) => {
    try {
      const { error } = await supabase
        .from('lesson_sessions')
        .update({
          seating_plan: {
            geometry: geo,
            positions,
            updated_at: new Date().toISOString(),
          },
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Seating Plan Saved',
        description: 'The seating arrangement has been saved.',
      });
    } catch (error) {
      console.error('Error saving seating plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to save seating plan',
        variant: 'destructive',
      });
    }
  };

  const autoArrange = () => {
    const positions: StudentPosition[] = [];
    const config = GEOMETRY_CONFIG[geometry];

    switch (geometry) {
      case 'all':
        // Arrange in rows
        presentStudents.forEach((student, index) => {
          positions.push({
            studentId: student.id,
            position: {
              x: (index % config.columns) * 150 + 50,
              y: Math.floor(index / config.columns) * 120 + 50,
            },
          });
        });
        break;

      case 'groups': {
        // 4-6 per group, arranged in clusters
        const groupSize = 5;
        const groupsCount = Math.ceil(presentStudents.length / groupSize);
        const groupsPerRow = 3;

        presentStudents.forEach((student, index) => {
          const groupId = Math.floor(index / groupSize);
          const posInGroup = index % groupSize;
          const groupRow = Math.floor(groupId / groupsPerRow);
          const groupCol = groupId % groupsPerRow;

          // Circular arrangement within group
          const angle = (posInGroup / groupSize) * 2 * Math.PI;
          const radius = 60;
          const centerX = groupCol * 280 + 140;
          const centerY = groupRow * 280 + 140;

          positions.push({
            studentId: student.id,
            position: {
              x: centerX + Math.cos(angle) * radius,
              y: centerY + Math.sin(angle) * radius,
            },
            groupId,
          });
        });
        break;
      }

      case 'pairs': {
        // 2 per group, side by side
        presentStudents.forEach((student, index) => {
          const pairId = Math.floor(index / 2);
          const posInPair = index % 2;
          const pairsPerRow = 4;
          const pairRow = Math.floor(pairId / pairsPerRow);
          const pairCol = pairId % pairsPerRow;

          positions.push({
            studentId: student.id,
            position: {
              x: pairCol * 180 + posInPair * 80 + 50,
              y: pairRow * 120 + 50,
            },
            groupId: pairId,
          });
        });
        break;
      }

      case 'groups-of-3': {
        // 3 per group, triangle arrangement
        presentStudents.forEach((student, index) => {
          const groupId = Math.floor(index / 3);
          const posInGroup = index % 3;
          const groupsPerRow = 3;
          const groupRow = Math.floor(groupId / groupsPerRow);
          const groupCol = groupId % groupsPerRow;

          // Triangle positions
          const trianglePositions = [
            { x: 0, y: -40 }, // top
            { x: -40, y: 30 }, // bottom left
            { x: 40, y: 30 }, // bottom right
          ];

          const centerX = groupCol * 220 + 110;
          const centerY = groupRow * 180 + 100;

          positions.push({
            studentId: student.id,
            position: {
              x: centerX + trianglePositions[posInGroup].x,
              y: centerY + trianglePositions[posInGroup].y,
            },
            groupId,
          });
        });
        break;
      }
    }

    setStudentPositions(positions);
  };

  const handleSave = () => {
    saveSeatingPlan(studentPositions, geometry);
  };

  const handleGeometryChange = (newGeometry: GeometryType) => {
    setGeometry(newGeometry);
    // Auto-arrange will trigger via useEffect
  };

  const handleDragStart = (studentId: string) => {
    setDraggedStudent(studentId);
  };

  const handleDragEnd = (e: React.DragEvent, studentId: string) => {
    e.preventDefault();
    setDraggedStudent(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedStudent) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStudentPositions((prev) =>
      prev.map((pos) =>
        pos.studentId === draggedStudent
          ? { ...pos, position: { x, y } }
          : pos
      )
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getStudentPosition = (studentId: string): Position => {
    const pos = studentPositions.find((p) => p.studentId === studentId);
    return pos?.position || { x: 0, y: 0 };
  };

  const getGroupColor = (groupId?: number): string => {
    if (groupId === undefined) return 'rgba(59, 130, 246, 0.3)'; // blue

    const colors = [
      'rgba(239, 68, 68, 0.3)', // red
      'rgba(34, 197, 94, 0.3)', // green
      'rgba(234, 179, 8, 0.3)', // yellow
      'rgba(168, 85, 247, 0.3)', // purple
      'rgba(236, 72, 153, 0.3)', // pink
      'rgba(20, 184, 166, 0.3)', // teal
      'rgba(249, 115, 22, 0.3)', // orange
      'rgba(99, 102, 241, 0.3)', // indigo
    ];

    return colors[groupId % colors.length];
  };

  const config = GEOMETRY_CONFIG[geometry];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5" />
              <div>
                <CardTitle>Seating Plan</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {presentStudents.length} students present
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={geometry} onValueChange={(v) => handleGeometryChange(v as GeometryType)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GEOMETRY_CONFIG).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSave}>Save Layout</Button>
              <Button onClick={autoArrange} variant="outline">
                Auto Arrange
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="ghost">
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Seating Canvas */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800">
        <CardContent className="p-8">
          <div
            className="relative min-h-[600px] rounded-lg border-2 border-cyan-500/30 bg-slate-950/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          >
            {/* Legend */}
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="outline" className="bg-slate-900/90 border-cyan-500/50">
                {config.label}: {config.description}
              </Badge>
            </div>

            {/* Student Cards */}
            {presentStudents.map((student) => {
              const position = getStudentPosition(student.id);
              const studentPos = studentPositions.find((p) => p.studentId === student.id);
              const groupColor = getGroupColor(studentPos?.groupId);

              return (
                <div
                  key={student.id}
                  draggable
                  onDragStart={() => handleDragStart(student.id)}
                  onDragEnd={(e) => handleDragEnd(e, student.id)}
                  className="absolute cursor-move transition-all duration-200 hover:scale-110"
                  style={{
                    left: position.x,
                    top: position.y,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className="relative group"
                    style={{
                      filter: draggedStudent === student.id ? 'brightness(1.5)' : 'none',
                    }}
                  >
                    {/* Neon Glow Background */}
                    <div
                      className="absolute inset-0 rounded-lg blur-xl opacity-60 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: groupColor,
                      }}
                    />

                    {/* Student Card */}
                    <div
                      className="relative w-20 h-20 rounded-lg flex items-center justify-center text-center p-2 border-2 shadow-lg group-hover:shadow-2xl transition-shadow"
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderColor: groupColor.replace('0.3', '0.8'),
                        boxShadow: `0 0 20px ${groupColor}`,
                      }}
                    >
                      <div className="text-xs font-semibold text-white leading-tight">
                        {student.name}
                        <br />
                        <span className="text-[10px] text-cyan-300">
                          {student.surname}
                        </span>
                      </div>

                      {/* Group Badge */}
                      {studentPos?.groupId !== undefined && geometry !== 'all' && (
                        <div
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2"
                          style={{
                            backgroundColor: groupColor.replace('0.3', '0.9'),
                            borderColor: groupColor.replace('0.3', '1'),
                            color: 'white',
                          }}
                        >
                          {studentPos.groupId + 1}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {presentStudents.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-cyan-400/50">
                  <Users className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg font-semibold">No students marked as present</p>
                  <p className="text-sm">Mark attendance to see seating plan</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 text-center text-sm text-cyan-400/70">
            Drag and drop students to rearrange • Click "Auto Arrange" to reset • Save when ready
          </div>
        </CardContent>
      </Card>

      {/* Group Summary */}
      {geometry !== 'all' && presentStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Group Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from(
                new Set(studentPositions.map((p) => p.groupId).filter((g) => g !== undefined))
              ).map((groupId) => {
                const groupStudents = studentPositions
                  .filter((p) => p.groupId === groupId)
                  .map((p) => students.find((s) => s.id === p.studentId))
                  .filter(Boolean);

                return (
                  <div
                    key={groupId}
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: getGroupColor(groupId),
                      borderColor: getGroupColor(groupId).replace('0.3', '0.6'),
                    }}
                  >
                    <div className="font-semibold text-sm mb-2">
                      Group {(groupId as number) + 1}
                    </div>
                    <ul className="text-xs space-y-1">
                      {groupStudents.map((student) => (
                        <li key={student!.id}>
                          {student!.name} {student!.surname}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
