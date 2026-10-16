import Link from "next/link";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import AbitsoDemo from "@/components/AbitsoDemo";
import { ArrowRight, FileText, MessageSquare, Sparkles } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Upload",
    description: "Add a PDF and let Abitso prepare it for you.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Chat",
    description: "Ask questions in plain language and get clear answers.",
    icon: MessageSquare,
  },
  {
    number: "03",
    title: "Discover",
    description: "Find key ideas and follow every answer back to its source.",
    icon: Sparkles,
  },
];

function AnalyzerPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[570px] rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <FileText className="h-5 w-5 shrink-0 text-teal-700" />
          <span className="truncate text-sm font-semibold text-slate-900">sample-report.pdf</span>
        </div>
        <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">Analyzed</span>
      </div>

      <div className="border-b border-slate-200 px-5 py-5">
        <div className="mb-2 h-2 w-2/5 rounded-full bg-slate-300" />
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-slate-200" />
          <div className="h-2 w-11/12 rounded-full bg-slate-200" />
          <div className="rounded-lg bg-teal-100 px-3 py-2">
            <div className="h-2 rounded-full bg-teal-300" />
            <div className="mt-2 h-2 w-3/5 rounded-full bg-teal-300" />
          </div>
          <div className="h-2 w-10/12 rounded-full bg-slate-200" />
          <div className="h-2 w-3/5 rounded-full bg-slate-200" />
        </div>
      </div>

      <div className="space-y-3 bg-[#F8FAFA] p-4 sm:p-5">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-[10px] bg-teal-700 px-4 py-3 text-sm font-medium text-white">
            Summarize the key findings
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
          Here are the main points from the highlighted section, with page references.
          <span className="mt-2 inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
            Source: page 2
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[10px] border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-500">
          <span>Ask anything about this document</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-teal-700" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="bg-[#F8FAFA] py-14 sm:py-20 lg:py-24">
        <MaxWidthWrapper>
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div className="max-w-[610px]">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700">
                <span className="h-2 w-2 rounded-full bg-[#0D9488]" />
                New: chat with any PDF using AI
              </div>
              <h1 className="text-[clamp(2.5rem,5vw,3.75rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-slate-900">
                Unlock the power of your{" "}
                <span className="whitespace-nowrap">
                  <span className="text-[#0F766E]">PDFs</span> with AI
                </span>
              </h1>
              <p className="mt-6 max-w-[550px] text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Abitso turns your documents into interactive conversations. Upload a PDF, ask questions, and pull out the insights you need.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#0F766E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#115E59]"
                >
                  Try Abitso now <ArrowRight className="h-4 w-4" />
                </Link>
                <AbitsoDemo />
              </div>
            </div>
            <AnalyzerPreview />
          </div>
        </MaxWidthWrapper>
      </section>

      <section id="how-it-works" className="bg-white py-20 sm:py-24">
        <MaxWidthWrapper>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">A clearer way to work</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-slate-900 sm:text-4xl">
              Upload. Chat. Discover.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Spend less time searching through pages and more time understanding what matters.
            </p>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map(({ number, title, description, icon: Icon }) => (
              <li key={number} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-400">{number}</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </li>
            ))}
          </ol>
        </MaxWidthWrapper>
      </section>

      <section className="border-t border-slate-200 bg-[#F8FAFA] py-14">
        <MaxWidthWrapper className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-slate-900">Ready to understand your PDFs?</h2>
            <p className="mt-2 text-sm text-slate-600">Start with a document. Discover what it contains.</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0F766E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#115E59]"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </MaxWidthWrapper>
      </section>

      <footer className="border-t border-slate-200 bg-white py-6">
        <MaxWidthWrapper className="flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-xs font-bold text-white">A</span>
            Abitso
          </div>
          <span>© {new Date().getFullYear()} Abitso. All rights reserved.</span>
          <Link href="/pricing" className="text-slate-600 transition-colors hover:text-teal-700">Pricing</Link>
        </MaxWidthWrapper>
      </footer>
    </main>
  );
}
