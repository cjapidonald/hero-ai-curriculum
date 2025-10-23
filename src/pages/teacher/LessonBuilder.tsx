import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  ArrowRight,
  FilePlus2,
  FolderPlus,
  GripVertical,
  Layers,
  Loader2,
  Save,
  UploadCloud,
} from 'lucide-react';

type Resource = Tables<'resources'>;

interface LessonResource {
  id: string;
  resource_id: string;
  position: number;
  notes: string;
  section: LessonSectionKey;
  resource: Resource;
}

type SkillOption = Tables<'skills'>;
type StageEnum = Database['public']['Enums']['cambridge_stage'];

interface LessonMetadata {
  subject: string;
  lessonNumber: string;
  lessonTitle: string;
  className: string;
  school: string;
  teacher: string;
  date: string;
  stage: string;
  status: 'In Progress' | 'Done';
}

type LessonSectionKey =
  | 'warmup'
  | 'body'
  | 'assessment'
  | 'homework'
  | 'printables'
  | 'notes';

const SECTION_CONFIG: Record<LessonSectionKey, { title: string; description: string }> = {
  warmup: { title: 'Warm-up', description: 'Spark curiosity with routines and short games.' },
  body: { title: 'Body', description: 'Main learning sequence and collaborative tasks.' },
  assessment: { title: 'Assessment', description: 'Checks for understanding and exit tickets.' },
  homework: { title: 'Homework', description: 'Extend learning beyond the classroom.' },
  printables: { title: 'Printables', description: 'Worksheets, visuals, and take-home packs.' },
  notes: { title: 'Notes & Reflections', description: 'Teacher guidance, differentiation, and observations.' },
};

const SECTION_ORDER: LessonSectionKey[] = [
  'warmup',
  'body',
  'assessment',
  'homework',
  'printables',
  'notes',
];

const DEFAULT_METADATA: LessonMetadata = {
  subject: '',
  lessonNumber: '',
  lessonTitle: '',
  className: '',
  school: '',
  teacher: '',
  date: '',
  stage: '',
  status: 'In Progress',
};

interface LessonBuilderProps {
  teacherId: string;
}

interface SortableResourceProps {
  lessonResource: LessonResource;
  onDelete: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onSectionChange: (id: string, section: LessonSectionKey) => void;
}

const deriveSectionFromResource = (resource: Resource): LessonSectionKey => {
  switch (resource.resource_type) {
    case 'warmup':
      return 'warmup';
    case 'worksheet':
    case 'printable':
      return 'printables';
    case 'assessment':
      return 'assessment';
    case 'homework':
      return 'homework';
    default:
      return 'body';
  }
};

const decodeLessonNotes = (
  rawNotes: string | null
): { notes: string; section: LessonSectionKey } => {
  if (!rawNotes) {
    return { notes: '', section: 'body' };
  }

  try {
    const parsed = JSON.parse(rawNotes);
    if (typeof parsed === 'object' && parsed) {
      return {
        notes: typeof parsed.notes === 'string' ? parsed.notes : '',
        section: SECTION_ORDER.includes(parsed.section) ? parsed.section : 'body',
      } as { notes: string; section: LessonSectionKey };
    }
  } catch (error) {
    // fall through to legacy handling
  }

  return { notes: rawNotes, section: 'body' };
};

const encodeLessonNotes = (notes: string, section: LessonSectionKey) =>
  JSON.stringify({ notes, section });

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unexpected error occurred';

function SortableResource({ lessonResource, onDelete, onUpdateNotes, onSectionChange }: SortableResourceProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lessonResource.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <button type="button" {...attributes} {...listeners} className="mt-1 cursor-grab text-muted-foreground">
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold leading-tight">{lessonResource.resource.title}</h4>
              {lessonResource.resource.description ? (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {lessonResource.resource.description}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="uppercase">
                  {lessonResource.resource.resource_type}
                </Badge>
                {lessonResource.resource.duration_minutes ? (
                  <Badge variant="secondary">{lessonResource.resource.duration_minutes} min</Badge>
                ) : null}
                {lessonResource.resource.stage ? (
                  <Badge variant="outline">Stage {lessonResource.resource.stage}</Badge>
                ) : null}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onDelete(lessonResource.id)}>
              Remove
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Section</Label>
              <Select
                value={lessonResource.section}
                onValueChange={(value) => onSectionChange(lessonResource.id, value as LessonSectionKey)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_ORDER.map((sectionKey) => (
                    <SelectItem key={sectionKey} value={sectionKey}>
                      {SECTION_CONFIG[sectionKey].title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Teacher Notes</Label>
              <Textarea
                value={lessonResource.notes}
                placeholder="Differentiate, scaffold, or track refinements…"
                className="h-24 resize-none text-sm"
                onChange={(event) => onUpdateNotes(lessonResource.id, event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionColumn({
  section,
  resources,
  children,
}: {
  section: LessonSectionKey;
  resources: LessonResource[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `section-${section}` });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-1 flex-col gap-3 rounded-lg border bg-muted/20 p-4 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{SECTION_CONFIG[section].title}</h3>
            <p className="text-xs text-muted-foreground">{SECTION_CONFIG[section].description}</p>
          </div>
          <Badge variant="outline">{resources.length}</Badge>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function LessonBuilder({ teacherId }: LessonBuilderProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [curricula, setCurricula] = useState<Tables<'curriculum'>[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<Tables<'curriculum'> | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<'In Progress' | 'Done'>('In Progress');
  const [lessonMetadata, setLessonMetadata] = useState<LessonMetadata>(DEFAULT_METADATA);
  const [lessonResources, setLessonResources] = useState<LessonResource[]>([]);
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [myResources, setMyResources] = useState<Resource[]>([]);
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<Tables<'teachers'> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { toast } = useToast();

  useEffect(() => {
    const curriculumIdFromParams = searchParams.get('curriculumId');
    const assignmentIdFromParams = searchParams.get('assignmentId');
    if (curriculumIdFromParams) {
      setSelectedCurriculum((current) =>
        current?.id === curriculumIdFromParams
          ? current
          : curricula.find((lesson) => lesson.id === curriculumIdFromParams) ?? current
      );
    }
    if (assignmentIdFromParams) {
      setAssignmentId(assignmentIdFromParams);
    }
  }, [searchParams, curricula]);

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [curriculumResponse, resourcesResponse, myResourcesResponse, teacherResponse, skillsResponse] = await Promise.all([
          supabase
            .from('curriculum')
            .select('*')
            .order('stage', { ascending: true })
            .order('lesson_number', { ascending: true }),
          supabase
            .from('resources')
            .select('*')
            .eq('is_active', true)
            .order('title'),
          supabase
            .from('resources')
            .select('*')
            .eq('created_by', teacherId)
            .order('updated_at', { ascending: false }),
          supabase.from('teachers').select('*').eq('id', teacherId).single(),
          supabase.from('skills').select('*').eq('is_active', true).order('skill_name'),
        ]);

        if (!isMounted) {
          return;
        }

        if (curriculumResponse.error) throw curriculumResponse.error;
        if (resourcesResponse.error) throw resourcesResponse.error;
        if (myResourcesResponse.error) throw myResourcesResponse.error;
        if (skillsResponse.error) throw skillsResponse.error;

        setCurricula(curriculumResponse.data || []);
        setAvailableResources(resourcesResponse.data || []);
        setFilteredResources(resourcesResponse.data || []);
        setMyResources(myResourcesResponse.data || []);
        setSkills(skillsResponse.data || []);
        setTeacherProfile(teacherResponse.data ?? null);
      } catch (error) {
        console.error('Failed to load lesson builder data', error);
        toast({
          title: 'Unable to load lesson builder',
          description: getErrorMessage(error),
          variant: 'destructive',
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [teacherId, toast]);

  useEffect(() => {
    if (!selectedCurriculum) {
      setLessonResources([]);
      setSelectedSkills([]);
      return;
    }

    const loadLessonResources = async () => {
      try {
        const { data, error } = await supabase
          .from('lesson_resources')
          .select(
            `id, resource_id, position, notes, resource:resources(*)`
          )
          .eq('curriculum_id', selectedCurriculum.id)
          .order('position');

        if (error) throw error;

        const mappedResources: LessonResource[] = (data || []).map((item) => {
          const decoded = decodeLessonNotes(item.notes);
          return {
            id: item.id,
            resource_id: item.resource_id,
            position: item.position,
            notes: decoded.notes,
            section: decoded.section,
            resource: item.resource as Resource,
          };
        });

        setLessonResources(mappedResources);

        const skillsList = (selectedCurriculum.lesson_skills || '')
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean);
        setSelectedSkills(skillsList);
      } catch (error) {
        console.error('Failed to load lesson resources', error);
        toast({
          title: 'Unable to load lesson resources',
          description: getErrorMessage(error),
          variant: 'destructive',
        });
      }
    };

    loadLessonResources();
  }, [selectedCurriculum, toast]);

  useEffect(() => {
    if (!assignmentId) {
      return;
    }

    const loadAssignment = async () => {
      try {
        const { data, error } = await supabase
          .from('teacher_assignments')
          .select('*')
          .eq('id', assignmentId)
          .single();

        if (error) throw error;

        setAssignmentStatus((data.status as LessonMetadata['status']) ?? 'In Progress');
        if (data.teaching_date) {
          setLessonMetadata((prev) => ({ ...prev, date: data.teaching_date }));
        }
      } catch (error) {
        console.error('Unable to load assignment metadata', error);
      }
    };

    loadAssignment();
  }, [assignmentId]);

  useEffect(() => {
    if (!selectedCurriculum) {
      setLessonMetadata(DEFAULT_METADATA);
      return;
    }

    setLessonMetadata({
      subject: selectedCurriculum.subject ?? '',
      lessonNumber: selectedCurriculum.lesson_number?.toString() ?? '',
      lessonTitle: selectedCurriculum.lesson_title,
      className: selectedCurriculum.class ?? '',
      school: selectedCurriculum.school ?? teacherProfile?.school ?? '',
      teacher:
        selectedCurriculum.teacher_name ||
        (teacherProfile ? `${teacherProfile.name} ${teacherProfile.surname}` : ''),
      date: selectedCurriculum.lesson_date ?? '',
      stage: selectedCurriculum.stage ?? selectedCurriculum.curriculum_stage ?? '',
      status: assignmentStatus,
    });
  }, [selectedCurriculum, teacherProfile, assignmentStatus]);

  useEffect(() => {
    let resources = availableResources;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      resources = resources.filter(
        (resource) =>
          resource.title.toLowerCase().includes(query) ||
          resource.description?.toLowerCase().includes(query) ||
          resource.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (filterType !== 'all') {
      resources = resources.filter((resource) => resource.resource_type === filterType);
    }

    setFilteredResources(resources);
  }, [availableResources, searchQuery, filterType]);

  const groupedLessonResources = useMemo(() => {
    return SECTION_ORDER.reduce(
      (acc, section) => ({
        ...acc,
        [section]: lessonResources
          .filter((resource) => resource.section === section)
          .sort((a, b) => a.position - b.position),
      }),
      {} as Record<LessonSectionKey, LessonResource[]>
    );
  }, [lessonResources]);

  const filteredSkills = useMemo(() => {
    const query = skillSearch.trim().toLowerCase();
    const stage = lessonMetadata.stage;

    return skills.filter((skill) => {
      const matchesStage =
        !stage ||
        !skill.target_stage ||
        skill.target_stage.includes(stage as StageEnum);
      const matchesQuery =
        !query ||
        skill.skill_name.toLowerCase().includes(query) ||
        skill.skill_code.toLowerCase().includes(query);
      return matchesStage && matchesQuery;
    });
  }, [skills, skillSearch, lessonMetadata.stage]);

  const handleSkillToggle = (skillLabel: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillLabel) ? prev.filter((skill) => skill !== skillLabel) : [...prev, skillLabel]
    );
  };

  const handleAddResource = async (resource: Resource) => {
    if (!selectedCurriculum) {
      toast({
        title: 'Select a lesson first',
        description: 'Pick a curriculum lesson before adding resources.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const section = deriveSectionFromResource(resource);
      const maxPosition = lessonResources.length
        ? Math.max(...lessonResources.map((item) => item.position))
        : -1;

      const { data, error } = await supabase
        .from('lesson_resources')
        .insert({
          curriculum_id: selectedCurriculum.id,
          resource_id: resource.id,
          position: maxPosition + 1,
          notes: encodeLessonNotes('', section),
          added_by: teacherId,
        })
        .select(`id, resource_id, position, notes, resource:resources(*)`)
        .single();

      if (error) throw error;

      const decoded = decodeLessonNotes(data.notes);
      setLessonResources((prev) => [
        ...prev,
        {
          id: data.id,
          resource_id: data.resource_id,
          position: data.position,
          notes: decoded.notes,
          section: decoded.section,
          resource: data.resource as Resource,
        },
      ]);

      toast({ title: 'Resource linked', description: `${resource.title} added to the lesson plan.` });
    } catch (error) {
      console.error('Unable to add resource', error);
      toast({
        title: 'Unable to add resource',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      const { error } = await supabase.from('lesson_resources').delete().eq('id', id);
      if (error) throw error;

      setLessonResources((prev) => prev.filter((resource) => resource.id !== id));
      toast({ title: 'Removed', description: 'Resource detached from the lesson.' });
    } catch (error) {
      console.error('Unable to delete resource', error);
      toast({
        title: 'Unable to remove resource',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    setLessonResources((prev) =>
      prev.map((resource) => (resource.id === id ? { ...resource, notes } : resource))
    );

    try {
      const resource = lessonResources.find((item) => item.id === id);
      if (!resource) return;

      const { error } = await supabase
        .from('lesson_resources')
        .update({ notes: encodeLessonNotes(notes, resource.section) })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Unable to update notes', error);
    }
  };

  const handleSectionChange = async (id: string, section: LessonSectionKey) => {
    setLessonResources((prev) =>
      prev.map((resource) => (resource.id === id ? { ...resource, section } : resource))
    );

    try {
      const resource = lessonResources.find((item) => item.id === id);
      if (!resource) return;

      const { error } = await supabase
        .from('lesson_resources')
        .update({ notes: encodeLessonNotes(resource.notes, section) })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Unable to update section', error);
    }
  };

  const getSectionFromDroppable = (id: string | number | undefined): LessonSectionKey | null => {
    if (!id) return null;
    if (typeof id === 'string' && id.startsWith('section-')) {
      return id.replace('section-', '') as LessonSectionKey;
    }
    const resource = lessonResources.find((item) => item.id === id);
    return resource?.section ?? null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeIndex = lessonResources.findIndex((item) => item.id === active.id);
    if (activeIndex === -1) return;

    const currentSection = lessonResources[activeIndex].section;
    const destinationSection = getSectionFromDroppable(over.id) ?? currentSection;
    const overResourceId =
      typeof over.id === 'string' && !over.id.startsWith('section-') ? (over.id as string) : null;

    let updatedResources = lessonResources.map((resource) =>
      resource.id === active.id ? { ...resource, section: destinationSection } : resource
    );

    const sectionItems = updatedResources
      .filter((resource) => resource.section === destinationSection)
      .sort((a, b) => a.position - b.position);

    const activeResource = updatedResources.find((resource) => resource.id === active.id);
    if (!activeResource) return;

    const withoutActive = sectionItems.filter((resource) => resource.id !== active.id);
    let reordered: LessonResource[];

    if (overResourceId) {
      const overIndex = withoutActive.findIndex((resource) => resource.id === overResourceId);
      if (overIndex === -1) {
        reordered = [...withoutActive, activeResource];
      } else {
        reordered = [
          ...withoutActive.slice(0, overIndex),
          activeResource,
          ...withoutActive.slice(overIndex),
        ];
      }
    } else {
      reordered = [...withoutActive, activeResource];
    }

    updatedResources = updatedResources.map((resource) => {
      const indexInSection = reordered.findIndex((item) => item.id === resource.id);
      return indexInSection === -1
        ? resource
        : { ...resource, position: indexInSection, section: destinationSection };
    });

    setLessonResources(updatedResources);

    try {
      await Promise.all(
        updatedResources.map((resource) =>
          supabase
            .from('lesson_resources')
            .update({
              position: resource.position,
              notes: encodeLessonNotes(resource.notes, resource.section),
            })
            .eq('id', resource.id)
        )
      );
    } catch (error) {
      console.error('Unable to persist drag changes', error);
    }
  };

  const handleSaveLesson = async () => {
    if (!selectedCurriculum) {
      toast({
        title: 'Select a lesson',
        description: 'Choose a curriculum lesson to save updates.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatePayload: Partial<Tables<'curriculum'>> = {
        subject: lessonMetadata.subject,
        lesson_number: Number(lessonMetadata.lessonNumber) || null,
        lesson_title: lessonMetadata.lessonTitle,
        class: lessonMetadata.className,
        school: lessonMetadata.school,
        teacher_name: lessonMetadata.teacher,
        lesson_date: lessonMetadata.date,
        stage: lessonMetadata.stage,
        status: lessonMetadata.status,
        lesson_skills: selectedSkills.join(', '),
        updated_at: new Date().toISOString(),
      };

      const { error: curriculumError } = await supabase
        .from('curriculum')
        .update(updatePayload)
        .eq('id', selectedCurriculum.id);

      if (curriculumError) throw curriculumError;

      if (assignmentId) {
        const { error: assignmentError } = await supabase
          .from('teacher_assignments')
          .update({ status: lessonMetadata.status, notes: null })
          .eq('id', assignmentId);
        if (assignmentError) throw assignmentError;
      }

      toast({
        title: 'Lesson saved',
        description: 'Curriculum updates shared with linked teachers.',
      });
    } catch (error) {
      console.error('Unable to save lesson plan', error);
      toast({
        title: 'Unable to save lesson',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleContributionUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    const file = event.target.files[0];

    try {
      const path = `${teacherId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('teacher-contributions')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('teacher-contributions')
        .getPublicUrl(uploadData.path);

      const { data: resourceData, error: insertError } = await supabase
        .from('resources')
        .insert({
          title: file.name,
          resource_type: 'worksheet',
          description: `Uploaded via Lesson Builder on ${format(new Date(), 'PPpp')}`,
          file_url: urlData.publicUrl,
          created_by: teacherId,
          is_active: true,
          is_public: false,
          stage: (lessonMetadata.stage || null) as StageEnum | null,
          tags: [selectedCurriculum?.lesson_title ?? 'Curriculum contribution'],
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      setMyResources((prev) => [resourceData as Resource, ...prev]);
      toast({ title: 'Resource uploaded', description: 'Contribution added to your library.' });

    } catch (error) {
      console.error('Unable to upload resource', error);
      toast({
        title: 'Upload failed',
        description: getErrorMessage(error) || 'Ensure storage buckets are configured.',
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing your lesson workspace…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Layers className="h-5 w-5" />
            Curriculum Lesson Builder
          </CardTitle>
          <CardDescription>
            Select a curriculum lesson to auto-populate context, curate skills, and orchestrate drag-and-drop sections.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label>Lesson</Label>
            <Select
              value={selectedCurriculum?.id ?? ''}
              onValueChange={(value) => {
                const lesson = curricula.find((item) => item.id === value) ?? null;
                setSelectedCurriculum(lesson);
                if (lesson) {
                  const params = new URLSearchParams(searchParams);
                  params.set('curriculumId', lesson.id);
                  setSearchParams(params, { replace: false });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a curriculum lesson" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {curricula.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lesson.stage || lesson.curriculum_stage || 'Stage'} • Lesson {lesson.lesson_number ?? '—'} –{' '}
                    {lesson.lesson_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={lessonMetadata.status}
              onValueChange={(value) => setLessonMetadata((prev) => ({ ...prev, status: value as LessonMetadata['status'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Lesson Date</Label>
            <Input
              type="date"
              value={lessonMetadata.date ? format(new Date(lessonMetadata.date), 'yyyy-MM-dd') : ''}
              onChange={(event) => setLessonMetadata((prev) => ({ ...prev, date: event.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {selectedCurriculum ? (
        <div className="grid gap-6 lg:grid-cols-[2fr,1.1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Metadata</CardTitle>
                <CardDescription>Auto-synced fields shared with every co-teacher in this curriculum.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Subject</Label>
                  <Input
                    value={lessonMetadata.subject}
                    onChange={(event) => setLessonMetadata((prev) => ({ ...prev, subject: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Lesson Number</Label>
                  <Input
                    value={lessonMetadata.lessonNumber}
                    onChange={(event) => setLessonMetadata((prev) => ({ ...prev, lessonNumber: event.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Lesson Title</Label>
                  <Input
                    value={lessonMetadata.lessonTitle}
                    onChange={(event) => setLessonMetadata((prev) => ({ ...prev, lessonTitle: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Class</Label>
                  <Input
                    value={lessonMetadata.className}
                    onChange={(event) => setLessonMetadata((prev) => ({ ...prev, className: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>School</Label>
                  <Input
                    value={lessonMetadata.school}
                    onChange={(event) => setLessonMetadata((prev) => ({ ...prev, school: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Stage</Label>
                  <Input
                    value={lessonMetadata.stage}
                    onChange={(event) => setLessonMetadata((prev) => ({ ...prev, stage: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Teacher</Label>
                  <Input
                    value={lessonMetadata.teacher}
                    onChange={(event) => setLessonMetadata((prev) => ({ ...prev, teacher: event.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills Alignment</CardTitle>
                <CardDescription>Search curriculum-aligned skills and tag them for evaluation and reporting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.length ? (
                    selectedSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-2">
                        {skill}
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleSkillToggle(skill)}
                        >
                          Remove
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills selected yet.</p>
                  )}
                </div>
                <div className="rounded-lg border">
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <Input
                      value={skillSearch}
                      onChange={(event) => setSkillSearch(event.target.value)}
                      placeholder="Search Cambridge codes or keywords…"
                      className="h-8 w-full border-0 px-0 focus-visible:ring-0"
                    />
                  </div>
                  <ScrollArea className="h-48">
                    <div className="space-y-1 px-3 py-2">
                      {filteredSkills.map((skill) => {
                        const label = `${skill.skill_code} • ${skill.skill_name}`;
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => handleSkillToggle(label)}
                            className={`w-full rounded px-3 py-2 text-left text-sm transition hover:bg-muted ${
                              selectedSkills.includes(label) ? 'bg-primary/10 text-primary' : 'text-foreground'
                            }`}
                          >
                            <div className="font-medium">{skill.skill_code}</div>
                            <div className="text-xs text-muted-foreground">{skill.skill_name}</div>
                          </button>
                        );
                      })}
                      {filteredSkills.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-muted-foreground">
                          No skills match your search or stage filter.
                        </p>
                      ) : null}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Lesson Plan Canvas</CardTitle>
                  <CardDescription>Drag-and-drop resources across structured sections.</CardDescription>
                </div>
                <Button onClick={handleSaveLesson} disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Plan
                </Button>
              </CardHeader>
              <CardContent>
                <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <div className="flex flex-col gap-4">
                    {SECTION_ORDER.map((sectionKey) => (
                      <SectionColumn key={sectionKey} section={sectionKey} resources={groupedLessonResources[sectionKey]}>
                        <SortableContext
                          items={groupedLessonResources[sectionKey].map((resource) => resource.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {groupedLessonResources[sectionKey].length ? (
                            groupedLessonResources[sectionKey].map((lessonResource) => (
                              <SortableResource
                                key={lessonResource.id}
                                lessonResource={lessonResource}
                                onDelete={handleDeleteResource}
                                onUpdateNotes={handleUpdateNotes}
                                onSectionChange={handleSectionChange}
                              />
                            ))
                          ) : (
                            <div className="rounded border border-dashed bg-background/60 px-4 py-6 text-center text-sm text-muted-foreground">
                              Drag resources here or add from the library.
                            </div>
                          )}
                        </SortableContext>
                      </SectionColumn>
                    ))}
                  </div>

                  <DragOverlay>
                    {activeId ? (
                      <div className="rounded-lg border bg-background px-4 py-3 text-sm shadow">
                        Moving resource…
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Library</CardTitle>
                <CardDescription>Search the central library and drop activities into your plan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search by title, tags, or description"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All resources</SelectItem>
                    <SelectItem value="warmup">Warm-up</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="game">Game</SelectItem>
                    <SelectItem value="worksheet">Worksheet</SelectItem>
                    <SelectItem value="printable">Printable</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                  </SelectContent>
                </Select>
                <ScrollArea className="h-[420px]">
                  <div className="space-y-3 pr-3">
                    {filteredResources.map((resource) => (
                      <button
                        key={resource.id}
                        type="button"
                        onClick={() => handleAddResource(resource)}
                        className="w-full rounded-lg border bg-background px-4 py-3 text-left transition hover:border-primary"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold leading-tight">{resource.title}</h4>
                            {resource.description ? (
                              <p className="text-xs text-muted-foreground line-clamp-2">{resource.description}</p>
                            ) : null}
                            {resource.tags?.length ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {resource.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-[10px]">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                    {filteredResources.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No resources match your filters.
                      </p>
                    ) : null}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Resources & Contributions</CardTitle>
                <CardDescription>Upload new materials and tag them to this lesson.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">Upload to shared bucket</p>
                      <p className="text-xs text-muted-foreground">
                        Files are tagged to your teacher profile and surfaced in admin metrics.
                      </p>
                    </div>
                    <Label className="cursor-pointer">
                      <Input type="file" className="hidden" onChange={handleContributionUpload} />
                      <span className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                        <UploadCloud className="h-4 w-4" /> Upload
                      </span>
                    </Label>
                  </div>
                </div>

                <ScrollArea className="h-48">
                  <div className="space-y-3 pr-3">
                    {myResources.map((resource) => (
                      <div key={resource.id} className="rounded-lg border bg-background p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="font-medium leading-tight">{resource.title}</h4>
                            {resource.description ? (
                              <p className="text-xs text-muted-foreground line-clamp-2">{resource.description}</p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleAddResource(resource)}>
                              Use
                            </Button>
                            {resource.file_url ? (
                              <Button variant="outline" size="sm" asChild>
                                <a href={resource.file_url} target="_blank" rel="noreferrer">
                                  Open
                                </a>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                    {myResources.length === 0 ? (
                      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded border border-dashed text-muted-foreground">
                        <FilePlus2 className="h-6 w-6" />
                        <p className="text-sm">Upload your first contribution to build your resource hub.</p>
                      </div>
                    ) : null}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
            <FolderPlus className="h-10 w-10" />
            <div>
              <p className="text-lg font-semibold">Select a curriculum lesson to begin</p>
              <p className="text-sm">
                The workspace will auto-populate with class details, skills, and shared resources for collaborative planning.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
