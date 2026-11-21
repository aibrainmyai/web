import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-brand-gradient text-white hover:brightness-110 disabled:opacity-50",
  outline: "border border-border text-text hover:bg-surface-raised disabled:opacity-50",
  ghost: "text-text-muted hover:text-text hover:bg-surface-raised disabled:opacity-50",
  danger: "border border-danger/60 text-danger hover:bg-danger/10 disabled:opacity-50",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Field({
  label,
  error,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = props.id ?? props.name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted/70 focus:border-primary focus:outline-none"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-lg border border-border bg-surface/80 p-6 ${className}`}>{children}</div>;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const tones = {
    info: "border-primary/40 bg-primary/10 text-text",
    error: "border-danger/50 bg-danger/10 text-danger",
    success: "border-success/50 bg-success/10 text-success",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-8 text-text-muted" role="status">
      <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}
