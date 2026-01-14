import { cookies } from "next/headers";

// Environment variables for auth
const MONITORING_SECRET = process.env.MONITORING_SECRET || "";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export interface AuthSession {
  email: string;
  isAuthenticated: boolean;
}

const AUTH_COOKIE_NAME = "monitoring_session";

/**
 * Validate login credentials (dual auth: email + secret)
 */
export function validateCredentials(
  email: string,
  secret: string
): { valid: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email is in whitelist
  if (!ADMIN_EMAILS.includes(normalizedEmail)) {
    return { valid: false, error: "Email not authorized" };
  }

  // Check secret
  if (secret !== MONITORING_SECRET) {
    return { valid: false, error: "Invalid secret" };
  }

  return { valid: true };
}

/**
 * Create session token (simple base64 for this lightweight app)
 */
export function createSessionToken(email: string): string {
  const payload = {
    email: email.toLowerCase(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Verify session token
 */
export function verifySessionToken(token: string): {
  valid: boolean;
  email?: string;
} {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString());
    if (payload.exp < Date.now()) {
      return { valid: false };
    }
    if (!ADMIN_EMAILS.includes(payload.email)) {
      return { valid: false };
    }
    return { valid: true, email: payload.email };
  } catch {
    return { valid: false };
  }
}

/**
 * Get current session from cookies (server-side)
 */
export async function getSession(): Promise<AuthSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return { email: "", isAuthenticated: false };
  }

  const result = verifySessionToken(token);
  if (!result.valid) {
    return { email: "", isAuthenticated: false };
  }

  return { email: result.email!, isAuthenticated: true };
}

export { AUTH_COOKIE_NAME };
