import { ButtonLink, Card } from "@/components/ui";

// The four quick actions shown on the poster's phone screen (PLAN section 2).
const quickActions = [
  { title: "Write something", body: "Emails, essays, captions and reports in your language.", mode: "Write" },
  { title: "Solve a problem", body: "Work through maths, code, plans and everyday questions.", mode: "Work" },
  { title: "Create", body: "Ideas, outlines and drafts from a single prompt.", mode: "Templates" },
  { title: "Learn", body: "Clear explanations at the level you choose.", mode: "Learn" },
];

const pillars = [
  { title: "Four languages", body: "English, Bahasa Melayu, 中文 and தமிழ், in the same chat." },
  { title: "One account everywhere", body: "Start on the web, continue on your phone. Same history, same settings." },
  { title: "Your files, understood", body: "Upload a PDF or image and ask about it." },
  { title: "Private by design", body: "Your chats are yours. You choose what MYai remembers, and can delete it." },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="inline-block rounded-full border border-border px-3 py-1 text-xs font-semibold text-highlight">
              Proudly Malaysian
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Your everyday <span className="text-brand-gradient">AI</span> assistant
            </h1>
            <p className="max-w-xl text-lg text-text-muted">
              Write, solve, create and learn with MYai, in the language you think in.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/register" className="px-6 py-3 text-base">
                Start free
              </ButtonLink>
              <ButtonLink href="/features" variant="outline" className="px-6 py-3 text-base">
                See features
              </ButtonLink>
            </div>
          </div>

          {/* Placeholder visual until the mascot artwork is supplied (decision 2). */}
          <div className="relative mx-auto aspect-square w-full max-w-sm" aria-hidden>
            <div className="absolute inset-0 rounded-full border border-border/70" />
            <div className="absolute inset-10 rounded-full border border-border/50" />
            <div className="absolute inset-24 rounded-full bg-brand-gradient opacity-80 blur-2xl" />
            <div className="absolute inset-28 grid place-items-center rounded-full bg-surface-raised glow">
              <span className="text-4xl font-extrabold text-brand-gradient">MY</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-bold">What do you want to do today?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a) => (
            <Card key={a.title} className="glow transition hover:-translate-y-0.5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary-soft">{a.mode}</p>
              <h3 className="mb-2 text-lg font-bold">{a.title}</h3>
              <p className="text-sm text-text-muted">{a.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-2">
          {pillars.map((p) => (
            <div key={p.title}>
              <h3 className="mb-2 text-xl font-bold">{p.title}</h3>
              <p className="text-text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="mb-4 text-3xl font-extrabold">Ready when you are</h2>
        <p className="mb-8 text-text-muted">Free to start. No card needed.</p>
        <ButtonLink href="/register" className="px-8 py-3 text-base">
          Create your account
        </ButtonLink>
      </section>
    </>
  );
}
