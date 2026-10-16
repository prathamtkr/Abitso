"use client";

import { trpc } from '@/app/_trpc/client';
import { PLANS } from '@/config/stripe';
import { ChevronLeft, Loader2, XCircle, FileText, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '../ui/button';
import { ChatContextProvider } from './ChatContext';
import ChatInput from './ChatInput';
import Messages from './Messages';

interface ChatWrapperProps {
  fileId: string;
  isSubscribed: boolean;
}

const ChatWrapper = ({ fileId, isSubscribed }: ChatWrapperProps) => {
  const { data, isLoading } = trpc.getFileUploadStatus.useQuery(
    {
      fileId,
    },
    {
      refetchInterval: ({ state }) =>
        state.data?.status === "FAILED" || state.data?.status === "SUCCESS"
          ? false
          : 500,
    }
  );

  if (isLoading)
    return (
      <div className="h-full w-full bg-white flex flex-col">
        <div className="flex-1 flex justify-center items-center p-8">
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-50 duration-700">
            
            {/* Animated loading icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative bg-white shadow-lg p-4 rounded-full border border-gray-200">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              </div>
            </div>

            {/* Animated title */}
            <div className="text-center space-y-3">
              <h3 className="font-bold text-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                Initializing Chat
              </h3>
              <p className="text-gray-600 text-sm max-w-md">
                Setting up your intelligent document assistant...
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50">
          <ChatInput isDisabled />
        </div>
      </div>
    );

  if (data?.status === "PROCESSING")
    return (
      <div className="h-full w-full bg-white flex flex-col">
        <div className="flex-1 flex justify-center items-center p-8">
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-50 duration-700">
            
            {/* Processing animation */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative bg-white shadow-lg p-4 rounded-full border border-gray-200">
                <div className="relative">
                  <FileText className="h-8 w-8 text-amber-500" />
                  <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 animate-ping" />
                </div>
              </div>
            </div>

            {/* Processing status */}
            <div className="text-center space-y-3">
              <h3 className="font-bold text-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent animate-pulse">
                Processing PDF
              </h3>
              <p className="text-gray-600 text-sm max-w-md">
                Our AI is analyzing your document and preparing intelligent responses...
              </p>
            </div>

            {/* Processing progress bar */}
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50">
          <ChatInput isDisabled />
        </div>
      </div>
    );

  if (data?.status === "FAILED")
    return (
      <div className="h-full w-full bg-white flex flex-col">
        <div className="flex-1 flex justify-center items-center p-8">
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-50 duration-700">
            
            {/* Error animation */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative bg-white shadow-lg p-4 rounded-full border-2 border-red-200">
                <XCircle className="h-8 w-8 text-red-500 animate-bounce" />
              </div>
            </div>

            {/* Error message */}
            <div className="text-center space-y-4">
              <h3 className="font-bold text-2xl text-red-500">
                Document Too Large
              </h3>
              
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md">
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your{" "}
                  <span className="font-semibold px-2 py-1 bg-red-100 text-red-700 rounded-lg">
                    {isSubscribed ? "Pro" : "Free"}
                  </span>{" "}
                  plan supports up to{" "}
                  <span className="font-semibold text-gray-900">
                    {isSubscribed
                      ? PLANS.find((p) => p.name === "Pro")?.pagesPerPdf
                      : PLANS.find((p) => p.name === "Free")?.pagesPerPdf}{" "}
                    pages
                  </span>{" "}
                  per PDF document.
                </p>
              </div>

              
              <Link
                href="/dashboard"
                className={buttonVariants({
                  variant: "secondary",
                  className: "mt-6 group bg-gray-100 hover:bg-gray-200 transition-all duration-300 hover:scale-105 text-gray-700 border border-gray-300",
                })}
              >
                <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50">
          <ChatInput isDisabled />
        </div>
      </div>
    );

  return (
    <ChatContextProvider fileId={fileId}>
      <div className="h-full w-full bg-white flex flex-col">
        <div className="flex-1 overflow-hidden">
          <Messages fileId={fileId} />
        </div>
        <div className="border-t bg-white">
          <ChatInput />
        </div>
      </div>
    </ChatContextProvider>
  );
};

export default ChatWrapper;