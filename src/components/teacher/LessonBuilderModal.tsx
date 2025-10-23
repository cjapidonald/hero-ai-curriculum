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

interface BuilderLessonResource {
  id: string;
  resource_id: string;
  position: number;
  notes: string | null;
  resource: Resource;
}

interface FlattenedLessonResource {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  notes: string | null;
  position: number;
}

interface LessonPlanData {
  resources?: FlattenedLessonResource[];
  total_duration?: number;
}

interface LegacyLessonPlanResource {
  id?: string;
  resource_id?: string;
  position?: number;
  notes?: string | null;
  resource?: Resource;
}

interface ClassSession {
  id: string;
  curriculum_id: string | null;
  class_id: string;
  lesson_title?: string;
  lesson_subject?: string;
  lesson_plan_data?: LessonPlanData | null;
  lesson_plan_content?: {
    resources?: LegacyLessonPlanResource[];
  } | null;
}

interface LessonBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Partial<ClassSession>;
  onSave: (
    lessonPlanData: {
      resources: FlattenedLessonResource[];
      total_duration: number;
    }
  ) => void | Promise<void>;
}

function SortableResource({
  lessonResource,
  onDelete,
  onUpdateNotes,
}: {
  lessonResource: BuilderLessonResource;
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
              <h4 className="font-medium">{lessonResource.resource.title}</h4>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{lessonResource.resource.resource_type}</Badge>
                {lessonResource.resource.duration_minutes && (
                  <Badge variant="secondary">{lessonResource.resource.duration_minutes} min</Badge>
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

          {lessonResource.resource.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {lessonResource.resource.description}
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

const LessonBuilderModal = ({ open, onOpenChange, lesson, onSave }: LessonBuilderModalProps) => {
  const [lessonResources, setLessonResources] = useState<BuilderLessonResource[]>([]);
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

  useEffect(() => {
    if (!open) {
      return;
    }

    let isMounted = true;

    const initializeLessonPlan = async () => {
      const resourcesList = await loadAvailableResources();
      if (!isMounted) return;

      const resourceSource = resourcesList.length > 0 ? resourcesList : availableResources;
      const resourceMap = new Map(resourceSource.map((resource) => [resource.id, resource]));

      let mappedResources: BuilderLessonResource[] = [];

      const planDataResources = lesson.lesson_plan_data?.resources;
      if (planDataResources && Array.isArray(planDataResources) && planDataResources.length > 0) {
        mappedResources = planDataResources
          .slice()
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((resource) => {
            const resourceDetails =
              resourceMap.get(resource.id) ||
              ({
                id: resource.id,
                title: resource.title,
                description: null,
                resource_type: resource.type,
                stage: null,
                duration_minutes: resource.duration,
                image_url: null,
              } as Resource);

            return {
              id: resource.id,
              resource_id: resource.id,
              position: resource.position ?? 0,
              notes: resource.notes ?? '',
              resource: resourceDetails,
            };
          });
      } else if (lesson.lesson_plan_content?.resources?.length) {
        mappedResources = lesson.lesson_plan_content.resources
          .map((resource, index) => {
            const fallbackId = resource.resource_id || resource.resource?.id || resource.id || `resource-${index}`;
            const resourceDetails =
              resource.resource ||
              resourceMap.get(fallbackId) ||
              ({
                id: fallbackId,
                title: resource.resource?.title || resource.title || 'Untitled Resource',
                description: resource.resource?.description || resource.description || null,
                resource_type: resource.resource?.resource_type || resource.type || 'activity',
                stage: resource.resource?.stage || null,
                duration_minutes:
                  resource.resource?.duration_minutes ?? resource.duration ?? null,
                image_url: resource.resource?.image_url || null,
              } as Resource);

            return {
              id: fallbackId,
              resource_id: fallbackId,
              position: resource.position ?? index,
              notes: resource.notes ?? '',
              resource: resourceDetails,
            };
          })
          .sort((a, b) => a.position - b.position);
      }

      if (isMounted) {
        setLessonResources(mappedResources);
      }
    };

    initializeLessonPlan();

    return () => {
      isMounted = false;
    };
  }, [open, lesson]);

  const loadAvailableResources = async (): Promise<Resource[]> => {
    setLoading(true);
    try {
      // Load available resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('id, title, description, resource_type, stage, duration_minutes, image_url')
        .eq('is_active', true)
        .order('title');

      if (resourcesError) throw resourcesError;

      const resources = resourcesData || [];
      setAvailableResources(resources);
      return resources;
    } catch (error: any) {
      console.error('Error loading resources:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load resources',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lessonResources.findIndex((lr) => lr.id === active.id);
      const newIndex = lessonResources.findIndex((lr) => lr.id === over.id);

      const newOrder = arrayMove(lessonResources, oldIndex, newIndex);
      setLessonResources(newOrder);
    }
  };

  const handleAddResource = (resource: Resource) => {
    const newLessonResource: BuilderLessonResource = {
      id: resource.id,
      resource_id: resource.id,
      position: lessonResources.length,
      notes: '',
      resource,
    };
    setLessonResources([...lessonResources, newLessonResource]);
  };

  const handleDeleteResource = (id: string) => {
    setLessonResources(lessonResources.filter((lr) => lr.id !== id));
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setLessonResources(
      lessonResources.map((lr) => (lr.id === id ? { ...lr, notes } : lr))
    );
  };

  const handleSave = async () => {
    setSaving(true);

    const flattenedResources = lessonResources.map((lr, index) => ({
      id: lr.resource_id,
      title: lr.resource.title,
      type: lr.resource.resource_type,
      duration: lr.resource.duration_minutes ?? null,
      notes: lr.notes?.trim() ? lr.notes : null,
      position: index,
    }));

    const totalDuration = flattenedResources.reduce(
      (sum, resource) => sum + (resource.duration ?? 0),
      0
    );

    try {
      await onSave({
        resources: flattenedResources,
        total_duration: totalDuration,
      });
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
            {lesson.lesson_title || 'Untitled Lesson'} - Add and organize resources for your lesson
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
                          disabled={lessonResources.some((lr) => lr.resource_id === resource.id)}
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