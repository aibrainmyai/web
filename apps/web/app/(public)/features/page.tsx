import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Features" };

// Modes are prompt-driven on the one chat engine (decision 10).
const features = [
  { title: "Chat", body: "Ask anything and get answers as they are written. Stop or regenerate any reply." },
  { title: "Write", body: "Thirteen writing types, from formal letters to social captions." },
  { title: "Learn", body: "Lessons and explanations that adapt to your level." },
  { title: "Work", body: "Tools for summaries, plans, tables and everyday office tasks." },
  { title: "Templates", body: "Starter prompts so you never face a blank page." },
  { title: "Files", body: "Upload PDFs, text files and images, then ask questions about them." },
  { title: "History everywhere", body: "Your conversations follow you between the web and the mobile app." },
  { title: "Memory you control", body: "Let MYai remember useful facts, see what it keeps, and delete any of it." },
];

export default function FeaturesPage() {
  return (
    <PageShell title="Features" intro="One assistant, one account, on the web and on your phone.">
      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <Card key={f.title}>
            <h2 className="mb-2 text-lg font-bold">{f.title}</h2>
            <p className="text-sm text-text-muted">{f.body}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
