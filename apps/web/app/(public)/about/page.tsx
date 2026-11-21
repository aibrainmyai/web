import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PageShell title="About MYai" intro="An AI assistant built in Malaysia, for the way Malaysians talk, work and learn.">
      <p className="text-text-muted">
        Most assistants treat English as the default and everything else as an afterthought. MYai is built to work as
        well in Bahasa Melayu, Chinese and Tamil as it does in English, with templates and tools shaped around local
        needs.
      </p>
      <p className="text-text-muted">
        One account works on the web and on our Android and iOS apps, so your conversations, files and preferences go
        wherever you do.
      </p>
    </PageShell>
  );
}
