import { trpc } from "@/app/_trpc/client";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { Loader2, MessageSquare, Sparkles, Zap, FileText, Bot, Brain } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import Message from "./Message";
import { useContext, useEffect, useRef, useState } from "react";
import { ChatContext } from "./ChatContext";
import { keepPreviousData } from "@tanstack/react-query";
import { useIntersection } from "@mantine/hooks";

interface MessagesProps {
  fileId: string;
}

const Messages = ({ fileId }: MessagesProps) => {
  const { data, isLoading, fetchNextPage } =
    trpc.getFileMessages.useInfiniteQuery(
      {
        fileId,
        limit: INFINITE_QUERY_LIMIT,
      },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
        placeholderData: keepPreviousData
      }
    );

  const messages = data?.pages.flatMap((page) => page.messages);

  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Only scroll when a new message is added
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length]);

  const { ref, entry } = useIntersection({
    root: lastMessageRef.current,
    threshold: 1
  })

  useEffect(() => {
    if (entry?.isIntersecting) {
      fetchNextPage();
    }
  },[entry,fetchNextPage])

  return (
    <div className="relative flex max-h-[calc(100vh-3.5rem-7rem)] flex-1 flex-col-reverse gap-4 p-6 overflow-y-auto scrollbar-thin scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
      
   
      
      {messages && messages.length > 0 ? (
        messages.map((message, i) => {
          const isNextMessageSamePerson =
            messages[i - 1]?.isUserMessage === messages[i]?.isUserMessage;
          
          if (i === 0) {
            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Message
                  message={message}
                  isNextMessageSamePerson={isNextMessageSamePerson}
                  ref={lastMessageRef}
                />
              </div>
            );
          } else {
            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Message
                  message={message}
                  isNextMessageSamePerson={isNextMessageSamePerson}
                />
              </div>
            );
          }
        })
      ) : isLoading ? (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-1000">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Simple Skeleton Avatar */}
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gray-200 rounded-2xl animate-pulse shadow-sm border border-gray-200" />
                </div>
                
                {/* Simple Skeleton Messages */}
                <div className="flex-1 space-y-3">
                  <div className="bg-gray-200 h-4 rounded-lg animate-pulse" 
                       style={{ width: `${60 + (i * 15)}%` }} />
                  <div className="bg-gray-200 h-4 rounded-lg animate-pulse" 
                       style={{ width: `${40 + (i * 10)}%` }} />
                  {i % 2 === 0 && (
                    <div className="bg-gray-200 h-4 rounded-lg animate-pulse" 
                         style={{ width: `${30 + (i * 5)}%` }} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          {/* Simple Empty State without glass effects */}
          <div className="relative group">
            <div className="relative bg-white p-8 rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <div className="p-3 bg-blue-500 rounded-2xl shadow-md">
                  <Brain className="h-12 w-12 text-white" />
                </div>
                
                {/* Simple floating elements */}
                <Sparkles className="absolute -top-3 -right-3 h-7 w-7 text-yellow-500 animate-bounce" 
                          style={{ animationDelay: '0.5s' }} />
                <Zap className="absolute -bottom-2 -left-2 h-5 w-5 text-blue-500 animate-ping" 
                     style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 -right-4 w-2 h-2 bg-blue-500 rounded-full animate-bounce opacity-70"
                     style={{ animationDelay: '1.5s' }} />
              </div>
            </div>
          </div>
          
          {/* Simple text content */}
          <div className="text-center space-y-6 max-w-lg">
            <h3 className="font-bold text-3xl text-gray-900 animate-in slide-in-from-top-4 duration-700 delay-200">
              Ready to Explore!
            </h3>
            
            <p className="text-gray-600 text-lg leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-300">
              Your document is loaded and ready for intelligent analysis. Start a conversation to unlock insights and discover key information.
            </p>

            {/* Simple suggested actions without glass */}
            <div className="flex flex-wrap gap-3 justify-center mt-8">
              {[
                { text: "Summarize document", icon: FileText },
                { text: "Find key insights", icon: Sparkles },
                { text: "Ask specific questions", icon: MessageSquare }
              ].map((suggestion, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-2 px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-full text-blue-700 shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                >
                  <suggestion.icon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">{suggestion.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Simple status indicator without glass */}
          <div className="absolute bottom-8 right-8 flex items-center gap-2 px-3 py-2 bg-white border border-green-200 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-700 text-sm font-medium">Ready</span>
          </div>
        </div>
      )}

      {/* Simple load more indicator without glass */}
      {entry?.isIntersecting && (
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
            <div className="relative">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
            <span className="text-sm text-gray-700 font-semibold">Loading conversation history...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;