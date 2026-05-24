import AppShell from "@/components/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { ProfileClient } from "@/components/ProfileClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const serialized = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLogin?.toISOString() ?? null,
  };

  return (
    <AppShell>
      <ProfileClient user={serialized} />
    </AppShell>
  );
}
