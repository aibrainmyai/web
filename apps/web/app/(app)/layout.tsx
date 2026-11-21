import { AuthProvider } from "@/lib/auth";
import { RequireAuth } from "@/components/app/RequireAuth";
import { Sidebar } from "@/components/app/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RequireAuth>
        <div className="flex h-dvh flex-col md:flex-row">
          <Sidebar />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
        </div>
      </RequireAuth>
    </AuthProvider>
  );
}
