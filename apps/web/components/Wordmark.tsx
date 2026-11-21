import Link from "next/link";

/** Text wordmark until the logo SVG is supplied (decision 2). */
export function Wordmark({ href = "/", size = "md" }: { href?: string; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "text-5xl sm:text-6xl" : "text-2xl";
  return (
    <Link href={href} className={`font-extrabold tracking-tight ${cls}`} aria-label="MYai home">
      <span className="text-brand-gradient">MYai</span>
    </Link>
  );
}
