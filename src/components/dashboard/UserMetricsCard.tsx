import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Crown, Gift } from "lucide-react";
import type { UserMetrics } from "@/lib/queries";

interface UserMetricsCardProps {
  metrics: UserMetrics;
}

export function UserMetricsCard({ metrics }: UserMetricsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          <Users className="w-4 h-4 inline mr-2" />
          Masjids
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Users */}
        <div>
          <p className="text-2xl font-bold">{metrics.total}</p>
          <p className="text-xs text-muted-foreground">Total registered</p>
        </div>

        {/* Activity breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">
              {metrics.active24h}
            </p>
            <p className="text-xs text-muted-foreground">24h</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-600">
              {metrics.active7d}
            </p>
            <p className="text-xs text-muted-foreground">7d</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-amber-600">
              {metrics.active30d}
            </p>
            <p className="text-xs text-muted-foreground">30d</p>
          </div>
        </div>

        {/* Tier breakdown */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Gift className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs">Free</span>
            </div>
            <span className="text-sm font-medium">{metrics.freeTier}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-500" />
              <span className="text-xs">Premium</span>
            </div>
            <span className="text-sm font-medium">{metrics.premiumTier}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
