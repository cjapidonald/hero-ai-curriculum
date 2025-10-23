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

interface LessonResource {
  id: string;
  resource_id: string;
  position: number;
  notes: string | null;
  resource: Resource;
}

interface ClassSession {
  id: string;
  curriculum_id: string | null;
  class_id: string;
  lesson_title?: string;
  lesson_subject?: string;
}

interface LessonBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: any;
  onSave: (lessonPlanData: any) => void;
}

function SortableResource({
  lessonResource,
  onDelete,
  onUpdateNotes,
}: {
  lessonResource: LessonResource;
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

const LessonBuilderModal = ({ open, onOpenChange, lesson, onSave }: LessonBuilderModalProps) => {\n  const [lessonResources, setLessonResources] = useState<LessonResource[]>([]);\n  const [availableResources, setAvailableResources] = useState<Resource[]>([]);\n  const [searchQuery, setSearchQuery] = useState(\'\');\n  const [typeFilter, setTypeFilter] = useState<string>(\'all\');\n  const [loading, setLoading] = useState(false);\n  const [saving, setSaving] = useState(false);\n\n  const { toast } = useToast();\n\n  const sensors = useSensors(\n    useSensor(PointerSensor),\n    useSensor(KeyboardSensor, {\n      coordinateGetter: sortableKeyboardCoordinates,\n    })\n  );\n\n  useEffect(() => {\n    if (open) {\n      if (lesson.lesson_plan_content) {\n        setLessonResources(lesson.lesson_plan_content.resources || []);\n      }\n      loadAvailableResources();\n    }\n  }, [open, lesson]);\n\n  const loadAvailableResources = async () => {\n    setLoading(true);\n    try {\n      // Load available resources\n      const { data: resourcesData, error: resourcesError } = await supabase\n        .from(\'resources\')\n        .select(\'id, title, description, resource_type, stage, duration_minutes, image_url\')\n        .eq(\'is_active\', true)\n        .order(\'title\');\n\n      if (resourcesError) throw resourcesError;\n\n      setAvailableResources(resourcesData || []);\n    } catch (error: any) {\n      console.error(\'Error loading resources:\', error);\n      toast({\n        title: \'Error\',\n        description: error.message || \'Failed to load resources\',\n        variant: \'destructive\',\n      });\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  const handleDragEnd = (event: DragEndEvent) => {\n    const { active, over } = event;\n\n    if (over && active.id !== over.id) {\n      const oldIndex = lessonResources.findIndex((lr) => lr.id === active.id);\n      const newIndex = lessonResources.findIndex((lr) => lr.id === over.id);\n\n      const newOrder = arrayMove(lessonResources, oldIndex, newIndex);\n      setLessonResources(newOrder);\n    }\n  };\n\n  const handleAddResource = (resource: Resource) => {\n    const newLessonResource: LessonResource = {\n      id: resource.id,\n      resource_id: resource.id,\n      position: lessonResources.length,\n      notes: \'\',\n      resource: resource,\n    };\n    setLessonResources([...lessonResources, newLessonResource]);\n  };\n\n  const handleDeleteResource = (id: string) => {\n    setLessonResources(lessonResources.filter((lr) => lr.id !== id));\n  };\n\n  const handleUpdateNotes = (id: string, notes: string) => {\n    setLessonResources(\n      lessonResources.map((lr) => (lr.id === id ? { ...lr, notes } : lr))\n    );\n  };\n\n  const handleSave = () => {\n    const lessonPlanData = {\n      resources: lessonResources.map((lr, index) => ({\n        ...\lr,\n        position: index,\n      })),\n      total_duration: lessonResources.reduce(\n        (sum, lr) => sum + (lr.resource.duration_minutes || 0),\n        0\n      ),\n    };\n    onSave(lessonPlanData);\n  };

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
                          onClick={() => handleAddResource(resource.id)}
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
