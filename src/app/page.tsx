import { getDashboardData } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect("/login");
  }

  const data = await getDashboardData();

  return <DashboardClient data={data} userEmail={session.email} />;
}
