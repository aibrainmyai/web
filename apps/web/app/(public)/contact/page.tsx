import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { DraftBanner, PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Contact" };

// TODO(owner): supply the support email address; a contact form needs a support function (later phase).
export default function ContactPage() {
  return (
    <PageShell title="Contact" intro="Questions, feedback or partnership ideas: we would like to hear from you.">
      <DraftBanner>Contact details will be added before launch.</DraftBanner>
      <Card>
        <h2 className="mb-2 text-lg font-bold">Already a user?</h2>
        <p className="text-sm text-text-muted">
          Sign in and use the report button on any reply to flag a problem with an answer.
        </p>
      </Card>
    </PageShell>
  );
}
