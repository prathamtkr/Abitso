"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import PdfRenderer from "@/components/PdfRenderer";
import ChatWrapper from "@/components/chat/ChatWrapper";
import DownloadChatButton from "@/components/DownloadChatButton";
import ShareDocumentButton from "@/components/ShareDocumentButton";

type AssistantTab = "chat" | "summary" | "key-points";

interface DocumentWorkspaceProps {
  fileId: string;
  fileName: string;
  pdfUrl: string;
  isSubscribed: boolean;
  uploadStatus: string;
}

const tabs: { id: AssistantTab; label: string; icon: typeof MessageSquare }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "summary", label: "Summary", icon: Sparkles },
  { id: "key-points", label: "Key points", icon: FileText },
];

export default function DocumentWorkspace({
  fileId,
  fileName,
  pdfUrl,
  isSubscribed,
  uploadStatus,
}: DocumentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AssistantTab>("chat");

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1800px] flex-col gap-3 bg-[#F8FAFA] p-3 sm:p-4">
      <header className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            href="/dashboard"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to dashboard</span>
          </Link>
          <span className="hidden h-5 w-px bg-slate-200 sm:block" />
          <h1 className="hidden truncate text-sm font-semibold text-slate-900 sm:block sm:text-base">{fileName}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ShareDocumentButton fileId={fileId} fileName={fileName} />
          <DownloadChatButton fileId={fileId} fileName={fileName} />
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-3 lg:min-h-[calc(100vh-8rem)] lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)]">
        <section className="flex min-h-[65vh] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white lg:min-h-0">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900">PDF viewer</h2>
                <p className="truncate text-xs text-slate-500">{fileName}</p>
              </div>
            </div>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
              {uploadStatus === "SUCCESS"
                ? "Analyzed"
                : uploadStatus === "FAILED"
                  ? "Needs attention"
                  : "Processing"}
            </span>
          </header>
          <div className="min-h-[60vh] flex-1 overflow-auto bg-[#F8FAFA] p-2 sm:p-4 lg:min-h-0">
            <PdfRenderer fileId={fileId} url={pdfUrl} />
          </div>
        </section>

        <aside className="flex min-h-[65vh] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white lg:min-h-0">
          <div className="border-b border-slate-200 px-4 pt-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Abitso assistant</h2>
                <p className="text-xs text-slate-500">Answers grounded in your PDF</p>
              </div>
            </div>
            <div className="flex gap-1" role="tablist" aria-label="Assistant views">
              {tabs.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  onClick={() => setActiveTab(id)}
                  className={`rounded-t-lg border-b-2 px-2.5 py-2 text-xs font-medium transition-colors sm:px-3 ${
                    activeTab === id
                      ? "border-teal-700 text-teal-800"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <ChatWrapper fileId={fileId} isSubscribed={isSubscribed} mode={activeTab} />
          </div>
        </aside>
      </div>
    </main>
  );
}
