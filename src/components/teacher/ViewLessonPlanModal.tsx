import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, FileText, File } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';

interface LessonResource {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  notes: string | null;
  position: number;
}

interface LessonPlanData {
  resources: LessonResource[];
  total_duration: number;
}

interface ClassSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  lesson_plan_data: LessonPlanData | null;
  class_name?: string;
  lesson_title?: string;
  lesson_subject?: string;
  class_stage?: string | null;
  class_level?: string | null;
  class_teacher?: string | null;
}

interface ViewLessonPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ClassSession;
  onEdit: () => void;
}

const normalizeLessonPlanData = (data: any): LessonPlanData | null => {
  if (!data || !Array.isArray(data.resources)) {
    return null;
  }

  const normalizedResources: LessonResource[] = data.resources
    .map((resource: any, index: number) => {
      if (resource.resource) {
        const legacyId = resource.resource_id ?? resource.resource.id ?? `resource-${index}`;
        return {
          id: legacyId,
          title: resource.resource.title,
          type: resource.resource.resource_type,
          duration: resource.resource.duration_minutes ?? null,
          notes: resource.notes ?? null,
          position: resource.position ?? index,
        };
      }

      return {
        id: resource.id ?? `resource-${index}`,
        title: resource.title,
        type: resource.type,
        duration: resource.duration ?? null,
        notes: resource.notes ?? null,
        position: resource.position ?? index,
      };
    })
    .sort((a, b) => a.position - b.position);

  const totalDuration =
    typeof data.total_duration === 'number'
      ? data.total_duration
      : normalizedResources.reduce((sum, resource) => sum + (resource.duration ?? 0), 0);

  return {
    resources: normalizedResources,
    total_duration: totalDuration,
  };
};

const ViewLessonPlanModal = ({ open, onOpenChange, session, onEdit }: ViewLessonPlanModalProps) => {
  const [lessonPlan, setLessonPlan] = useState<LessonPlanData | null>(null);
  const { toast } = useToast();

  const formatStageLabel = (stage?: string | null) => {
    if (!stage) return null;
    if (stage.toLowerCase().startsWith('stage_')) {
      const suffix = stage.split('_')[1];
      return `Stage ${suffix}`;
    }
    return stage;
  };

  useEffect(() => {
    if (open) {
      setLessonPlan(normalizeLessonPlanData(session.lesson_plan_data));
    }
  }, [open, session]);

  const exportToPDF = () => {
    try {
      // Create HTML content for PDF
      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Lesson Plan - ${session.lesson_title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              color: #333;
              border-bottom: 2px solid #4CAF50;
              padding-bottom: 10px;
            }
            .header-info {
              background: #f5f5f5;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .info-row {
              margin: 5px 0;
            }
            .resource {
              border: 1px solid #ddd;
              padding: 15px;
              margin: 15px 0;
              border-radius: 5px;
              page-break-inside: avoid;
            }
            .resource-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            }
            .resource-title {
              font-size: 16px;
              font-weight: bold;
              color: #333;
            }
            .resource-meta {
              display: flex;
              gap: 10px;
              margin: 10px 0;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              background: #e3f2fd;
              color: #1976d2;
              border-radius: 3px;
              font-size: 12px;
            }
            .notes {
              margin-top: 10px;
              padding: 10px;
              background: #fffbf0;
              border-left: 3px solid #ffc107;
              font-style: italic;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <h1>Lesson Plan: ${session.lesson_title || 'Untitled Lesson'}</h1>

          <div class="header-info">
            <div class="info-row"><strong>Class:</strong> ${session.class_name}</div>
            <div class="info-row"><strong>Subject:</strong> ${session.lesson_subject || 'N/A'}</div>
            <div class="info-row"><strong>Date:</strong> ${format(parseISO(session.session_date), 'EEEE, MMMM d, yyyy')}</div>
            <div class="info-row"><strong>Time:</strong> ${session.start_time} - ${session.end_time}</div>
            <div class="info-row"><strong>Total Duration:</strong> ${lessonPlan?.total_duration || 0} minutes</div>
            <div class="info-row"><strong>Resources:</strong> ${lessonPlan?.resources.length || 0} activities</div>
          </div>

          <h2>Lesson Activities</h2>
          ${lessonPlan?.resources
            .sort((a, b) => a.position - b.position)
            .map(
              (resource, index) => `
            <div class="resource">
              <div class="resource-header">
                <div class="resource-title">${index + 1}. ${resource.title}</div>
              </div>
              <div class="resource-meta">
                <span class="badge">${resource.type}</span>
                ${resource.duration ? `<span class="badge">${resource.duration} minutes</span>` : ''}
              </div>
              ${resource.notes ? `<div class="notes"><strong>Teacher Notes:</strong> ${resource.notes}</div>` : ''}
            </div>
          `
            )
            .join('')}

          <div class="footer">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lesson-plan-${session.lesson_title?.replace(/\s+/g, '-').toLowerCase() || 'untitled'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Lesson Plan Exported',
        description: 'HTML file downloaded. Open in browser and use Print to PDF to save as PDF.',
      });
    } catch (error: Error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export lesson plan',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    try {
      if (!lessonPlan) return;

      // Create CSV content
      const headers = ['Position', 'Title', 'Type', 'Duration (min)', 'Notes'];
      const rows = lessonPlan.resources
        .sort((a, b) => a.position - b.position)
        .map((resource) => [
          resource.position + 1,
          `"${resource.title}"`,
          resource.type,
          resource.duration || '',
          `"${resource.notes || ''}"`,
        ]);

      const csvContent = [
        `"Lesson Plan: ${session.lesson_title || 'Untitled'}"`,
        `"Class: ${session.class_name}"`,
        `"Date: ${format(parseISO(session.session_date), 'yyyy-MM-dd')}"`,
        `"Time: ${session.start_time} - ${session.end_time}"`,
        '', // Empty line
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lesson-plan-${session.lesson_title?.replace(/\s+/g, '-').toLowerCase() || 'untitled'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'CSV Exported',
        description: 'Lesson plan has been exported to CSV',
      });
    } catch (error: Error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export to CSV',
        variant: 'destructive',
      });
    }
  };

  if (!lessonPlan || !lessonPlan.resources) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Lesson Plan</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            No lesson plan available for this session.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const sortedResources = [...lessonPlan.resources].sort((a, b) => a.position - b.position);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{session.lesson_title || 'Lesson Plan'}</DialogTitle>
          <DialogDescription>
            {session.class_name} - {format(parseISO(session.session_date), 'EEEE, MMMM d, yyyy')} at {session.start_time}
          </DialogDescription>
        </DialogHeader>

        {/* Header Info */}
        <Card className="bg-muted">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Total Duration:</span> {lessonPlan.total_duration} minutes
              </div>
              <div>
                <span className="font-semibold">Activities:</span> {lessonPlan.resources.length}
              </div>
              <div>
                <span className="font-semibold">Subject:</span> {session.lesson_subject || 'N/A'}
              </div>
              <div>
                <span className="font-semibold">Time:</span> {session.start_time} - {session.end_time}
              </div>
              <div>
                <span className="font-semibold">Teacher:</span> {session.class_teacher || 'Not assigned'}
              </div>
              <div>
                <span className="font-semibold">Grade:</span> {session.class_level || formatStageLabel(session.class_stage) || 'Stage TBD'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Export to PDF
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <File className="w-4 h-4 mr-2" />
            Export to CSV
          </Button>
        </div>

        {/* Lesson Resources */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="font-semibold mb-3">Lesson Activities</h3>
          <div className="space-y-3">
            {sortedResources.map((resource, index) => (
              <Card key={resource.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">
                        {index + 1}. {resource.title}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{resource.type}</Badge>
                        {resource.duration && (
                          <Badge variant="secondary">{resource.duration} min</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {resource.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm">
                        <span className="font-semibold">Teacher Notes:</span> {resource.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewLessonPlanModal;
