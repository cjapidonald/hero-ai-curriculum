import { useState, useEffect, useRef } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResourceLibrary, Resource } from '@/components/ResourceLibrary';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Download, Plus, X, Upload, FileText } from 'lucide-react';
import { SortableItem } from '@/components/SortableItem';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SECTION_CONFIG = {
  warmup: { max: 4, prefix: 'wp', activitiesKey: 'warmup_activities' },
  main: { max: 5, prefix: 'ma', activitiesKey: 'main_activities' },
  assessment: { max: 4, prefix: 'a', activitiesKey: 'assessment_activities' },
  homework: { max: 6, prefix: 'hw', activitiesKey: 'homework_activities' },
  printable: { max: 4, prefix: 'p', activitiesKey: 'printable_activities' },
} as const;

type SectionKey = keyof typeof SECTION_CONFIG;
type LessonPlanActivitiesKey = typeof SECTION_CONFIG[SectionKey]['activitiesKey'];

interface LessonActivity {
  id: string;
  type: string;
  url: string;
  name: string;
  resource?: Resource;
}

interface LessonPlan {
  id?: string;
  teacher_id: string;
  teacher_name: string;
  class: string;
  school: string;
  subject: string;
  lesson_title: string;
  lesson_date: string;
  lesson_skills: string;
  success_criteria: string;
  curriculum_stage: string;
  warmup_activities: LessonActivity[];
  main_activities: LessonActivity[];
  assessment_activities: LessonActivity[];
  homework_activities: LessonActivity[];
  printable_activities: LessonActivity[];
}

interface EnhancedLessonPlannerProps {
  teacherId: string;
  teacherName?: string;
  lessonId?: string;
  onSave?: () => void;
}

const createEmptyLessonPlan = (teacherId: string, teacherName?: string): LessonPlan => ({
  teacher_id: teacherId,
  teacher_name: teacherName || '',
  class: '',
  school: 'HeroSchool',
  subject: 'English',
  lesson_title: '',
  lesson_date: new Date().toISOString().split('T')[0],
  lesson_skills: '',
  success_criteria: '',
  curriculum_stage: '',
  warmup_activities: [],
  main_activities: [],
  assessment_activities: [],
  homework_activities: [],
  printable_activities: [],
});

export const EnhancedLessonPlanner = ({ teacherId, teacherName, lessonId, onSave }: EnhancedLessonPlannerProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const lessonPlanRef = useRef<HTMLDivElement>(null);

  const [lessonPlan, setLessonPlan] = useState<LessonPlan>(() =>
    createEmptyLessonPlan(teacherId, teacherName)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchClasses();
    if (lessonId) {
      fetchLesson();
    } else {
      setLessonPlan(createEmptyLessonPlan(teacherId, teacherName));
    }
  }, [lessonId, teacherId, teacherName]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('is_active', true);

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchLesson = async () => {
    try {
      const { data, error } = await supabase
        .from('curriculum')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) throw error;

      // Parse the flat structure into organized activities
      const warmup: LessonActivity[] = [];
      const main: LessonActivity[] = [];
      const assessment: LessonActivity[] = [];
      const homework: LessonActivity[] = [];
      const printable: LessonActivity[] = [];

      for (let i = 1; i <= 4; i++) {
        if (data[`wp${i}_name`]) {
          warmup.push({
            id: `wp${i}`,
            type: data[`wp${i}_type`] || 'file',
            url: data[`wp${i}_url`] || '',
            name: data[`wp${i}_name`],
          });
        }
      }

      for (let i = 1; i <= 5; i++) {
        if (data[`ma${i}_name`]) {
          main.push({
            id: `ma${i}`,
            type: data[`ma${i}_type`] || 'file',
            url: data[`ma${i}_url`] || '',
            name: data[`ma${i}_name`],
          });
        }
      }

      for (let i = 1; i <= 4; i++) {
        if (data[`a${i}_name`]) {
          assessment.push({
            id: `a${i}`,
            type: data[`a${i}_type`] || 'file',
            url: data[`a${i}_url`] || '',
            name: data[`a${i}_name`],
          });
        }
      }

      for (let i = 1; i <= 6; i++) {
        if (data[`hw${i}_name`]) {
          homework.push({
            id: `hw${i}`,
            type: data[`hw${i}_type`] || 'file',
            url: data[`hw${i}_url`] || '',
            name: data[`hw${i}_name`],
          });
        }
      }

      for (let i = 1; i <= 4; i++) {
        if (data[`p${i}_name`]) {
          printable.push({
            id: `p${i}`,
            type: data[`p${i}_type`] || 'file',
            url: data[`p${i}_url`] || '',
            name: data[`p${i}_name`],
          });
        }
      }

      setLessonPlan({
        id: data.id,
        teacher_id: data.teacher_id || teacherId,
        teacher_name: data.teacher_name || teacherName || '',
        class: data.class || '',
        school: data.school || 'HeroSchool',
        subject: data.subject || 'English',
        lesson_title: data.lesson_title || '',
        lesson_date: data.lesson_date || new Date().toISOString().split('T')[0],
        lesson_skills: data.lesson_skills || '',
        success_criteria: data.success_criteria || '',
        curriculum_stage: data.curriculum_stage || '',
        warmup_activities: warmup,
        main_activities: main,
        assessment_activities: assessment,
        homework_activities: homework,
        printable_activities: printable,
      });
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast({
        title: 'Error loading lesson',
        description: 'Could not load lesson details',
        variant: 'destructive',
      });
    }
  };

  const handleDrop = (sectionType: SectionKey, resource: Resource) => {
    const config = SECTION_CONFIG[sectionType];
    const activitiesKey = config.activitiesKey;

    const newActivity: LessonActivity = {
      id: `${sectionType}${Date.now()}`,
      type: resource.file_type || 'file',
      url: resource.file_url || '',
      name: resource.name,
      resource,
    };

    setLessonPlan((prev) => {
      const currentActivities = prev[activitiesKey as LessonPlanActivitiesKey] as LessonActivity[];

      if (currentActivities.length >= config.max) {
        toast({
          title: 'Section full',
          description: `You can only add ${config.max} item${config.max > 1 ? 's' : ''} to ${sectionType === 'main' ? 'main activities' : `${sectionType} activities`}.`,
          variant: 'destructive',
        });
        return prev;
      }

      return {
        ...prev,
        [activitiesKey]: [...currentActivities, newActivity],
      };
    });
  };

  const handleRemoveActivity = (section: SectionKey, activityId: string) => {
    const { activitiesKey } = SECTION_CONFIG[section];
    setLessonPlan((prev) => ({
      ...prev,
      [activitiesKey]: (prev[activitiesKey as LessonPlanActivitiesKey] as LessonActivity[]).filter(
        (a) => a.id !== activityId
      ),
    }));
  };

  const handleDragEnd = (sectionKey: SectionKey, event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const { activitiesKey } = SECTION_CONFIG[sectionKey];

    setLessonPlan((prev) => {
      const activities = prev[activitiesKey as LessonPlanActivitiesKey] as LessonActivity[];
      const oldIndex = activities.findIndex((a) => a.id === active.id);
      const newIndex = activities.findIndex((a) => a.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }

      return {
        ...prev,
        [activitiesKey]: arrayMove(activities, oldIndex, newIndex),
      };
    });
  };

  const setFlatDataForSection = (
    flatData: Record<string, any>,
    sectionKey: SectionKey,
    activities: LessonActivity[]
  ) => {
    const { max, prefix } = SECTION_CONFIG[sectionKey];

    for (let idx = 0; idx < max; idx++) {
      const activity = activities[idx];
      const suffix = idx + 1;

      flatData[`${prefix}${suffix}_type`] = activity?.type ?? null;
      flatData[`${prefix}${suffix}_url`] = activity?.url ?? null;
      flatData[`${prefix}${suffix}_name`] = activity?.name ?? null;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Convert organized activities back to flat structure
      const flatData: any = {
        teacher_id: lessonPlan.teacher_id,
        teacher_name: lessonPlan.teacher_name,
        class: lessonPlan.class,
        school: lessonPlan.school,
        subject: lessonPlan.subject,
        lesson_title: lessonPlan.lesson_title,
        lesson_date: lessonPlan.lesson_date,
        lesson_skills: lessonPlan.lesson_skills,
        success_criteria: lessonPlan.success_criteria,
        curriculum_stage: lessonPlan.curriculum_stage,
      };

      setFlatDataForSection(flatData, 'warmup', lessonPlan.warmup_activities);
      setFlatDataForSection(flatData, 'main', lessonPlan.main_activities);
      setFlatDataForSection(flatData, 'assessment', lessonPlan.assessment_activities);
      setFlatDataForSection(flatData, 'homework', lessonPlan.homework_activities);
      setFlatDataForSection(flatData, 'printable', lessonPlan.printable_activities);

      let error;
      if (lessonPlan.id) {
        const result = await supabase.from('curriculum').update(flatData).eq('id', lessonPlan.id);
        error = result.error;
      } else {
        const result = await supabase.from('curriculum').insert(flatData);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Lesson plan saved successfully',
      });

      onSave?.();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast({
        title: 'Error saving lesson',
        description: 'Could not save lesson plan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    const input = lessonPlanRef.current;
    if (!input) {
      toast({
        title: 'Error exporting PDF',
        description: 'Could not find lesson plan content.',
        variant: 'destructive',
      });
      return;
    }

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const width = pdfWidth;
      const height = width / ratio;

      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${lessonPlan.lesson_title || 'lesson-plan'}.pdf`);
    });
  };

  const handleExportCSV = () => {
    const csv = `Lesson Title,${lessonPlan.lesson_title}\nDate,${lessonPlan.lesson_date}\nClass,${lessonPlan.class}\n\nWarmup Activities\n${lessonPlan.warmup_activities.map(a => a.name).join('\n')}\n\nMain Activities\n${lessonPlan.main_activities.map(a => a.name).join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonPlan.lesson_title}_${lessonPlan.lesson_date}.csv`;
    a.click();
  };

  const renderActivitySection = (
    title: string,
    sectionKey: SectionKey,
    activities: LessonActivity[],
  ) => {
    const { max } = SECTION_CONFIG[sectionKey];
    return (
      <div
        className="bg-muted/30 p-4 rounded-lg min-h-[200px] border-2 border-dashed border-muted-foreground/20"
        onDrop={(e) => {
          e.preventDefault();
          const resourceData = e.dataTransfer.getData('application/json');
          if (resourceData) {
            const resource = JSON.parse(resourceData);
            handleDrop(sectionKey, resource);
          }
        }}
      >
        <h4 className="font-semibold mb-3">{title}</h4>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => handleDragEnd(sectionKey, event)}
        >
          <SortableContext items={activities.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {activities.map((activity) => (
                <SortableItem key={activity.id} id={activity.id}>
                  <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.name}</p>
                      <p className="text-xs text-muted-foreground">{activity.type}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveActivity(sectionKey, activity.id)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </SortableItem>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Drag resources here or click to add
                </p>
              )}
              {activities.length >= max && (
                <p className="text-xs text-muted-foreground text-center">
                  Maximum of {max} activities reached.
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    );
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
      {/* Left Side - Lesson Plan Editor */}
      <div className="space-y-4 overflow-y-auto pr-4" ref={lessonPlanRef}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Lesson Planner</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <FileText size={16} className="mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download size={16} className="mr-2" />
              PDF
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lesson_title">Lesson Title *</Label>
            <Input
              id="lesson_title"
              value={lessonPlan.lesson_title}
              onChange={(e) => setLessonPlan({ ...lessonPlan, lesson_title: e.target.value })}
              placeholder="e.g., Numbers 1-10"
            />
          </div>
          <div>
            <Label htmlFor="lesson_date">Date</Label>
            <Input
              id="lesson_date"
              type="date"
              value={lessonPlan.lesson_date}
              onChange={(e) => setLessonPlan({ ...lessonPlan, lesson_date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="class">Class *</Label>
            <Select value={lessonPlan.class} onValueChange={(value) => setLessonPlan({ ...lessonPlan, class: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.name}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="stage">Stage</Label>
            <Select value={lessonPlan.curriculum_stage} onValueChange={(value) => setLessonPlan({ ...lessonPlan, curriculum_stage: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5', 'Stage 6'].map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="skills">Skills</Label>
          <Input
            id="skills"
            value={lessonPlan.lesson_skills}
            onChange={(e) => setLessonPlan({ ...lessonPlan, lesson_skills: e.target.value })}
            placeholder="e.g., Speaking, Counting, Listening"
          />
        </div>

        <div>
          <Label htmlFor="success_criteria">Success Criteria</Label>
          <Textarea
            id="success_criteria"
            value={lessonPlan.success_criteria}
            onChange={(e) => setLessonPlan({ ...lessonPlan, success_criteria: e.target.value })}
            placeholder="What students should be able to do by the end of the lesson"
            rows={3}
          />
        </div>

        {/* Activity Sections */}
        <div className="space-y-4">
          {renderActivitySection('Warm-up Activities', 'warmup', lessonPlan.warmup_activities)}
          {renderActivitySection('Main Activities', 'main', lessonPlan.main_activities)}
          {renderActivitySection('Assessment Activities', 'assessment', lessonPlan.assessment_activities)}
          {renderActivitySection('Homework', 'homework', lessonPlan.homework_activities)}
          {renderActivitySection('Printables', 'printable', lessonPlan.printable_activities)}
        </div>
      </div>

      {/* Right Side - Resource Library */}
      <div className="border-l pl-6 overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Resource Library</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag resources to the lesson plan or click to add them
        </p>
        <ResourceLibrary
          onSelectResource={(resource) => {
            // Auto-assign to appropriate section based on resource type
            const resourceSection = resource.resource_type === 'main_activity' ? 'main' : resource.resource_type;
            if (['warmup', 'main', 'assessment', 'homework', 'printable'].includes(resourceSection)) {
              handleDrop(resourceSection as SectionKey, resource);
            } else {
              toast({
                title: 'Unsupported resource type',
                description: 'This resource cannot be added to the planner yet.',
                variant: 'destructive',
              });
            }
          }}
          compact
        />
      </div>
    </div>
  );
};
