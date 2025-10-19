import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, GripVertical, Trash2, Plus, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
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
  objectives: string[] | null;
  materials_needed: string[] | null;
  tags: string[] | null;
  image_url: string | null;
}

interface Curriculum {
  id: string;
  title: string;
  description: string | null;
  stage: string | null;
  lesson_number: number | null;
  objectives: string[] | null;
}

interface LessonResource {
  id: string;
  resource_id: string;
  position: number;
  notes: string | null;
  resource: Resource;
}

interface SortableResourceProps {
  lessonResource: LessonResource;
  onDelete: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

function SortableResource({ lessonResource, onDelete, onUpdateNotes }: SortableResourceProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lessonResource.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-4 bg-background mb-2"
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold">{lessonResource.resource.title}</h4>
              <p className="text-sm text-muted-foreground">
                {lessonResource.resource.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(lessonResource.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{lessonResource.resource.resource_type}</Badge>
            {lessonResource.resource.duration_minutes && (
              <Badge variant="secondary">{lessonResource.resource.duration_minutes} min</Badge>
            )}
            {lessonResource.resource.stage && (
              <Badge>{lessonResource.resource.stage}</Badge>
            )}
          </div>

          {lessonResource.resource.tags && lessonResource.resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {lessonResource.resource.tags.map((tag, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-muted rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2">
            <Label className="text-xs">Teacher Notes</Label>
            <Textarea
              value={lessonResource.notes || ''}
              onChange={(e) => onUpdateNotes(lessonResource.id, e.target.value)}
              placeholder="Add notes about how to use this resource..."
              className="text-sm h-16"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceCard({ resource, onClick }: { resource: Resource; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        {resource.image_url && (
          <img
            src={resource.image_url}
            alt={resource.title}
            className="w-full h-32 object-cover rounded mb-2"
          />
        )}
        <h4 className="font-semibold mb-1">{resource.title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {resource.description}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{resource.resource_type}</Badge>
          {resource.duration_minutes && (
            <Badge variant="secondary" className="text-xs">{resource.duration_minutes}m</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LessonBuilder({ teacherId }: { teacherId: string }) {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [lessonResources, setLessonResources] = useState<LessonResource[]>([]);
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchCurricula();
    fetchResources();
  }, []);

  useEffect(() => {
    if (selectedCurriculum) {
      fetchLessonResources();
    }
  }, [selectedCurriculum]);

  useEffect(() => {
    filterResources();
  }, [searchQuery, filterType, availableResources]);

  const fetchCurricula = async () => {
    try {
      const { data, error } = await supabase
        .from('curriculum')
        .select('*')
        .order('stage', { ascending: true })
        .order('lesson_number', { ascending: true });

      if (error) throw error;
      setCurricula(data || []);
    } catch (error) {
      console.error('Error fetching curriculum:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setAvailableResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const fetchLessonResources = async () => {
    if (!selectedCurriculum) return;

    try {
      const { data, error } = await supabase
        .from('lesson_resources')
        .select(`
          id,
          resource_id,
          position,
          notes,
          resource:resources(*)
        `)
        .eq('curriculum_id', selectedCurriculum.id)
        .order('position');

      if (error) throw error;
      setLessonResources(data || []);
    } catch (error) {
      console.error('Error fetching lesson resources:', error);
    }
  };

  const filterResources = () => {
    let filtered = availableResources;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((r) => r.resource_type === filterType);
    }

    setFilteredResources(filtered);
  };

  const handleAddResource = async (resource: Resource) => {
    if (!selectedCurriculum) {
      toast({
        title: 'Error',
        description: 'Please select a lesson first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const maxPosition = lessonResources.length > 0
        ? Math.max(...lessonResources.map((lr) => lr.position))
        : -1;

      const { data, error } = await supabase
        .from('lesson_resources')
        .insert([
          {
            curriculum_id: selectedCurriculum.id,
            resource_id: resource.id,
            position: maxPosition + 1,
            notes: '',
          },
        ])
        .select(`
          id,
          resource_id,
          position,
          notes,
          resource:resources(*)
        `)
        .single();

      if (error) throw error;

      setLessonResources([...lessonResources, data]);
      toast({
        title: 'Success',
        description: 'Resource added to lesson',
      });
    } catch (error) {
      console.error('Error adding resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to add resource',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lesson_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLessonResources(lessonResources.filter((lr) => lr.id !== id));
      toast({
        title: 'Success',
        description: 'Resource removed from lesson',
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove resource',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    // Update locally immediately for better UX
    setLessonResources(
      lessonResources.map((lr) =>
        lr.id === id ? { ...lr, notes } : lr
      )
    );

    // Debounced save to database
    try {
      const { error } = await supabase
        .from('lesson_resources')
        .update({ notes })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lessonResources.findIndex((lr) => lr.id === active.id);
      const newIndex = lessonResources.findIndex((lr) => lr.id === over.id);

      const newOrder = arrayMove(lessonResources, oldIndex, newIndex);
      setLessonResources(newOrder);

      // Update positions in database
      try {
        const updates = newOrder.map((lr, index) => ({
          id: lr.id,
          position: index,
        }));

        for (const update of updates) {
          await supabase
            .from('lesson_resources')
            .update({ position: update.position })
            .eq('id', update.id);
        }

        toast({
          title: 'Success',
          description: 'Resources reordered',
        });
      } catch (error) {
        console.error('Error reordering resources:', error);
        toast({
          title: 'Error',
          description: 'Failed to save new order',
          variant: 'destructive',
        });
      }
    }

    setActiveId(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Curriculum Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select a Lesson to Build</CardTitle>
          <CardDescription>Choose a curriculum lesson to add resources</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCurriculum?.id || ''}
            onValueChange={(value) => {
              const curriculum = curricula.find((c) => c.id === value);
              setSelectedCurriculum(curriculum || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a lesson" />
            </SelectTrigger>
            <SelectContent>
              {curricula.map((curriculum) => (
                <SelectItem key={curriculum.id} value={curriculum.id}>
                  {curriculum.stage} - Lesson {curriculum.lesson_number}: {curriculum.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCurriculum && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Panel: Lesson Plan */}
          <Card className="lg:sticky lg:top-4 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Lesson Plan</span>
                <Badge>{selectedCurriculum.stage}</Badge>
              </CardTitle>
              <CardDescription>
                Lesson {selectedCurriculum.lesson_number}: {selectedCurriculum.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCurriculum.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedCurriculum.description}
                </p>
              )}

              {selectedCurriculum.objectives && selectedCurriculum.objectives.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2">Objectives:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {selectedCurriculum.objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Resources ({lessonResources.length})</h4>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={lessonResources.map((lr) => lr.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {lessonResources.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No resources added yet. Search and click resources on the right to add them.
                        </p>
                      </div>
                    ) : (
                      lessonResources.map((lessonResource) => (
                        <SortableResource
                          key={lessonResource.id}
                          lessonResource={lessonResource}
                          onDelete={handleDeleteResource}
                          onUpdateNotes={handleUpdateNotes}
                        />
                      ))
                    )}
                  </SortableContext>

                  <DragOverlay>
                    {activeId ? (
                      <div className="border rounded-lg p-4 bg-background opacity-50">
                        Dragging...
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel: Resources Library */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Resources Library
                </CardTitle>
                <CardDescription>Search and add resources to your lesson</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Search</Label>
                  <Input
                    placeholder="Search by title, description, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Filter by Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="warmup">Warmup</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                      <SelectItem value="game">Game</SelectItem>
                      <SelectItem value="worksheet">Worksheet</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="homework">Homework</SelectItem>
                      <SelectItem value="printable">Printable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onClick={() => handleAddResource(resource)}
                />
              ))}
              {filteredResources.length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  No resources found matching your criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
