import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-success/15 text-success border-success/30",
    lifetime: "bg-primary/15 text-primary border-primary/30",
    expired: "bg-destructive/15 text-destructive border-destructive/30",
    suspended: "bg-warning/20 text-warning border-warning/40",
    paid: "bg-success/15 text-success border-success/30",
    pending: "bg-warning/20 text-warning border-warning/40",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    refunded: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", map[status] ?? "")}>
      {titleCase(status)}
    </Badge>
  );
}