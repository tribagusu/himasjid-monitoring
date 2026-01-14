import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Info, AlertCircle } from "lucide-react";
import type { SecurityEvent } from "@/lib/queries";

interface SecurityEventsCardProps {
  events: SecurityEvent[];
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "critical":
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    case "warning":
      return <AlertTriangle className="w-3 h-3 text-amber-500" />;
    default:
      return <Info className="w-3 h-3 text-blue-500" />;
  }
}

function formatEventType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export function SecurityEventsCard({ events }: SecurityEventsCardProps) {
  const hasEvents = events.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          <Shield className="w-4 h-4 inline mr-2" />
          Security Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasEvents ? (
          <div className="text-center py-4 text-muted-foreground">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent security events</p>
            <p className="text-xs">Table may not be configured yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-2 text-sm border-b pb-2 last:border-b-0"
              >
                {getSeverityIcon(event.severity)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {formatEventType(event.eventType)}
                  </p>
                  {event.ipAddress && (
                    <p className="text-xs text-muted-foreground truncate">
                      IP: {event.ipAddress}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimeAgo(event.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
