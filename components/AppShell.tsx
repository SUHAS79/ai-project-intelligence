import Sidebar from "./Sidebar";
import { getUserFromToken, type TokenPayload } from "@/lib/auth";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user: TokenPayload | null = await getUserFromToken();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar user={user} />
      <main className="flex-1 ml-[232px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
