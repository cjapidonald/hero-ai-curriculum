import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ClassRecord {
  id: string;
  class_name: string;
  teacher_name: string | null;
  stage: string | null;
  schedule_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  current_students: number | null;
  max_students: number | null;
  is_active: boolean | null;
  classroom_location: string | null;
}

interface Teacher {
  id: string;
  name: string;
  surname: string;
}

export function ClassesCRUD() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRecord | null>(null);
  const [formData, setFormData] = useState({
    class_name: '',
    teacher_name: '',
    stage: 'stage_1',
    schedule_days: [] as string[],
    start_time: '',
    end_time: '',
    max_students: 15,
    classroom_location: '',
    is_active: true,
  });

  const stages = [
    { value: 'stage_1', label: 'Stage 1' },
    { value: 'stage_2', label: 'Stage 2' },
    { value: 'stage_3', label: 'Stage 3' },
    { value: 'stage_4', label: 'Stage 4' },
    { value: 'stage_5', label: 'Stage 5' },
    { value: 'stage_6', label: 'Stage 6' },
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("class_name");

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("id, name, surname")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setTeachers(data || []);
    } catch (error: any) {
      console.error("Error fetching teachers:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingClass) {
        // Update existing class
        const { error } = await supabase
          .from("classes")
          .update(formData)
          .eq("id", editingClass.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Class updated successfully",
        });
      } else {
        // Create new class
        const { error } = await supabase
          .from("classes")
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Class created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchClasses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (classItem: ClassRecord) => {
    setEditingClass(classItem);
    setFormData({
      class_name: classItem.class_name,
      teacher_name: classItem.teacher_name || '',
      stage: classItem.stage || 'stage_1',
      schedule_days: classItem.schedule_days || [],
      start_time: classItem.start_time || '',
      end_time: classItem.end_time || '',
      max_students: classItem.max_students || 15,
      classroom_location: classItem.classroom_location || '',
      is_active: classItem.is_active !== false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class deleted successfully",
      });

      fetchClasses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingClass(null);
    setFormData({
      class_name: '',
      teacher_name: '',
      stage: 'stage_1',
      schedule_days: [],
      start_time: '',
      end_time: '',
      max_students: 15,
      classroom_location: '',
      is_active: true,
    });
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(day)
        ? prev.schedule_days.filter(d => d !== day)
        : [...prev.schedule_days, day]
    }));
  };

  const filteredClasses = classes.filter(c =>
    c.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.stage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading classes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClass ? 'Edit Class' : 'Create New Class'}</DialogTitle>
              <DialogDescription>
                {editingClass ? 'Update class information' : 'Add a new class to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class_name">Class Name *</Label>
                  <Input
                    id="class_name"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher_name">Teacher</Label>
                  <Select
                    value={formData.teacher_name}
                    onValueChange={(value) => setFormData({ ...formData, teacher_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={`${teacher.name} ${teacher.surname}`}>
                          {teacher.name} {teacher.surname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage">Stage *</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) => setFormData({ ...formData, stage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_students">Max Students *</Label>
                  <Input
                    id="max_students"
                    type="number"
                    value={formData.max_students}
                    onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="classroom_location">Classroom Location</Label>
                  <Input
                    id="classroom_location"
                    value={formData.classroom_location}
                    onChange={(e) => setFormData({ ...formData, classroom_location: e.target.value })}
                    placeholder="e.g., Room A1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Schedule Days</Label>
                <div className="grid grid-cols-4 gap-2">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={day}
                        checked={formData.schedule_days.includes(day)}
                        onChange={() => handleDayToggle(day)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={day} className="text-sm cursor-pointer">
                        {day.slice(0, 3)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingClass ? 'Update' : 'Create'} Class
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Class Name</TableHead>
              <TableHead className="whitespace-nowrap">Teacher</TableHead>
              <TableHead className="whitespace-nowrap">Stage</TableHead>
              <TableHead className="whitespace-nowrap">Schedule</TableHead>
              <TableHead className="whitespace-nowrap">Enrollment</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClasses.map((classItem) => (
              <TableRow key={classItem.id}>
                <TableCell className="font-medium whitespace-nowrap">{classItem.class_name}</TableCell>
                <TableCell className="whitespace-nowrap">{classItem.teacher_name || 'Unassigned'}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant="outline">{classItem.stage}</Badge>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {classItem.schedule_days?.join(', ') || 'Not set'} • {classItem.start_time}-{classItem.end_time}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {classItem.current_students || 0}/{classItem.max_students}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant={classItem.is_active ? 'default' : 'secondary'}>
                    {classItem.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(classItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(classItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredClasses.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No classes found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}
