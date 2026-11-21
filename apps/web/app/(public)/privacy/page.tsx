import type { Metadata } from "next";
import { DraftBanner, PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Privacy notice" };

// Structure only, aligned with PDPA needs in PLAN sections 12 and 18. Final wording from a lawyer.
export default function PrivacyPage() {
  return (
    <PageShell title="Privacy notice">
      <DraftBanner>Draft: this notice is awaiting legal review and is not yet in force.</DraftBanner>
      <Section title="What we collect">Your account details, the messages and files you send, your settings, and usage counts such as how many chats you start each day.</Section>
      <Section title="Why">To run the service, keep your history across devices, apply plan limits, and keep MYai safe.</Section>
      <Section title="AI processing">Your messages and files are sent to our AI provider to generate replies. This provider is located outside Malaysia. We ask for your consent before your first chat.</Section>
      <Section title="Where it is stored">On Google Cloud in Singapore.</Section>
      <Section title="Memory">MYai only remembers facts about you if you turn memory on. You can see and delete them at any time.</Section>
      <Section title="Your rights">You can view, correct, export and delete your data. Deleting your account removes your conversations and files.</Section>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xl font-bold">{title}</h2>
      <p className="text-text-muted">{children}</p>
    </section>
  );
}
