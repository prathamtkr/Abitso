"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, FileText, MessageSquare, Play, Sparkles, X } from "lucide-react";

const scenes = [
  { caption: "Too many documents?", duration: 4000 },
  { caption: "Upload your PDF", duration: 6000 },
  { caption: "Ask anything", duration: 8000 },
  { caption: "Get answers with sources", duration: 7000 },
  { caption: "Try Abitso now", duration: 5000 },
];

function DemoScene({ scene }: { scene: number }) {
  return (
    <div className="demo-canvas relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-[#F8FAFA] p-5 sm:min-h-[360px]">
      {scene === 0 && (
        <div className="relative h-44 w-48">
          {[0, 1, 2, 3].map((page) => (
            <div
              key={page}
              className="demo-page absolute inset-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              style={{ "--page-index": page } as CSSProperties}
            >
              <div className="mb-5 h-2 w-2/3 rounded bg-slate-300" />
              <div className="space-y-3">
                <div className="h-1.5 rounded bg-slate-200" />
                <div className="h-1.5 w-4/5 rounded bg-slate-200" />
                <div className="h-1.5 w-5/6 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      )}
      {scene === 1 && (
        <div className="demo-upload relative flex h-44 w-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-teal-700 bg-white text-center">
          <div className="demo-upload-ring absolute inset-2 rounded-lg border-2 border-teal-600" />
          <FileText className="relative z-10 h-9 w-9 text-teal-700" />
          <p className="relative z-10 text-sm font-semibold text-slate-800">sample-report.pdf</p>
          <span className="relative z-10 text-xs text-slate-500">PDF ready to analyze</span>
        </div>
      )}
      {scene === 2 && (
        <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-700">
              <FileText className="h-4 w-4 text-teal-700" /> sample-report.pdf
            </div>
            <div className="space-y-3">
              <div className="h-2 rounded bg-slate-200" />
              <div className="h-2 w-5/6 rounded bg-slate-200" />
              <div className="rounded bg-teal-100 px-2 py-3">
                <div className="h-2 rounded bg-teal-300" />
                <div className="mt-2 h-2 w-3/4 rounded bg-teal-300" />
              </div>
              <div className="h-2 w-4/5 rounded bg-slate-200" />
            </div>
          </div>
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-700">
              <MessageSquare className="h-4 w-4 text-teal-700" /> Chat with your PDF
            </div>
            <div className="demo-question self-end rounded-lg bg-teal-700 px-3 py-2 text-xs text-white">
              What are the main findings?
            </div>
            <div className="demo-answer mt-3 rounded-lg border border-slate-200 p-3 text-xs leading-relaxed text-slate-700">
              The report identifies three key findings and recommends a phased rollout.
            </div>
            <span className="mt-2 inline-flex w-fit rounded-full bg-teal-50 px-2 py-1 text-[10px] font-medium text-teal-800">
              Source: page 2
            </span>
          </div>
        </div>
      )}
      {scene === 3 && (
        <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-[1fr_0.8fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-700">
              <FileText className="h-4 w-4 text-teal-700" /> sample-report.pdf
            </div>
            <div className="space-y-3">
              <div className="h-2 rounded bg-slate-200" />
              <div className="h-2 w-5/6 rounded bg-slate-200" />
              <div className="rounded bg-teal-100 px-2 py-3">
                <div className="h-2 rounded bg-teal-300" />
                <div className="mt-2 h-2 w-3/4 rounded bg-teal-300" />
              </div>
              <div className="h-2 w-4/5 rounded bg-slate-200" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="demo-insight rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Sparkles className="h-4 w-4 text-teal-700" /> Summary
              </div>
              <div className="h-2 rounded bg-slate-200" />
              <div className="mt-2 h-2 w-4/5 rounded bg-slate-200" />
              <span className="mt-3 inline-flex rounded-full bg-teal-50 px-2 py-1 text-[10px] text-teal-800">
                Source: page 2
              </span>
            </div>
            <div className="demo-insight rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 text-xs font-semibold text-slate-800">Key points</div>
              <div className="h-2 w-5/6 rounded bg-slate-200" />
              <div className="mt-2 h-2 w-2/3 rounded bg-slate-200" />
              <span className="mt-3 inline-flex rounded-full bg-teal-50 px-2 py-1 text-[10px] text-teal-800">
                Source: page 4
              </span>
            </div>
          </div>
        </div>
      )}
      {scene === 4 && (
        <div className="demo-close flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-700 text-xl font-bold text-white">A</span>
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">Abitso</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-[10px] bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
          >
            Try Abitso now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function AbitsoDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [scene, setScene] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      if (scene === scenes.length - 1) setIsOpen(false);
      else setScene((current) => current + 1);
    }, scenes[scene].duration);
    return () => window.clearTimeout(timer);
  }, [isOpen, scene]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const openDemo = () => {
    setScene(0);
    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openDemo}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50"
      >
        <Play className="h-4 w-4" /> Watch demo
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="abitso-demo-title"
            className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Abitso in 30 seconds</p>
                <h2 id="abitso-demo-title" className="mt-1 text-lg font-bold text-slate-900">{scenes[scene].caption}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close demo"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DemoScene scene={scene} />
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex gap-2" aria-label={`Scene ${scene + 1} of ${scenes.length}`}>
                {scenes.map((item, index) => (
                  <span
                    key={item.caption}
                    className={`h-1.5 rounded-full transition-all duration-300 ${index === scene ? "w-8 bg-teal-700" : "w-3 bg-slate-200"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">{scene + 1} / {scenes.length}</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
