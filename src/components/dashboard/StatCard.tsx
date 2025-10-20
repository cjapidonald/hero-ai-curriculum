import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus, LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  loading?: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, description, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 animate-pulse rounded bg-muted mb-2" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value === 0) return <Minus className="h-3 w-3" />;
    return trend.isPositive ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value === 0) return "text-muted-foreground";
    return trend.isPositive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" aria-label={`${title}: ${value}`}>
          {value}
        </div>
        {(trend || description) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            {trend && (
              <span className={`flex items-center gap-1 font-medium ${getTrendColor()}`}>
                {getTrendIcon()}
                {Math.abs(trend.value)}%
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
