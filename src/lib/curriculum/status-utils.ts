import type { BadgeProps } from "@/components/ui/badge";

export type BadgeVariant = NonNullable<BadgeProps["variant"]>;

interface StatusConfig {
  label: string;
  variant: BadgeVariant;
}

export const formatStageLabel = (stage?: string | null) => {
  if (!stage) return null;
  if (stage.toLowerCase().startsWith("stage_")) {
    const suffix = stage.split("_")[1];
    return `Stage ${suffix}`;
  }
  return stage;
};

export const getPlanStatusConfig = (
  lessonPlanCompleted: boolean | null,
  status: string,
): StatusConfig => {
  if (lessonPlanCompleted) {
    return { label: "Done", variant: "default" };
  }

  if (status === "building") {
    return { label: "In Progress", variant: "secondary" };
  }

  return { label: "Needs Plan", variant: "outline" };
};

export const getTeachingStatusConfig = (status: string): StatusConfig => {
  const configs: Record<string, StatusConfig> = {
    scheduled: { label: "Scheduled", variant: "secondary" },
    building: { label: "Planning", variant: "secondary" },
    ready: { label: "Ready", variant: "default" },
    in_progress: { label: "In Progress", variant: "default" },
    completed: { label: "Taught", variant: "outline" },
    cancelled: { label: "Cancelled", variant: "destructive" },
  };

  return configs[status] || { label: "Scheduled", variant: "secondary" };
};
