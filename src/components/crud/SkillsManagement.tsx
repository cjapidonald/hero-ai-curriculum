import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface SkillsManagementProps {
  showHeader?: boolean;
}

type SkillCategory =
  | "listening"
  | "speaking"
  | "reading"
  | "writing"
  | "vocabulary"
  | "grammar"
  | "pronunciation"
  | "fluency"
  | "comprehension"
  | "social_skills";

type StageValue = "stage_1" | "stage_2" | "stage_3" | "stage_4" | "stage_5" | "stage_6";

interface Skill {
  id: string;
  skill_name: string;
  skill_code: string;
  category: SkillCategory;
  description: string | null;
  target_stage: StageValue[] | null;
  curriculum_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  curriculum?: {
    id: string;
    lesson_title: string | null;
  } | null;
}

interface CurriculumOption {
  id: string;
  lesson_title: string | null;
}

const SKILL_CATEGORIES: { value: SkillCategory; label: string }[] = [
  { value: "listening", label: "Listening" },
  { value: "speaking", label: "Speaking" },
  { value: "reading", label: "Reading" },
  { value: "writing", label: "Writing" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "grammar", label: "Grammar" },
  { value: "pronunciation", label: "Pronunciation" },
  { value: "fluency", label: "Fluency" },
  { value: "comprehension", label: "Comprehension" },
  { value: "social_skills", label: "Social Skills" },
];

const STAGE_OPTIONS: { value: StageValue; label: string }[] = [
  { value: "stage_1", label: "Stage 1" },
  { value: "stage_2", label: "Stage 2" },
  { value: "stage_3", label: "Stage 3" },
  { value: "stage_4", label: "Stage 4" },
  { value: "stage_5", label: "Stage 5" },
  { value: "stage_6", label: "Stage 6" },
];

const createDefaultFormState = () => ({
  skill_name: "",
  skill_code: "",
  category: SKILL_CATEGORIES[0]?.value ?? "listening",
  description: "",
  target_stage: [] as StageValue[],
  curriculum_id: "",
  is_active: true,
});

export const SkillsManagement = ({ showHeader = true }: SkillsManagementProps) => {
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumOption[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | SkillCategory>("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState(() => createDefaultFormState());

  const fetchData = async () => {
    try {
      setLoading(true);

      const [skillsRes, curriculumsRes] = await Promise.all([
        supabase
          .from("skills")
          .select(
            "id, skill_name, skill_code, category, description, target_stage, curriculum_id, is_active, created_at, curriculum:curriculum(id, lesson_title)"
          )
          .order("skill_code", { ascending: true }),
        supabase.from("curriculum").select("id, lesson_title").order("lesson_title", { ascending: true }),
      ]);

      if (skillsRes.error) throw skillsRes.error;
      if (curriculumsRes.error) throw curriculumsRes.error;

      setSkills((skillsRes.data ?? []) as Skill[]);
      setCurriculums((curriculumsRes.data ?? []) as CurriculumOption[]);
    } catch (error: any) {
      console.error("Error fetching skills:", error);
      toast({
        title: "Error",
        description: "Failed to load skills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const resetForm = () => {
    setEditingSkill(null);
    setFormData(createDefaultFormState());
  };

  const toggleStage = (stage: StageValue) => {
    setFormData((current) => {
      const alreadySelected = current.target_stage.includes(stage);
      const target_stage = alreadySelected
        ? current.target_stage.filter((value) => value !== stage)
        : [...current.target_stage, stage];

      return { ...current, target_stage };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.skill_name.trim() || !formData.skill_code.trim()) {
      toast({
        title: "Missing information",
        description: "Skill name and code are required",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      skill_name: formData.skill_name.trim(),
      skill_code: formData.skill_code.trim(),
      category: formData.category,
      description: formData.description.trim() || null,
      target_stage: formData.target_stage.length > 0 ? formData.target_stage : null,
      curriculum_id: formData.curriculum_id ? formData.curriculum_id : null,
      is_active: formData.is_active,
    };

    try {
      if (editingSkill) {
        const { error } = await supabase.from("skills").update(payload).eq("id", editingSkill.id);
        if (error) throw error;
        toast({
          title: "Skill updated",
          description: "The skill was updated successfully.",
        });
      } else {
        const { error } = await supabase.from("skills").insert(payload as Skill);
        if (error) throw error;
        toast({
          title: "Skill created",
          description: "The skill was created successfully.",
        });
      }

      setDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error("Error saving skill:", error);
      toast({
        title: "Error",
        description: error.message ?? "Failed to save skill",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      skill_name: skill.skill_name,
      skill_code: skill.skill_code,
      category: skill.category,
      description: skill.description ?? "",
      target_stage: skill.target_stage ?? [],
      curriculum_id: skill.curriculum_id ?? "",
      is_active: skill.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;

    try {
      const { error } = await supabase.from("skills").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Skill deleted",
        description: "The skill was removed successfully.",
      });

      await fetchData();
    } catch (error: any) {
      console.error("Error deleting skill:", error);
      toast({
        title: "Error",
        description: error.message ?? "Failed to delete skill",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "listening":
        return "bg-blue-100 text-blue-700";
      case "speaking":
        return "bg-green-100 text-green-700";
      case "reading":
        return "bg-purple-100 text-purple-700";
      case "writing":
        return "bg-orange-100 text-orange-700";
      case "vocabulary":
        return "bg-yellow-100 text-yellow-700";
      case "grammar":
        return "bg-red-100 text-red-700";
      case "pronunciation":
        return "bg-teal-100 text-teal-700";
      case "fluency":
        return "bg-pink-100 text-pink-700";
      case "comprehension":
        return "bg-indigo-100 text-indigo-700";
      case "social_skills":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getStageLabel = (stage: StageValue) => {
    const match = STAGE_OPTIONS.find((option) => option.value === stage);
    return match?.label ?? stage;
  };

  const filteredSkills = useMemo(() => {
    if (categoryFilter === "all") {
      return skills;
    }

    return skills.filter((skill) => skill.category === categoryFilter);
  }, [skills, categoryFilter]);

  const curriculumNameMap = useMemo(() => {
    return curriculums.reduce((acc, curriculum) => {
      acc[curriculum.id] = curriculum.lesson_title || "Untitled curriculum";
      return acc;
    }, {} as Record<string, string>);
  }, [curriculums]);

  const filteredCurriculumSkills = useMemo(() => {
    if (selectedCurriculum === "all") {
      return skills;
    }

    return skills.filter((skill) => skill.curriculum_id === selectedCurriculum);
  }, [skills, selectedCurriculum]);

  if (loading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  return (
    <div className="space-y-4">
      <div className={showHeader ? "flex justify-between items-center" : "flex justify-end"}>
        {showHeader && (
          <div>
            <h2 className="text-2xl font-bold">Skills Management</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage skills that can be assigned across the curriculum
            </p>
          </div>
        )}
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSkill ? "Edit Skill" : "Add New Skill"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="skill_name">Skill Name *</Label>
                  <Input
                    id="skill_name"
                    value={formData.skill_name}
                    onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                    required
                    placeholder="e.g., Count 1-20"
                  />
                </div>
                <div>
                  <Label htmlFor="skill_code">Skill Code *</Label>
                  <Input
                    id="skill_code"
                    value={formData.skill_code}
                    onChange={(e) => setFormData({ ...formData, skill_code: e.target.value })}
                    required
                    placeholder="e.g., 1Nc.01"
                  />
                </div>
                <div>
                  <Label htmlFor="skill_category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: SkillCategory) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="curriculum_id">Curriculum Link</Label>
                  <Select
                    value={formData.curriculum_id || ""}
                    onValueChange={(value) => setFormData({ ...formData, curriculum_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {curriculums.map((curriculum) => (
                        <SelectItem key={curriculum.id} value={curriculum.id}>
                          {curriculum.lesson_title || "Untitled curriculum"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what students should be able to do"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Target Stages</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {STAGE_OPTIONS.map((stage) => {
                    const checked = formData.target_stage.includes(stage.value);
                    return (
                      <label
                        key={stage.value}
                        className="flex items-center gap-2 rounded-md border p-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          checked={checked}
                          onChange={() => toggleStage(stage.value)}
                        />
                        <span>{stage.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Reset
                </Button>
                <Button type="submit">{editingSkill ? "Save Changes" : "Create Skill"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:w-72 space-y-1">
            <Label className="text-sm font-medium">Filter by category</Label>
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as "all" | SkillCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {SKILL_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filteredSkills.length} of {skills.length} skills
          </div>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Skill</TableHead>
                <TableHead className="min-w-[120px]">Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="min-w-[160px]">Target Stages</TableHead>
                <TableHead>Curriculum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSkills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No skills found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSkills.map((skill) => (
                  <TableRow key={skill.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{skill.skill_name}</span>
                        {skill.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            {skill.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{skill.skill_code}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className={getCategoryColor(skill.category)}>
                        {SKILL_CATEGORIES.find((item) => item.value === skill.category)?.label ?? skill.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {skill.target_stage && skill.target_stage.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {skill.target_stage.map((stage) => (
                            <Badge key={stage} variant="outline" className="text-xs">
                              {getStageLabel(stage)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">All stages</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {skill.curriculum_id ? (
                        <span>{skill.curriculum?.lesson_title ?? curriculumNameMap[skill.curriculum_id] ?? "Linked curriculum"}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={skill.is_active ? "default" : "secondary"}>
                        {skill.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(skill)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(skill.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:w-72 space-y-1">
            <Label className="text-sm font-medium">Filter by curriculum</Label>
            <Select value={selectedCurriculum} onValueChange={setSelectedCurriculum}>
              <SelectTrigger>
                <SelectValue placeholder="All curriculums" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All curriculums</SelectItem>
                {curriculums.map((curriculum) => (
                  <SelectItem key={curriculum.id} value={curriculum.id}>
                    {curriculum.lesson_title || "Untitled curriculum"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredCurriculumSkills.length} of {skills.length} skills
          </div>
        </div>

        <div className="border rounded-lg">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curriculum</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Target Stages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCurriculumSkills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No skills found for the selected curriculum.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCurriculumSkills.map((skill) => (
                    <TableRow key={skill.id}>
                      <TableCell>
                        {skill.curriculum?.lesson_title ||
                          (skill.curriculum_id ? curriculumNameMap[skill.curriculum_id] : "Unassigned")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {skill.skill_name || skill.description || "Untitled skill"}
                      </TableCell>
                      <TableCell>{skill.skill_code}</TableCell>
                      <TableCell>
                        {SKILL_CATEGORIES.find((item) => item.value === skill.category)?.label ?? skill.category}
                      </TableCell>
                      <TableCell>
                        {skill.target_stage && skill.target_stage.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {skill.target_stage.map((stage) => (
                              <Badge key={stage} variant="outline" className="text-xs">
                                {getStageLabel(stage)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">All stages</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};
