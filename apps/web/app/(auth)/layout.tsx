import { AuthProvider } from "@/lib/auth";
import { Wordmark } from "@/components/Wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
        <div className="mb-8">
          <Wordmark size="lg" />
        </div>
        <div className="w-full max-w-md rounded-xl border border-border bg-surface/90 p-6 glow sm:p-8">{children}</div>
      </div>
    </AuthProvider>
  );
}
