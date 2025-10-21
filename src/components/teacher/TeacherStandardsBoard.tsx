import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle2, Clock4, AlertCircle, Download, ExternalLink, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Mode = "teacher" | "admin";

type TeacherStandard = Tables<"teacher_standards">;
type TeacherStandardProgress = Tables<"teacher_standard_progress">;

interface TeacherStandardsBoardProps {
  teacherId: string;
  mode: Mode;
  teacherName?: string;
}

interface DomainProgressSummary {
  total: number;
  approved: number;
  submitted: number;
}

interface DescriptorDialogState {
  open: boolean;
  standard: TeacherStandard | null;
}

const formatPercentage = (value: number) =>
  Number.isFinite(value) ? `${Math.round(value)}%` : "0%";

const statusConfig: Record<
  TeacherStandardProgress["status"],
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: typeof CheckCircle2 | typeof Clock4 | typeof AlertCircle;
    className?: string;
  }
> = {
  not_started: { label: "Not Started", variant: "outline", icon: AlertCircle },
  in_progress: { label: "In Progress", variant: "secondary", icon: Clock4 },
  submitted: { label: "Submitted", variant: "default", icon: Clock4 },
  approved: {
    label: "Approved",
    variant: "default",
    icon: CheckCircle2,
    className: "bg-emerald-600 text-white hover:bg-emerald-600/90",
  },
};

const evidenceAccept = ".pdf,image/*,video/*,audio/*";
const EVIDENCE_MAX_SIZE = 25 * 1024 * 1024; // 25MB
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 6; // 6 hours

export const TeacherStandardsBoard = ({ teacherId, mode, teacherName }: TeacherStandardsBoardProps) => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [uploadingStandardId, setUploadingStandardId] = useState<string | null>(null);
  const [processingApprovalId, setProcessingApprovalId] = useState<string | null>(null);
  const [standards, setStandards] = useState<TeacherStandard[]>([]);
  const [progressRecords, setProgressRecords] = useState<TeacherStandardProgress[]>([]);
  const [evidenceUrls, setEvidenceUrls] = useState<Record<string, string | null>>({});
  const [descriptorDialog, setDescriptorDialog] = useState<DescriptorDialogState>({
    open: false,
    standard: null,
  });

  const progressByStandard = useMemo(() => {
    const map = new Map<string, TeacherStandardProgress>();
    for (const record of progressRecords) {
      map.set(record.standard_id, record);
    }
    return map;
  }, [progressRecords]);

  const domainSummaries = useMemo(() => {
    const summary = new Map<string, DomainProgressSummary>();

    for (const standard of standards) {
      const existing = summary.get(standard.domain) ?? {
        total: 0,
        approved: 0,
        submitted: 0,
      };
      existing.total += 1;

      const progress = progressByStandard.get(standard.id);
      if (progress?.status === "approved") {
        existing.approved += 1;
      } else if (progress?.status === "submitted") {
        existing.submitted += 1;
      }

      summary.set(standard.domain, existing);
    }

    return Array.from(summary.entries()).map(([domain, stats]) => {
      const approvedPercentage =
        stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;
      return {
        domain,
        stats,
        approvedPercentage,
      };
    });
  }, [standards, progressByStandard]);

  useEffect(() => {
    if (!teacherId) {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        const [{ data: standardsData, error: standardsError }, { data: progressData, error: progressError }] =
          await Promise.all([
            supabase
              .from("teacher_standards")
              .select("*")
              .order("domain", { ascending: true })
              .order("standard_number", { ascending: true })
              .order("focus_area_number", { ascending: true }),
            supabase
              .from("teacher_standard_progress")
              .select("*")
              .eq("teacher_id", teacherId),
          ]);

        if (standardsError) {
          throw standardsError;
        }
        if (progressError && progressError.code !== "42P01") {
          throw progressError;
        }

        setStandards((standardsData as TeacherStandard[]) ?? []);
        setProgressRecords((progressData as TeacherStandardProgress[]) ?? []);

        if (progressData?.length) {
          await refreshEvidenceUrls(progressData as TeacherStandardProgress[]);
        } else {
          setEvidenceUrls({});
        }
      } catch (error: any) {
        console.error("Failed to load teacher standards:", error);
        toast({
          title: "Unable to load teacher standards",
          description: error.message ?? "Please try again in a moment.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [teacherId, toast]);

  const refreshEvidenceUrls = async (records: TeacherStandardProgress[]) => {
    const entries = await Promise.all(
      records
        .filter((record) => Boolean(record.evidence_storage_path))
        .map(async (record) => {
          const { data, error } = await supabase.storage
            .from("teacher-standards")
            .createSignedUrl(record.evidence_storage_path as string, SIGNED_URL_TTL_SECONDS);

          if (error) {
            console.error("Unable to generate signed URL for evidence", error);
            return [record.standard_id, null] as const;
          }

          return [record.standard_id, data?.signedUrl ?? null] as const;
        }),
    );

    setEvidenceUrls(Object.fromEntries(entries));
  };

  const refreshProgress = async () => {
    const { data, error } = await supabase
      .from("teacher_standard_progress")
      .select("*")
      .eq("teacher_id", teacherId);

    if (error) {
      console.error("Failed to refresh teacher standard progress", error);
      toast({
        title: "Unable to refresh progress",
        description: "We saved your update but failed to refresh locally. Please reload.",
        variant: "destructive",
      });
      return;
    }

    const records = (data as TeacherStandardProgress[]) ?? [];
    setProgressRecords(records);
    await refreshEvidenceUrls(records);
  };

  const handleUpload = async (standard: TeacherStandard, file: File | undefined | null) => {
    if (!file) {
      return;
    }

    if (file.size > EVIDENCE_MAX_SIZE) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 25MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingStandardId(standard.id);
    try {
      const fileExt = file.name.split(".").pop();
      const sanitizedName = file.name.replace(/\s+/g, "-");
      const filePath = `${teacherId}/${standard.focus_area_number}/${Date.now()}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("teacher-standards")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: signed, error: signedError } = await supabase.storage
        .from("teacher-standards")
        .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

      if (signedError) {
        throw signedError;
      }

      const existing = progressByStandard.get(standard.id);
      const now = new Date().toISOString();

      const payload: Partial<TeacherStandardProgress> & {
        teacher_id: string;
        standard_id: string;
      } = {
        id: existing?.id,
        teacher_id: teacherId,
        standard_id: standard.id,
        status: "submitted",
        submitted_at: existing?.submitted_at ?? now,
        evidence_name: file.name,
        evidence_type: file.type || fileExt || null,
        evidence_size: file.size,
        evidence_url: signed?.signedUrl ?? null,
        evidence_storage_path: filePath,
        evidence_uploaded_at: now,
        approved_at: null,
        approved_by: null,
      };

      const { error: upsertError } = await supabase
        .from("teacher_standard_progress")
        .upsert(payload, { onConflict: "teacher_id,standard_id" } as any);

      if (upsertError) {
        throw upsertError;
      }

      toast({
        title: "Evidence uploaded",
        description: `${file.name} is now available for review.`,
      });

      await refreshProgress();
    } catch (error: any) {
      console.error("Evidence upload failed:", error);
      toast({
        title: "Upload failed",
        description: error.message ?? "Please try another file or try again shortly.",
        variant: "destructive",
      });
    } finally {
      setUploadingStandardId(null);
    }
  };

  const handleApprovalChange = async (standard: TeacherStandard, approved: boolean) => {
    setProcessingApprovalId(standard.id);
    try {
      const existing = progressByStandard.get(standard.id);
      const now = new Date().toISOString();
      const nextStatus: TeacherStandardProgress["status"] = approved
        ? "approved"
        : existing?.evidence_storage_path
          ? "submitted"
          : "in_progress";

      const payload: Partial<TeacherStandardProgress> & {
        teacher_id: string;
        standard_id: string;
      } = {
        id: existing?.id,
        teacher_id: teacherId,
        standard_id: standard.id,
        status: nextStatus,
        approved_at: approved ? now : null,
        approved_by: approved ? existing?.approved_by ?? null : null,
        submitted_at: existing?.submitted_at ?? (approved ? now : existing?.submitted_at ?? null),
        evidence_name: existing?.evidence_name ?? null,
        evidence_type: existing?.evidence_type ?? null,
        evidence_size: existing?.evidence_size ?? null,
        evidence_url: existing?.evidence_url ?? null,
        evidence_storage_path: existing?.evidence_storage_path ?? null,
        evidence_uploaded_at: existing?.evidence_uploaded_at ?? null,
        notes: existing?.notes ?? null,
      };

      const { error } = await supabase
        .from("teacher_standard_progress")
        .upsert(payload, { onConflict: "teacher_id,standard_id" } as any);

      if (error) {
        throw error;
      }

      toast({
        title: approved ? "Standard approved" : "Approval revoked",
        description: approved
          ? `${standard.focus_area_number} has been marked as complete.`
          : `${standard.focus_area_number} is now awaiting further evidence.`,
      });

      await refreshProgress();
    } catch (error: any) {
      console.error("Failed to update approval status:", error);
      toast({
        title: "Unable to update status",
        description: error.message ?? "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setProcessingApprovalId(null);
    }
  };

  const openDescriptorDialog = (standard: TeacherStandard) => {
    setDescriptorDialog({ open: true, standard });
  };

  const closeDescriptorDialog = () => {
    setDescriptorDialog({ open: false, standard: null });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Professional Standards</CardTitle>
          <CardDescription>Loading standard progress...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing the latest updates
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Professional Standards Progress</CardTitle>
          <CardDescription>
            {mode === "admin"
              ? `Track ${teacherName ?? "this teacher"}'s progression across each professional domain.`
              : "Monitor your advancement and approved standards across each professional domain."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {domainSummaries.map(({ domain, stats, approvedPercentage }) => (
            <div key={domain} className="rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{domain}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.approved} of {stats.total} standards approved
                    {stats.submitted ? ` · ${stats.submitted} awaiting review` : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {formatPercentage(approvedPercentage)}
                </span>
              </div>
              <Progress value={approvedPercentage} className="mt-3 h-2" />
            </div>
          ))}
          {!domainSummaries.length ? (
            <p className="text-sm text-muted-foreground">
              Standards metadata is not available yet. Ensure the latest migrations have been applied.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Standards Evidence Tracker</CardTitle>
          <CardDescription>
            Review descriptors, upload evidence, and manage approval status for each focus area.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Focus Area</TableHead>
                  <TableHead>Descriptors</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead className="w-[140px]">Evidence</TableHead>
                  {mode === "teacher" ? <TableHead className="w-[120px] text-right">Upload</TableHead> : null}
                  {mode === "admin" ? <TableHead className="w-[140px] text-right">Approval</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {standards.map((standard) => {
                  const progress = progressByStandard.get(standard.id);
                  const statusData = progress ? statusConfig[progress.status] : statusConfig.not_started;
                  const StatusIcon = statusData.icon;

                  const evidenceUrl = progress?.evidence_storage_path
                    ? evidenceUrls[standard.id] ?? progress.evidence_url
                    : null;

                  return (
                    <TableRow key={standard.id} className="align-top">
                      <TableCell>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold">
                              {standard.focus_area_number} · {standard.focus_area_name}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {standard.standard_number}. {standard.standard_name}
                            </p>
                          </div>
                          <Badge variant="secondary" className="w-fit">
                            {standard.domain}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDescriptorDialog(standard)}
                          >
                            <Info className="mr-2 h-4 w-4" />
                            View descriptors
                          </Button>
                          {progress?.approved_at ? (
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                    Approved {new Date(progress.approved_at).toLocaleDateString()}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Approved on{" "}
                                    {new Date(progress.approved_at).toLocaleString()}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusData.variant}
                          className={cn("flex items-center gap-1 capitalize", statusData.className)}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusData.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {progress?.evidence_storage_path && evidenceUrl ? (
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="justify-start"
                            >
                              <a href={evidenceUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View evidence
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start text-muted-foreground hover:text-foreground"
                              asChild
                            >
                              <a href={evidenceUrl} download>
                                <Download className="mr-2 h-4 w-4" />
                                Download file
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No evidence uploaded yet.
                          </p>
                        )}
                      </TableCell>
                      {mode === "teacher" ? (
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <label htmlFor={`upload-${standard.id}`}>
                              <input
                                id={`upload-${standard.id}`}
                                type="file"
                                accept={evidenceAccept}
                                className="sr-only"
                                onChange={(event) => {
                                  void handleUpload(
                                    standard,
                                    event.target.files?.[0] ?? null,
                                  );
                                  event.target.value = "";
                                }}
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={uploadingStandardId === standard.id}
                              >
                                {uploadingStandardId === standard.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload
                                  </>
                                )}
                              </Button>
                            </label>
                          </div>
                          {progress?.evidence_name ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Latest: {progress.evidence_name}
                            </p>
                          ) : null}
                        </TableCell>
                      ) : null}
                      {mode === "admin" ? (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Checkbox
                              id={`approve-${standard.id}`}
                              checked={progress?.status === "approved"}
                              disabled={processingApprovalId === standard.id}
                              onCheckedChange={(checked) =>
                                handleApprovalChange(standard, Boolean(checked))
                              }
                            />
                            <label
                              htmlFor={`approve-${standard.id}`}
                              className="text-sm text-muted-foreground"
                            >
                              Mark complete
                            </label>
                          </div>
                          {progress?.submitted_at ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Submitted {new Date(progress.submitted_at).toLocaleDateString()}
                            </p>
                          ) : null}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={descriptorDialog.open} onOpenChange={(open) => !open && closeDescriptorDialog()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {descriptorDialog.standard
                ? `${descriptorDialog.standard.focus_area_number} · ${descriptorDialog.standard.focus_area_name}`
                : "Descriptors"}
            </DialogTitle>
            <DialogDescription>
              {descriptorDialog.standard?.standard_number}.{" "}
              {descriptorDialog.standard?.standard_name}
            </DialogDescription>
          </DialogHeader>
          {descriptorDialog.standard ? (
            <div className="space-y-4">
              <DescriptorSection
                title="Graduate"
                description={descriptorDialog.standard.graduate_descriptor}
              />
              <DescriptorSection
                title="Proficient"
                description={descriptorDialog.standard.proficient_descriptor}
              />
              <DescriptorSection
                title="Highly Accomplished"
                description={descriptorDialog.standard.highly_accomplished_descriptor}
              />
              <DescriptorSection
                title="Lead"
                description={descriptorDialog.standard.lead_descriptor}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={closeDescriptorDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface DescriptorSectionProps {
  title: string;
  description: string;
}

const DescriptorSection = ({ title, description }: DescriptorSectionProps) => (
  <div className="rounded-lg border bg-muted/30 p-4">
    <h4 className="text-sm font-semibold">{title}</h4>
    <p className="mt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
      {description}
    </p>
  </div>
);

export default TeacherStandardsBoard;
