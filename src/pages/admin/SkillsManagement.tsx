import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";

interface Curriculum {
  id: string;
  lesson_title: string;
}

interface Skill {
  id: string;
  skill_code: string;
  skill_name: string;
  category: string;
  description: string;
  subject: string;
  strand: string;
  substrand: string;
  curriculum_id: string;
}

export default function SkillsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [bulkSkillsText, setBulkSkillsText] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ESL");
  const [selectedStrand, setSelectedStrand] = useState("");
  const [selectedSubstrand, setSelectedSubstrand] = useState("");
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [selectedStage, setSelectedStage] = useState("Stage 1");
  const [startCode, setStartCode] = useState("");

  // Fetch curriculums
  const { data: curriculums } = useQuery({
    queryKey: ["curriculums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum")
        .select("id, lesson_title")
        .order("lesson_title");

      if (error) throw error;
      return data as Curriculum[];
    },
  });

  // Fetch skills
  const { data: skills, isLoading } = useQuery({
    queryKey: ["skills", selectedSubject],
    queryFn: async () => {
      let query = supabase
        .from("skills")
        .select("*")
        .order("skill_code");

      if (selectedSubject) {
        query = query.or(`subject.eq.${selectedSubject},category.eq.${selectedSubject}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Skill[];
    },
  });

  // Bulk add skills mutation
  const bulkAddMutation = useMutation({
    mutationFn: async () => {
      const lines = bulkSkillsText.split("\n").filter(line => line.trim());

      if (!selectedCurriculum) {
        throw new Error("Please select a curriculum");
      }

      const skillsToAdd = lines.map((line, index) => {
        const codeNumber = String(index + 1).padStart(2, "0");
        const skillCode = startCode ? `${startCode}${codeNumber}` : `SKILL-${codeNumber}`;

        return {
          skill_name: line.trim(),
          skill_code: skillCode,
          description: line.trim(),
          category: selectedSubject.toLowerCase(),
          subject: selectedSubject,
          strand: selectedStrand || null,
          substrand: selectedSubstrand || null,
          curriculum_id: selectedCurriculum,
          target_stage: [selectedStage.toLowerCase().replace(" ", "_")],
          is_active: true,
        };
      });

      const { data, error } = await supabase
        .from("skills")
        .insert(skillsToAdd)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Skills added successfully",
        description: `Added ${data?.length} skills`,
      });
      setBulkSkillsText("");
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding skills",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete skill mutation
  const deleteMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const { error } = await supabase
        .from("skills")
        .delete()
        .eq("id", skillId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Skill deleted",
        description: "The skill has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting skill",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBulkAdd = () => {
    if (!bulkSkillsText.trim()) {
      toast({
        title: "No skills to add",
        description: "Please enter skills to add (one per line)",
        variant: "destructive",
      });
      return;
    }

    bulkAddMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Skills Management</h1>
        <p className="text-muted-foreground">
          Manage curriculum skills for different subjects and stages
        </p>
      </div>

      <Tabs defaultValue="bulk-add" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bulk-add">Bulk Add Skills</TabsTrigger>
          <TabsTrigger value="view-skills">View & Manage Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk-add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Skills in Bulk</CardTitle>
              <CardDescription>
                Paste skills below, one per line. Each line will become a separate skill.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Curriculum *</Label>
                  <Select value={selectedCurriculum} onValueChange={setSelectedCurriculum}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select curriculum" />
                    </SelectTrigger>
                    <SelectContent>
                      {curriculums?.map((curr) => (
                        <SelectItem key={curr.id} value={curr.id}>
                          {curr.lesson_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ESL">ESL</SelectItem>
                      <SelectItem value="Math">Math</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Phonics">Phonics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Strand</Label>
                  <Input
                    placeholder="e.g., Listening, Number, Biology"
                    value={selectedStrand}
                    onChange={(e) => setSelectedStrand(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Substrand</Label>
                  <Input
                    placeholder="e.g., Listening for detail"
                    value={selectedSubstrand}
                    onChange={(e) => setSelectedSubstrand(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select value={selectedStage} onValueChange={setSelectedStage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Stage 1">Stage 1</SelectItem>
                      <SelectItem value="Stage 2">Stage 2</SelectItem>
                      <SelectItem value="Stage 3">Stage 3</SelectItem>
                      <SelectItem value="Phase 1">Phase 1</SelectItem>
                      <SelectItem value="Phase 2">Phase 2</SelectItem>
                      <SelectItem value="Phase 3">Phase 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Code Prefix (optional)</Label>
                  <Input
                    placeholder="e.g., 1Lm."
                    value={startCode}
                    onChange={(e) => setStartCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Skills (one per line) *</Label>
                <Textarea
                  placeholder="Paste skills here, one per line..."
                  value={bulkSkillsText}
                  onChange={(e) => setBulkSkillsText(e.target.value)}
                  rows={15}
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  {bulkSkillsText.split("\n").filter(line => line.trim()).length} skills
                </p>
              </div>

              <Button
                onClick={handleBulkAdd}
                disabled={bulkAddMutation.isPending}
                className="w-full"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                {bulkAddMutation.isPending ? "Adding..." : `Add ${bulkSkillsText.split("\n").filter(line => line.trim()).length} Skills`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view-skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills Database</CardTitle>
              <CardDescription>
                View and manage all skills in the system
              </CardDescription>
              <div className="flex gap-4 mt-4">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Subjects</SelectItem>
                    <SelectItem value="ESL">ESL</SelectItem>
                    <SelectItem value="Math">Math</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Phonics">Phonics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading skills...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Skill Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Strand</TableHead>
                      <TableHead>Substrand</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skills?.map((skill) => (
                      <TableRow key={skill.id}>
                        <TableCell className="font-mono">{skill.skill_code}</TableCell>
                        <TableCell>{skill.skill_name}</TableCell>
                        <TableCell>{skill.subject || skill.category}</TableCell>
                        <TableCell>{skill.strand || "-"}</TableCell>
                        <TableCell>{skill.substrand || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(skill.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
