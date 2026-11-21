import type { Metadata } from "next";
import { ButtonLink, Card } from "@/components/ui";
import { DraftBanner, PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Pricing" };

// Free limits are the placeholders from the Free vs Pro table (PLAN section 2).
// Pro limits and price wait on section 13 and decision 9, so they are not shown yet.
const freeLimits = [
  ["Chats", "20 a day"],
  ["Writing drafts", "8 a day"],
  ["Lessons", "6 a day"],
  ["Work runs", "6 a day"],
];

export default function PricingPage() {
  return (
    <PageShell title="Pricing" intro="Start free. Upgrade when you need more.">
      <DraftBanner>Plans and limits are provisional and may change before launch.</DraftBanner>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col">
          <h2 className="text-2xl font-bold">Free</h2>
          <p className="mb-6 mt-1 text-text-muted">For everyday questions.</p>
          <ul className="mb-8 space-y-2 text-sm">
            {freeLimits.map(([k, v]) => (
              <li key={k} className="flex justify-between border-b border-border/50 pb-2">
                <span>{k}</span>
                <span className="text-text-muted">{v}</span>
              </li>
            ))}
          </ul>
          <ButtonLink href="/register" className="mt-auto">
            Start free
          </ButtonLink>
        </Card>
        <Card className="glow flex flex-col">
          <h2 className="text-2xl font-bold">
            <span className="text-brand-gradient">Pro</span>
          </h2>
          <p className="mb-6 mt-1 text-text-muted">Higher limits and a best-quality model option.</p>
          <p className="mb-8 text-sm text-text-muted">Pricing will be announced at launch.</p>
          <ButtonLink href="/contact" variant="outline" className="mt-auto">
            Tell me when it launches
          </ButtonLink>
        </Card>
      </div>
    </PageShell>
  );
}
