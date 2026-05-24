import { AppShellClient } from "./AppShellClient";
import { getUserFromToken, type TokenPayload } from "@/lib/auth";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user: TokenPayload | null = await getUserFromToken();

  return <AppShellClient user={user}>{children}</AppShellClient>;
}
