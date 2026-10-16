import { cn } from "@/lib/utils";
import { ExtendedMessage } from "@/types/message";
import { Icons } from "../Icons";
import ReactMarkdown from "react-markdown";
import { format, formatDistanceToNow } from "date-fns";
import { forwardRef, useState } from "react";
import { Copy, Trash2, CheckCircle2, Bot, User, Sparkles, Brain, Check } from "lucide-react";

interface MessageProps {
  message: ExtendedMessage;
  isNextMessageSamePerson: boolean;
}

const Message = forwardRef<HTMLDivElement, MessageProps>(
  ({ message, isNextMessageSamePerson }, ref) => {
    const [hovered, setHovered] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      if (typeof message.text === "string") {
        await navigator.clipboard.writeText(message.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

  
    const status =
      message.isUserMessage && message.id !== "loading-message"
        ? "read"
        : undefined;
    const sourcePages =
      typeof message.text === "string"
        ? Array.from(new Set(Array.from(message.text.matchAll(/\[Source: page (\d+)\]/g), (match) => match[1])))
        : [];
    const displayText =
      typeof message.text === "string"
        ? message.text.replace(/\[Source: page \d+\]/g, "").trim()
        : "";

    return (
      <div
        ref={ref}
        className={cn("flex gap-4 group transition-all duration-700 ease-out animate-in fade-in slide-in-from-bottom-4", {
          "justify-end": message.isUserMessage,
          "justify-start": !message.isUserMessage,
        })}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        
       
        {!message.isUserMessage && (
          <div className="flex-shrink-0 mt-1">
            <div className={cn(
              "w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center shadow-sm transition-all duration-300 ring-2 ring-teal-100",
              {
                "opacity-0 scale-75 translate-y-2": isNextMessageSamePerson,
                "opacity-100 scale-100 translate-y-0": !isNextMessageSamePerson,
              }
            )}>
              
              <div className={cn(
                "absolute inset-0 rounded-full opacity-0 transition-all duration-500 blur-lg scale-150",
                {
                  "bg-teal-400 opacity-20": hovered,
                }
              )} />
              
              <Bot className="h-4 w-4 text-white relative z-10 drop-shadow-lg" />
              
              
              <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 animate-pulse-once" />
            </div>
          </div>
        )}

       
        <div className={cn("flex flex-col gap-2 max-w-[85%]", {
          "items-end": message.isUserMessage,
          "items-start": !message.isUserMessage,
        })}>
          
          
          <div className={cn(
            "relative px-4 py-3 rounded-2xl transition-all duration-500 transform hover:scale-[1.02] group-hover:shadow-md",
            {
              
              "bg-teal-700 text-white rounded-br-md shadow-sm":
                message.isUserMessage,
              
              "bg-white border border-gray-200 rounded-bl-md shadow-sm text-gray-800":
                !message.isUserMessage,
            }
          )}>
            
            
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-teal-50 opacity-0" />

          
            {!message.isUserMessage && (
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <div className="w-5 h-5 rounded-full bg-teal-700 flex items-center justify-center">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-600">Abitso AI</span>
                <div className="flex items-center gap-1 ml-auto">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Live</span>
                </div>
              </div>
            )}

            <div className={cn(
              "absolute flex gap-2 transition-all duration-300 transform z-20",
              message.isUserMessage ? "-left-12 top-3" : "-right-12 top-3",
              hovered ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-90"
            )}>
              <button
                className={cn(
                  "p-2 rounded-xl backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-110",
                  "bg-white/95 hover:bg-white border border-slate-200/60 hover:border-teal-300"
                )}
                onClick={handleCopy}
                title="Copy message"
              >
                {copied ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 animate-in zoom-in-50 duration-300" />
                ) : (
                  <Copy className="h-3 w-3 text-slate-600 hover:text-teal-800 transition-colors duration-300" />
                )}
              </button>
            </div>

            {/* Copy Button - Simplified version for mobile */}
            <button
              onClick={handleCopy}
              className={cn(
                "absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 md:hidden",
                message.isUserMessage
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              )}
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>

            <div className="relative z-10">
              {typeof message.text === "string" ? (
                <ReactMarkdown
                  className={cn(
                    "prose prose-sm max-w-none leading-relaxed",
                    message.isUserMessage 
                      ? "prose-invert prose-p:text-white prose-headings:text-white prose-strong:text-white prose-li:text-white prose-code:text-teal-50 prose-code:bg-white/20" 
                      : "prose-gray prose-p:text-slate-700 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-li:text-slate-700 prose-code:text-teal-800 prose-code:bg-teal-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-ul:space-y-1 prose-li:marker:text-teal-700"
                  )}
                  components={{
                    // Custom styling for lists in AI responses
                    ul: ({ children }) => (
                      <ul className={cn(
                        "space-y-2 my-3 transition-all duration-300",
                        !message.isUserMessage && "bg-slate-50 rounded-lg p-3 border-l-2 border-teal-700"
                      )}>
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className={cn(
                        "flex items-start gap-2 transition-all duration-300 hover:translate-x-1",
                        !message.isUserMessage && "text-gray-700"
                      )}>
                        {!message.isUserMessage && (
                          <span className="w-1.5 h-1.5 bg-teal-700 rounded-full mt-2 flex-shrink-0"></span>
                        )}
                        <span className="flex-1">{children}</span>
                      </li>
                    ),
                    // Custom styling for headings
                    h1: ({ children }) => (
                      <h1 className={cn(
                        "text-xl font-bold mb-3",
                        !message.isUserMessage && "text-gray-900 border-b border-gray-200 pb-2"
                      )}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className={cn(
                        "text-lg font-semibold mb-2 mt-4",
                        !message.isUserMessage && "text-gray-800"
                      )}>
                        {children}
                      </h2>
                    ),
                    // Custom styling for paragraphs
                    p: ({ children }) => (
                      <p className={cn(
                        "mb-2 leading-relaxed transition-all duration-300",
                        !message.isUserMessage && "text-gray-700"
                      )}>
                        {children}
                      </p>
                    ),
                    // Custom styling for strong text
                    strong: ({ children }) => (
                      <strong className={cn(
                        "font-semibold",
                        !message.isUserMessage && "text-gray-900"
                      )}>
                        {children}
                      </strong>
                    ),
                    // Enhanced code styling
                    code: ({ node, ...props }) => (
                      <code
                        {...props}
                        className={cn(
                          "rounded-lg px-2 py-1 font-mono text-sm border transition-all duration-300",
                          message.isUserMessage
                            ? "bg-white/20 text-teal-50 border-white/30 hover:bg-white/30"
                            : "bg-teal-50 text-teal-800 border-teal-100 hover:bg-teal-100"
                        )}
                      />
                    ),
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        className="underline hover:text-teal-700 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                  }}
                >
                  {displayText}
                </ReactMarkdown>
              ) : (
                <div className="animate-in fade-in duration-500">
                  {message.text}
                </div>
              )}
              {!message.isUserMessage && sourcePages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sourcePages.map((page) => (
                    <span key={page} className="inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-800">
                      Source: page {page}
                    </span>
                  ))}
                </div>
              )}
            </div>

          
            {message.isUserMessage && (
              <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 animate-ripple pointer-events-none" />
            )}
          </div>

          {/* Enhanced Timestamp  */}
          <div className={cn("flex items-center gap-2 text-xs opacity-70", {
            "justify-end": message.isUserMessage,
            "justify-start": !message.isUserMessage,
          })}>
            <span className="text-gray-500 font-medium bg-black/5 px-2 py-1 rounded-full">
              {format(new Date(message.createdAt), "HH:mm")}
            </span>
            
            {/* Read indicator for user messages  */}
            {message.isUserMessage && status === "read" && (
              <div className="flex items-center gap-1 animate-in fade-in zoom-in-50 duration-500 bg-emerald-500/20 px-2 py-1 rounded-full">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">Read</span>
              </div>
            )}
          </div>
        </div>

        {/* User Avatar (only for user messages)  */}
        {message.isUserMessage && (
          <div className="flex-shrink-0 mt-1">
            <div className={cn(
              "w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shadow-sm transition-all duration-300 ring-2 ring-teal-50",
              {
                "opacity-0 scale-75 translate-y-2": isNextMessageSamePerson,
                "opacity-100 scale-100 translate-y-0": !isNextMessageSamePerson,
              }
            )}>
              {/* glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-full opacity-0 transition-all duration-500 blur-lg scale-150",
                {
                  "bg-teal-400 opacity-20": hovered,
                }
              )} />
              
              <User className="h-4 w-4 text-teal-800 relative z-10" />
              
         
              <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 animate-pulse-once" />
            </div>
          </div>
        )}
      </div>
    );
  }
);

Message.displayName = "Message";

export default Message;