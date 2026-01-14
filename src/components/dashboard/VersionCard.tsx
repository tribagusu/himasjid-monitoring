"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Package, Radio, Settings } from "lucide-react";
import { setAppVersionAction, broadcastVersionAction } from "@/app/actions";
import { toast } from "sonner";

interface VersionCardProps {
  version: string;
  override: string | null;
  updatedAt: string | null;
}

export function VersionCard({
  version,
  override,
  updatedAt,
}: VersionCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [newVersion, setNewVersion] = useState(version);
  const [newOverride, setNewOverride] = useState(override || "");
  const [shouldBroadcast, setShouldBroadcast] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveVersion = override || version;

  async function handleSetVersion() {
    setIsSubmitting(true);
    const result = await setAppVersionAction(
      newVersion,
      newOverride || null,
      shouldBroadcast
    );

    if (result.success) {
      toast.success(
        "Version updated" + (shouldBroadcast ? " and broadcast" : "")
      );
      setIsDialogOpen(false);
    } else {
      toast.error(result.error || "Failed to update version");
    }
    setIsSubmitting(false);
  }

  async function handleBroadcast() {
    setIsBroadcasting(true);
    const result = await broadcastVersionAction(effectiveVersion);

    if (result.success) {
      toast.success("Version broadcast sent");
    } else {
      toast.error(result.error || "Broadcast failed");
    }
    setIsBroadcasting(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          <Package className="w-4 h-4 inline mr-2" />
          Version
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-2xl font-bold">v{effectiveVersion}</p>
          {override && (
            <p className="text-xs text-muted-foreground">
              Base: v{version} • Override: v{override}
            </p>
          )}
          {updatedAt && (
            <p className="text-xs text-muted-foreground">
              Updated: {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                Set Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update App Version</DialogTitle>
                <DialogDescription>
                  Change the base version or set an override.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Base Version</Label>
                  <Input
                    id="version"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="1.0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="override">Override (optional)</Label>
                  <Input
                    id="override"
                    value={newOverride}
                    onChange={(e) => setNewOverride(e.target.value)}
                    placeholder="Leave empty to remove override"
                  />
                  <p className="text-xs text-muted-foreground">
                    Override forces clients to use this version without deploy
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="broadcast">Broadcast immediately</Label>
                  <Switch
                    id="broadcast"
                    checked={shouldBroadcast}
                    onCheckedChange={setShouldBroadcast}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSetVersion} disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Version"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="default"
            size="sm"
            onClick={handleBroadcast}
            disabled={isBroadcasting}
          >
            <Radio className="w-4 h-4 mr-1" />
            {isBroadcasting ? "Broadcasting..." : "Broadcast"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
