import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, GripVertical, Trash2, Plus, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  stage: string | null;
  duration_minutes: number | null;
  image_url: string | null;
}

interface LessonPlanResource {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  notes: string | null;
  position: number;
  description?: string | null;
}

interface LessonPlanData {
  resources: LessonPlanResource[];
  total_duration: number;
}

interface ClassSession {
  id: string;
  curriculum_id: string | null;
  class_id: string;
  lesson_title?: string;
  lesson_subject?: string;
  lesson_plan_data?: LessonPlanData | null;
  lesson_plan_content?: {
    resources?: unknown[];
  };
}

interface LessonBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson?: Partial<ClassSession>;
  session?: Partial<ClassSession>;
  onSave: (lessonPlanData: LessonPlanData) => void | Promise<void>;
}

function SortableResource({
  lessonResource,
  onDelete,
  onUpdateNotes,
}: {
  lessonResource: LessonPlanResource;
  onDelete: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lessonResource.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-3 bg-background mb-2">
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-medium">{lessonResource.title}</h4>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{lessonResource.type}</Badge>
                {lessonResource.duration !== null && (
                  <Badge variant="secondary">{lessonResource.duration} min</Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(lessonResource.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          {lessonResource.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {lessonResource.description}
            </p>
          )}

          <Textarea
            placeholder="Add notes for this resource..."
            value={lessonResource.notes || ''}
            onChange={(e) => onUpdateNotes(lessonResource.id, e.target.value)}
            className="mt-2"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

const LessonBuilderModal = ({
  open,
  onOpenChange,
  lesson,
  session,
  onSave,
}: LessonBuilderModalProps) => {
  const lessonData = (lesson || session || {}) as Partial<ClassSession>;
  const [lessonResources, setLessonResources] = useState<LessonPlanResource[]>([]);
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const mapStoredResources = (resources: unknown[] = []): LessonPlanResource[] => {
    return resources
      .map((resource, index) => {
        if (!resource || typeof resource !== 'object') {
          return null;
        }

        const typedResource = resource as Record<string, unknown>;
        const nestedResource = typedResource.resource as Record<string, unknown> | undefined;

        const id =
          (typedResource.id as string | undefined) ||
          (typedResource.resource_id as string | undefined) ||
          (nestedResource?.id as string | undefined);

        if (!id) {
          return null;
        }

        return {
          id,
          title:
            (typedResource.title as string | undefined) ||
            (nestedResource?.title as string | undefined) ||
            'Untitled Resource',
          type:
            (typedResource.type as string | undefined) ||
            (nestedResource?.resource_type as string | undefined) ||
            'resource',
          duration:
            (typedResource.duration as number | null | undefined) ??
            (nestedResource?.duration_minutes as number | null | undefined) ??
            null,
          notes: (typedResource.notes as string | null | undefined) ?? null,
          position: (typedResource.position as number | undefined) ?? index,
          description:
            (typedResource.description as string | null | undefined) ??
            (nestedResource?.description as string | null | undefined) ??
            null,
        };
      })
      .filter((resource): resource is LessonPlanResource => resource !== null)
      .sort((a, b) => a.position - b.position)
      .map((resource, index) => ({ ...resource, position: index }));
  };

  const loadAvailableResources = useCallback(async () => {
    setLoading(true);
    try {
      // Load available resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('id, title, description, resource_type, stage, duration_minutes, image_url')
        .eq('is_active', true)
        .order('title');

      if (resourcesError) throw resourcesError;

      setAvailableResources(resourcesData || []);
    } catch (error: unknown) {
      console.error('Error loading resources:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load resources',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      const currentLesson = (lesson || session || {}) as Partial<ClassSession>;
      const storedResources =
        currentLesson.lesson_plan_data?.resources ||
        currentLesson.lesson_plan_content?.resources ||
        [];
      setLessonResources(mapStoredResources(storedResources));
      void loadAvailableResources();
    }
  }, [open, lesson, session, loadAvailableResources]);

  const normalizePositions = (resources: LessonPlanResource[]) =>
    resources.map((resource, index) => ({ ...resource, position: index }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLessonResources((prev) => {
        const oldIndex = prev.findIndex((lr) => lr.id === active.id);
        const newIndex = prev.findIndex((lr) => lr.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          return prev;
        }

        return normalizePositions(arrayMove(prev, oldIndex, newIndex));
      });
    }
  };

  const handleAddResource = (resource: Resource) => {
    setLessonResources((prev) => {
      if (prev.some((lr) => lr.id === resource.id)) {
        return prev;
      }

      const newLessonResource: LessonPlanResource = {
        id: resource.id,
        title: resource.title,
        type: resource.resource_type,
        duration: resource.duration_minutes,
        notes: '',
        position: prev.length,
        description: resource.description,
      };

      return normalizePositions([...prev, newLessonResource]);
    });
  };

  const handleDeleteResource = (id: string) => {
    setLessonResources((prev) => normalizePositions(prev.filter((lr) => lr.id !== id)));
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setLessonResources((prev) =>
      normalizePositions(prev.map((lr) => (lr.id === id ? { ...lr, notes } : lr)))
    );
  };

  const handleSave = async () => {
    const normalizedResources = lessonResources.map((lr, index) => ({
      id: lr.id,
      title: lr.title,
      type: lr.type,
      duration: lr.duration,
      notes: lr.notes,
      position: index,
    }));

    const lessonPlanData: LessonPlanData = {
      resources: normalizedResources,
      total_duration: normalizedResources.reduce(
        (sum, lr) => sum + (lr.duration ?? 0),
        0
      ),
    };
    setSaving(true);
    try {
      await Promise.resolve(onSave(lessonPlanData));
    } finally {
      setSaving(false);
    }
  };

  const filteredResources = availableResources.filter((resource) => {
    const matchesSearch =
      searchQuery === '' ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || resource.resource_type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Build Lesson Plan</DialogTitle>
          <DialogDescription>
            {lessonData.lesson_title || 'Untitled Lesson'} - Add and organize resources for your lesson
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Left: Lesson Plan */}
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Lesson Plan ({lessonResources.length} resources)</h3>
              <Button onClick={handleSave} disabled={saving || lessonResources.length === 0}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save & Mark as Done'}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {lessonResources.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No resources added yet. Add resources from the library on the right.
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={lessonResources.map((lr) => lr.id)} strategy={verticalListSortingStrategy}>
                    {lessonResources.map((lr) => (
                      <SortableResource
                        key={lr.id}
                        lessonResource={lr}
                        onDelete={handleDeleteResource}
                        onUpdateNotes={handleUpdateNotes}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* Right: Resource Library */}
          <div className="flex flex-col overflow-hidden border-l pl-6">
            <h3 className="font-semibold mb-4">Resource Library</h3>

            {/* Filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="warmup">Warmup</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="game">Game</SelectItem>
                  <SelectItem value="worksheet">Worksheet</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resource List */}
            <div className="flex-1 overflow-y-auto pr-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading resources...</div>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No resources found</div>
              ) : (
                <div className="space-y-2">
                  {filteredResources.map((resource) => (
                    <div key={resource.id} className="border rounded-lg p-3 hover:bg-accent">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{resource.title}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {resource.resource_type}
                            </Badge>
                            {resource.duration_minutes && (
                              <Badge variant="secondary" className="text-xs">
                                {resource.duration_minutes} min
                              </Badge>
                            )}
                          </div>
                          {resource.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {resource.description}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddResource(resource)}
                          disabled={lessonResources.some((lr) => lr.id === resource.id)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonBuilderModal;