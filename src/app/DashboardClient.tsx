"use client";

import { Button } from "@/components/ui/button";
import { logoutAction } from "./actions";
import {
  VersionCard,
  ClientHealthCard,
  UserMetricsCard,
  UsageCard,
  SecurityEventsCard,
  RealtimeHealthCard,
} from "@/components/dashboard";
import type { DashboardData } from "@/lib/queries";
import { LogOut, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DashboardClientProps {
  data: DashboardData;
  userEmail: string;
}

export function DashboardClient({ data, userEmail }: DashboardClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const effectiveVersion = data.version.override || data.version.version;

  async function handleRefresh() {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">hiMasjid Monitoring</h1>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <form action={logoutAction}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Row 1: Version + Client Health */}
          <VersionCard
            version={data.version.version}
            override={data.version.override}
            updatedAt={data.version.updatedAt}
          />
          <ClientHealthCard
            stats={data.clientStats}
            currentVersion={effectiveVersion}
          />

          <UserMetricsCard metrics={data.userMetrics} />
          <UsageCard stats={data.usageStats} />
        </div>

        {/* Row 3: Realtime Health + Security Events (side by side on desktop) */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RealtimeHealthCard metrics={data.realtimeMetrics} />
          <SecurityEventsCard events={data.securityEvents} />
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            Last updated: {new Date().toLocaleString()} • Data refreshes on page
            reload
          </p>
        </footer>
      </main>
    </div>
  );
}
