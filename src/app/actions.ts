"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  validateCredentials,
  createSessionToken,
  AUTH_COOKIE_NAME,
} from "@/lib/auth";
import {
  setAppVersion as setVersion,
  broadcastVersionUpdate as broadcast,
} from "@/lib/queries";

export async function loginAction(
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get("email") as string;
  const secret = formData.get("secret") as string;

  const validation = validateCredentials(email, secret);

  if (!validation.valid) {
    return { error: validation.error };
  }

  const token = createSessionToken(email);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
    path: "/",
  });

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}

export async function setAppVersionAction(
  version: string,
  override: string | null,
  shouldBroadcast: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await setVersion(version, override);

    if (!success) {
      return { success: false, error: "Failed to update version" };
    }

    if (shouldBroadcast) {
      const effectiveVersion = override || version;
      await broadcast(effectiveVersion);
    }

    return { success: true };
  } catch (error) {
    console.error("setAppVersionAction error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function broadcastVersionAction(
  version: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await broadcast(version);
    return { success, error: success ? undefined : "Broadcast failed" };
  } catch (error) {
    console.error("broadcastVersionAction error:", error);
    return { success: false, error: "An error occurred" };
  }
}
