import { getSupabaseAdmin } from "./supabase";

// ============================================================================
// VERSION QUERIES
// ============================================================================

export interface VersionInfo {
  version: string;
  override: string | null;
  updatedAt: string | null;
}

export async function getAppVersion(): Promise<VersionInfo> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_config")
    .select("value, updated_at")
    .eq("key", "app_version")
    .single();

  if (error || !data) {
    return { version: "unknown", override: null, updatedAt: null };
  }

  return {
    version: data.value?.version || "unknown",
    override: data.value?.override || null,
    updatedAt: data.updated_at,
  };
}

export async function setAppVersion(
  version: string,
  override: string | null,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("app_config")
    .update({
      value: { version, override },
      updated_at: new Date().toISOString(),
    })
    .eq("key", "app_version");

  return !error;
}

export async function broadcastVersionUpdate(
  version: string,
): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const channel = supabase.channel("app:updates");

    await channel.send({
      type: "broadcast",
      event: "version_update",
      payload: {
        type: "version_update",
        version,
        timestamp: new Date().toISOString(),
      },
    });

    await supabase.removeChannel(channel);
    return true;
  } catch (error) {
    console.error("Broadcast failed:", error);
    return false;
  }
}

// ============================================================================
// CLIENT VERSION QUERIES
// ============================================================================

export interface ClientVersionStats {
  version: string;
  clientType: "admin" | "display";
  count: number;
}

interface ClientVersionRow {
  version: string;
  client_type: string;
}

export async function getClientVersionStats(): Promise<ClientVersionStats[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("client_versions")
    .select("version, client_type")
    .gte(
      "last_seen_at",
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    );

  if (error || !data) return [];

  // Count by version and client_type
  const counts = new Map<string, number>();
  (data as ClientVersionRow[]).forEach((row) => {
    const key = `${row.version}|${row.client_type}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([key, count]) => {
    const [version, clientType] = key.split("|");
    return {
      version,
      clientType: clientType as "admin" | "display",
      count,
    };
  });
}

// ============================================================================
// USER METRICS QUERIES
// ============================================================================

export interface UserMetrics {
  total: number;
  active24h: number;
  active7d: number;
  active30d: number;
  freeTier: number;
  premiumTier: number;
}

interface UserRow {
  id: string;
  tier: string;
  updated_at: string | null;
  is_active: boolean;
}

export async function getUserMetrics(): Promise<UserMetrics> {
  const now = new Date();
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const supabase = getSupabaseAdmin();
  const { data: users, error } = await supabase
    .from("masjids")
    .select("id, tier, updated_at, is_active");

  if (error || !users) {
    return {
      total: 0,
      active24h: 0,
      active7d: 0,
      active30d: 0,
      freeTier: 0,
      premiumTier: 0,
    };
  }

  const typedUsers = users as UserRow[];
  const total = typedUsers.length;
  const active24h = typedUsers.filter(
    (u) => u.updated_at && u.updated_at >= h24,
  ).length;
  const active7d = typedUsers.filter(
    (u) => u.updated_at && u.updated_at >= d7,
  ).length;
  const active30d = typedUsers.filter(
    (u) => u.updated_at && u.updated_at >= d30,
  ).length;
  const freeTier = typedUsers.filter((u) => u.tier === "free").length;
  const premiumTier = typedUsers.filter((u) => u.tier === "premium").length;

  return { total, active24h, active7d, active30d, freeTier, premiumTier };
}

// ============================================================================
// USAGE STATS QUERIES
// ============================================================================

export interface UsageStats {
  totalSlides: number;
  totalPlaylists: number;
  totalImages: number;
  totalStorageBytes: number;
}

interface StorageUsageRow {
  storage_usage: {
    image_count?: number;
    total_bytes?: number;
  } | null;
}

export async function getUsageStats(): Promise<UsageStats> {
  const supabase = getSupabaseAdmin();

  // Count slides
  const { count: slideCount } = await supabase
    .from("slides")
    .select("*", { count: "exact", head: true });

  // Count playlists
  const { count: playlistCount } = await supabase
    .from("playlists")
    .select("*", { count: "exact", head: true });

  // Count images directly from masjid-assets bucket
  let totalImages = 0;
  let totalStorageBytes = 0;

  try {
    // Get all masjid IDs from database to iterate their folders
    const { data: users } = await supabase.from("masjids").select("id");

    if (users) {
      // For each user, count files in their images subfolder
      for (const user of users) {
        const { data: imageFiles } = await supabase.storage
          .from("masjid-assets")
          .list(`${user.id}/images`, { limit: 1000 });

        if (imageFiles) {
          // Count only actual files (files have 'id', folders don't)
          const files = imageFiles.filter((f) => f.id !== null);
          totalImages += files.length;
          totalStorageBytes += files.reduce(
            (sum, f) => sum + (f.metadata?.size || 0),
            0,
          );
        }
      }
    }
  } catch (error) {
    console.error("Failed to count images from storage:", error);
    // Fallback to masjid table aggregation
    const { data: users } = await supabase
      .from("masjids")
      .select("storage_usage");

    if (users) {
      (users as StorageUsageRow[]).forEach((u) => {
        if (u.storage_usage) {
          totalImages += u.storage_usage.image_count || 0;
          totalStorageBytes += u.storage_usage.total_bytes || 0;
        }
      });
    }
  }

  return {
    totalSlides: slideCount || 0,
    totalPlaylists: playlistCount || 0,
    totalImages,
    totalStorageBytes,
  };
}

// ============================================================================
// SECURITY EVENTS (if table exists)
// ============================================================================

export interface SecurityEvent {
  id: string;
  eventType: string;
  severity: string;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface SecurityEventRow {
  id: string;
  event_type: string;
  severity: string;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function getRecentSecurityEvents(
  limit = 10,
): Promise<SecurityEvent[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("security_events")
    .select("id, event_type, severity, ip_address, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // Table might not exist yet
    console.log("Security events table not found or error:", error.message);
    return [];
  }

  return ((data as SecurityEventRow[]) || []).map((e) => ({
    id: e.id,
    eventType: e.event_type,
    severity: e.severity,
    ipAddress: e.ip_address,
    metadata: e.metadata,
    createdAt: e.created_at,
  }));
}

// ============================================================================
// REALTIME METRICS QUERIES
// ============================================================================

export interface RealtimeConnection {
  id: string;
  masjidId: string;
  masjidName: string | null;
  clientType: "display" | "admin";
  channelName: string;
  connectedAt: string;
  lastHeartbeatAt: string;
  disconnectedAt: string | null;
}

export interface RealtimeMetrics {
  activeConnections: number;
  maxConnections: number; // 500 Supabase limit
  utilizationPercent: number;
  idleMasjids: number; // No activity for 30+ days
  connectedMasjids: number;
  disconnectedMasjids: number;
  recentConnections: RealtimeConnection[];
  alertLevel: "normal" | "warning" | "critical"; // based on utilization
}

interface RealtimeConnectionRow {
  id: string;
  masjid_id: string;
  client_type: string;
  channel_name: string;
  connected_at: string;
  last_heartbeat_at: string;
  disconnected_at: string | null;
  masjids: { masjid_name: string | null } | null;
}

interface MasjidStatusRow {
  realtime_status: string | null;
}

export async function getRealtimeMetrics(): Promise<RealtimeMetrics> {
  const MAX_CONNECTIONS = 500;
  const supabase = getSupabaseAdmin();

  // Get masjid counts by realtime_status
  const { data: masjids } = await supabase
    .from("masjids")
    .select("realtime_status");

  const typedMasjids = (masjids as MasjidStatusRow[]) || [];
  const connectedMasjids = typedMasjids.filter(
    (m) => m.realtime_status === "connected",
  ).length;
  const idleMasjids = typedMasjids.filter(
    (m) => m.realtime_status === "idle",
  ).length;
  const disconnectedMasjids = typedMasjids.filter(
    (m) => m.realtime_status === "disconnected" || m.realtime_status === null,
  ).length;

  // Get active connections (not disconnected) from realtime_connections table
  const { count: activeCount } = await supabase
    .from("realtime_connections")
    .select("*", { count: "exact", head: true })
    .is("disconnected_at", null);

  const activeConnectionCount = activeCount || 0;
  const utilizationPercent = Math.round(
    (activeConnectionCount / MAX_CONNECTIONS) * 100,
  );

  // Determine alert level
  let alertLevel: "normal" | "warning" | "critical" = "normal";
  if (utilizationPercent >= 90) {
    alertLevel = "critical";
  } else if (utilizationPercent >= 80) {
    alertLevel = "warning";
  }

  // Get recent connections (last 10)
  const { data: recentData } = await supabase
    .from("realtime_connections")
    .select(
      `
      id,
      masjid_id,
      client_type,
      channel_name,
      connected_at,
      last_heartbeat_at,
      disconnected_at,
      masjids (masjid_name)
    `,
    )
    .order("connected_at", { ascending: false })
    .limit(10);

  const recentConnections: RealtimeConnection[] = (
    (recentData as unknown as RealtimeConnectionRow[]) || []
  ).map((r) => ({
    id: r.id,
    masjidId: r.masjid_id,
    masjidName: r.masjids?.masjid_name || null,
    clientType: r.client_type as "display" | "admin",
    channelName: r.channel_name,
    connectedAt: r.connected_at,
    lastHeartbeatAt: r.last_heartbeat_at,
    disconnectedAt: r.disconnected_at,
  }));

  return {
    activeConnections: activeConnectionCount,
    maxConnections: MAX_CONNECTIONS,
    utilizationPercent,
    idleMasjids,
    connectedMasjids,
    disconnectedMasjids,
    recentConnections,
    alertLevel,
  };
}

// Trigger idle detection manually (calls the detect_idle_masjids function)
export async function detectIdleMasjids(
  idleDays: number = 30,
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("detect_idle_masjids", {
    p_idle_days: idleDays,
  });

  if (error) {
    console.error("Failed to detect idle masjids:", error);
    return 0;
  }

  return data || 0;
}

// ============================================================================
// DASHBOARD DATA (combined)
// ============================================================================

export interface DashboardData {
  version: VersionInfo;
  clientStats: ClientVersionStats[];
  userMetrics: UserMetrics;
  usageStats: UsageStats;
  securityEvents: SecurityEvent[];
  realtimeMetrics: RealtimeMetrics;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [
    version,
    clientStats,
    userMetrics,
    usageStats,
    securityEvents,
    realtimeMetrics,
  ] = await Promise.all([
    getAppVersion(),
    getClientVersionStats(),
    getUserMetrics(),
    getUsageStats(),
    getRecentSecurityEvents(),
    getRealtimeMetrics(),
  ]);

  return {
    version,
    clientStats,
    userMetrics,
    usageStats,
    securityEvents,
    realtimeMetrics,
  };
}
