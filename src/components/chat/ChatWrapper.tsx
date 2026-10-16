"use client";

import { useContext, useEffect, useRef } from "react";
import { trpc } from "@/app/_trpc/client";
import { PLANS } from "@/config/stripe";
import { FileText, Loader2, MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { ChatContext, ChatContextProvider } from "./ChatContext";
import ChatInput from "./ChatInput";
import Messages from "./Messages";

type AssistantMode = "chat" | "summary" | "key-points";

interface ChatWrapperProps {
  fileId: string;
  isSubscribed: boolean;
  mode?: AssistantMode;
}

function Conversation({ fileId, mode }: { fileId: string; mode: AssistantMode }) {
  const { sendMessage } = useContext(ChatContext);
  const lastRequestedMode = useRef<AssistantMode>("chat");

  useEffect(() => {
    if (mode === "chat") {
      lastRequestedMode.current = "chat";
      return;
    }
    if (lastRequestedMode.current === mode) return;

    lastRequestedMode.current = mode;
    const prompt =
      mode === "summary"
        ? "Summarize this document. Organize the main ideas clearly and cite the relevant PDF pages using [Source: page N]."
        : "List the most important key points from this document. Keep each point concise and cite the relevant PDF pages using [Source: page N].";
    sendMessage(prompt);
  }, [mode, sendMessage]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {mode !== "chat" && (
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500">
          {mode === "summary" ? <Sparkles className="h-3.5 w-3.5 text-teal-700" /> : <FileText className="h-3.5 w-3.5 text-teal-700" />}
          {mode === "summary" ? "Document summary" : "Key points from this document"}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-hidden">
        <Messages fileId={fileId} />
      </div>
      <div className="border-t border-slate-200 bg-white p-3">
        <ChatInput />
      </div>
    </div>
  );
}

const ChatWrapper = ({ fileId, isSubscribed, mode = "chat" }: ChatWrapperProps) => {
  const { data, isLoading } = trpc.getFileUploadStatus.useQuery(
    { fileId },
    {
      refetchInterval: ({ state }) =>
        state.data?.status === "FAILED" || state.data?.status === "SUCCESS" ? false : 500,
    }
  );

  if (isLoading || data?.status === "PROCESSING") {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-4 bg-white p-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {isLoading ? "Preparing assistant" : "Analyzing your PDF"}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {isLoading ? "Checking document status…" : "Chat and insights will be ready when processing finishes."}
          </p>
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-2/3 rounded-full bg-teal-600" />
        </div>
      </div>
    );
  }

  if (data?.status === "FAILED") {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 bg-white p-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">This PDF could not be analyzed</h3>
          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
            Check the document size and processing settings, then upload it again.
            {` Your ${isSubscribed ? "Pro" : "Free"} plan supports up to ${
              isSubscribed
                ? PLANS.find((plan) => plan.name === "Pro")?.pagesPerPdf
                : PLANS.find((plan) => plan.name === "Free")?.pagesPerPdf
            } pages.`}
          </p>
        </div>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline", className: "mt-2 rounded-[10px]" })}>
          <MessageSquare className="mr-2 h-4 w-4" /> Return to documents
        </Link>
      </div>
    );
  }

  return (
    <ChatContextProvider fileId={fileId}>
      <Conversation fileId={fileId} mode={mode} />
    </ChatContextProvider>
  );
};

export default ChatWrapper;
