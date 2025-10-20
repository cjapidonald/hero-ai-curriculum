import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface HelpTooltipProps {
  title?: string;
  content: string | React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

/**
 * Help tooltip component for providing contextual help
 */
export function HelpTooltip({ title, content, side = "top", align = "center" }: HelpTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 rounded-full hover:bg-muted"
          aria-label="Show help information"
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-80">
        {title && (
          <div className="font-semibold mb-2 flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            {title}
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          {content}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Inline help text component
 */
export function HelpText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
      <HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </p>
  );
}
