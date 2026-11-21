import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { ButtonLink } from "@/components/ui";

const nav = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Wordmark />
          <nav className="hidden items-center gap-6 text-sm text-text-muted md:flex" aria-label="Main">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-text">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost">
              Sign in
            </ButtonLink>
            <ButtonLink href="/register">Get started</ButtonLink>
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto px-4 pb-3 text-sm text-text-muted md:hidden" aria-label="Main mobile">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="shrink-0 hover:text-text">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} MYai · <span className="text-highlight">Proudly Malaysian</span>
          </p>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-text">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-text">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-text">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
