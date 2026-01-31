"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Radio,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import type { RealtimeMetrics } from "@/lib/queries";
import { useState, useTransition } from "react";
import { detectIdleMasjidsAction } from "@/app/actions";

interface RealtimeHealthCardProps {
  metrics: RealtimeMetrics;
}

export function RealtimeHealthCard({ metrics }: RealtimeHealthCardProps) {
  const [isPending, startTransition] = useTransition();
  const [idleDetectedCount, setIdleDetectedCount] = useState<number | null>(
    null,
  );

  const getAlertColor = () => {
    switch (metrics.alertLevel) {
      case "critical":
        return "text-red-600";
      case "warning":
        return "text-amber-600";
      default:
        return "text-green-600";
    }
  };

  const getAlertBg = () => {
    switch (metrics.alertLevel) {
      case "critical":
        return "bg-red-100 dark:bg-red-900/20";
      case "warning":
        return "bg-amber-100 dark:bg-amber-900/20";
      default:
        return "bg-green-100 dark:bg-green-900/20";
    }
  };

  const getAlertIcon = () => {
    switch (metrics.alertLevel) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const handleDetectIdle = () => {
    startTransition(async () => {
      const count = await detectIdleMasjidsAction();
      setIdleDetectedCount(count);
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4" />
            Realtime Connections
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDetectIdle}
            disabled={isPending}
          >
            <RefreshCw
              className={`w-3 h-3 mr-1 ${isPending ? "animate-spin" : ""}`}
            />
            Detect Idle
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Utilization Gauge */}
        <div className={`rounded-lg p-3 ${getAlertBg()}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Channel Utilization</span>
            <span
              className={`flex items-center gap-1 text-sm ${getAlertColor()}`}
            >
              {getAlertIcon()}
              {metrics.utilizationPercent}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                metrics.alertLevel === "critical"
                  ? "bg-red-600"
                  : metrics.alertLevel === "warning"
                    ? "bg-amber-500"
                    : "bg-green-600"
              }`}
              style={{ width: `${Math.min(metrics.utilizationPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>
              {metrics.activeConnections} / {metrics.maxConnections}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> 80%
              <span className="w-2 h-2 rounded-full bg-red-600" /> 90%
            </span>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <Wifi className="w-3 h-3" />
              <span className="font-bold">{metrics.connectedMasjids}</span>
            </div>
            <span className="text-xs text-muted-foreground">Connected</span>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 text-amber-600">
              <AlertTriangle className="w-3 h-3" />
              <span className="font-bold">{metrics.idleMasjids}</span>
            </div>
            <span className="text-xs text-muted-foreground">Idle (30d+)</span>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 text-gray-500">
              <WifiOff className="w-3 h-3" />
              <span className="font-bold">{metrics.disconnectedMasjids}</span>
            </div>
            <span className="text-xs text-muted-foreground">Disconnected</span>
          </div>
        </div>

        {/* Idle Detection Result */}
        {idleDetectedCount !== null && (
          <div className="text-xs text-center text-muted-foreground border-t pt-2">
            {idleDetectedCount > 0
              ? `Marked ${idleDetectedCount} masjid(s) as idle`
              : "No new idle masjids found"}
          </div>
        )}

        {/* Recent Connections */}
        {metrics.recentConnections.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Recent Connections:
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {metrics.recentConnections.slice(0, 5).map((conn) => (
                <div
                  key={conn.id}
                  className="flex justify-between text-xs items-center"
                >
                  <span className="truncate max-w-[120px]">
                    {conn.masjidName || conn.channelName}
                  </span>
                  <span
                    className={`flex items-center gap-1 ${conn.disconnectedAt ? "text-gray-400" : "text-green-600"}`}
                  >
                    {conn.disconnectedAt ? (
                      <WifiOff className="w-3 h-3" />
                    ) : (
                      <Wifi className="w-3 h-3" />
                    )}
                    {conn.clientType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
