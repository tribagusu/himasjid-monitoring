import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Tv, CheckCircle, AlertTriangle } from "lucide-react";
import type { ClientVersionStats } from "@/lib/queries";

interface ClientHealthCardProps {
  stats: ClientVersionStats[];
  currentVersion: string;
}

export function ClientHealthCard({
  stats,
  currentVersion,
}: ClientHealthCardProps) {
  // Separate admin and display counts
  const adminStats = stats.filter((s) => s.clientType === "admin");
  const displayStats = stats.filter((s) => s.clientType === "display");

  const totalAdmin = adminStats.reduce((sum, s) => sum + s.count, 0);
  const totalDisplay = displayStats.reduce((sum, s) => sum + s.count, 0);

  // Count up-to-date clients
  const adminUpToDate = adminStats
    .filter((s) => s.version === currentVersion)
    .reduce((sum, s) => sum + s.count, 0);
  const displayUpToDate = displayStats
    .filter((s) => s.version === currentVersion)
    .reduce((sum, s) => sum + s.count, 0);

  const adminPercent =
    totalAdmin > 0 ? Math.round((adminUpToDate / totalAdmin) * 100) : 100;
  const displayPercent =
    totalDisplay > 0 ? Math.round((displayUpToDate / totalDisplay) * 100) : 100;

  const adminOutdated = totalAdmin - adminUpToDate;
  const displayOutdated = totalDisplay - displayUpToDate;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          <Monitor className="w-4 h-4 inline mr-2" />
          Client Health (24h)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Admin Clients */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{totalAdmin}</span>
            {adminPercent === 100 ? (
              <span className="flex items-center text-green-600 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                100%
              </span>
            ) : (
              <span className="flex items-center text-amber-600 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {adminPercent}% ({adminOutdated} stale)
              </span>
            )}
          </div>
        </div>

        {/* TV Displays */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">TV Display</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{totalDisplay}</span>
            {displayPercent === 100 ? (
              <span className="flex items-center text-green-600 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                100%
              </span>
            ) : (
              <span className="flex items-center text-amber-600 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {displayPercent}% ({displayOutdated} stale)
              </span>
            )}
          </div>
        </div>

        {/* Version breakdown */}
        {stats.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Version Distribution:
            </p>
            <div className="space-y-1">
              {Array.from(new Set(stats.map((s) => s.version)))
                .sort()
                .reverse()
                .slice(0, 3)
                .map((v) => {
                  const count = stats
                    .filter((s) => s.version === v)
                    .reduce((sum, s) => sum + s.count, 0);
                  const isCurrent = v === currentVersion;
                  return (
                    <div key={v} className="flex justify-between text-xs">
                      <span
                        className={
                          isCurrent ? "font-medium" : "text-muted-foreground"
                        }
                      >
                        v{v} {isCurrent && "✓"}
                      </span>
                      <span>{count} clients</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
