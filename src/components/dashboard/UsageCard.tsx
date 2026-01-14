import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Image, Film, ListMusic, HardDrive } from "lucide-react";
import type { UsageStats } from "@/lib/queries";

interface UsageCardProps {
  stats: UsageStats;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function UsageCard({ stats }: UsageCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Usage (All Users)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Slides */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950 rounded flex items-center justify-center">
              <Film className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">
                {stats.totalSlides.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Slides</p>
            </div>
          </div>

          {/* Playlists */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-950 rounded flex items-center justify-center">
              <ListMusic className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">
                {stats.totalPlaylists.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Playlists</p>
            </div>
          </div>

          {/* Images */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-950 rounded flex items-center justify-center">
              <Image className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">
                {stats.totalImages.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Images</p>
            </div>
          </div>

          {/* Storage */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-950 rounded flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">
                {formatBytes(stats.totalStorageBytes)}
              </p>
              <p className="text-xs text-muted-foreground">Storage</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
