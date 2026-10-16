"use client";

import { useState } from "react";
import { Download, Eye, ChevronDown, Sparkles, FileText, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/app/_trpc/client";

interface DownloadChatButtonProps {
  fileId: string;
  fileName: string;
}

interface Message {
  id: string;
  isUserMessage: boolean;
  createdAt: string;
  text: string;
}

const DownloadChatButton = ({ fileId, fileName }: DownloadChatButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Fetch messages using tRPC 
  const { 
    data: messagesData, 
    isLoading, 
    error, 
    refetch 
  } = trpc.getFileMessages.useInfiniteQuery(
    {
      fileId,
      limit: 50, 
    },
    {
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      enabled: !!fileId, 
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  // Extract all messages from paginated data
  const getMessages = (): Message[] => {
    if (!messagesData?.pages) return [];
    
    return messagesData.pages
      .flatMap((page) => page.messages)
      .filter((message): message is Message => Boolean(message))
      .reverse(); // Add this line to reverse the order
  };

  // Safe download function 
  const safeDownload = (content: string, filename: string, mimeType: string): boolean => {
    try {
      // Create blob and download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      return true;
    } catch (error) {
      console.error("Download failed:", error);
      return false;
    }
  };

  // Generate the final HTML string for download
  function generateHtmlContent(messagesArr: Message[], docFileName: string): string {
    const userCount = messagesArr.filter(m => m.isUserMessage).length;
    const aiCount = messagesArr.filter(m => !m.isUserMessage).length;
    
    // Sanitize text to prevent HTML injection
    const sanitize = (text: string) => text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '<br>');

    // Fix: Use template literals properly and escape entities
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat History - ${sanitize(docFileName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px; 
      min-height: 100vh;
    }
    .container { 
      max-width: 900px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 16px; 
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); 
      overflow: hidden; 
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 40px; 
      text-align: center; 
      position: relative;
    }
    .print-button {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 12px 20px;
      border-radius: 50px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
    .print-button:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }
    .print-button:active {
      transform: translateY(0);
    }
    .header h1 { 
      font-size: 32px; 
      margin-bottom: 16px; 
      font-weight: 700; 
    }
    .stats { 
      display: flex; 
      justify-content: center; 
      gap: 20px; 
      margin-top: 20px; 
      flex-wrap: wrap; 
    }
    .stat { 
      background: rgba(255, 255, 255, 0.2); 
      padding: 12px 20px; 
      border-radius: 25px; 
      font-size: 14px; 
      font-weight: 600; 
      backdrop-filter: blur(10px);
    }
    .content { padding: 40px; }
    .message { 
      margin-bottom: 30px; 
      padding: 24px; 
      border-radius: 16px; 
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); 
      border: 1px solid #e2e8f0; 
      transition: transform 0.2s ease;
    }
    .message:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    }
    .user { 
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); 
      border-left: 5px solid #2196f3; 
      margin-left: 30px; 
    }
    .ai { 
      background: linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%); 
      border-left: 5px solid #4caf50; 
      margin-right: 30px; 
    }
    .sender { 
      font-weight: 700; 
      margin-bottom: 12px; 
      font-size: 18px; 
      display: flex; 
      align-items: center; 
      gap: 10px; 
    }
    .user .sender { color: #1565c0; }
    .ai .sender { color: #2e7d32; }
    .timestamp { 
      font-size: 13px; 
      color: #64748b; 
      margin-bottom: 16px; 
      font-style: italic; 
      opacity: 0.8;
    }
    .text { 
      font-size: 16px; 
      line-height: 1.8; 
      white-space: pre-wrap; 
      word-wrap: break-word; 
    }
    .footer { 
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
      padding: 30px; 
      text-align: center; 
      color: #64748b; 
      border-top: 1px solid #e2e8f0; 
      font-size: 14px; 
    }
    .footer strong { color: #1e293b; }
    @media print {
      body { background: white !important; padding: 0 !important; }
      .container { box-shadow: none !important; border-radius: 0 !important; }
      .print-button { display: none !important; }
      .message:hover { transform: none !important; }
    }
    @media (max-width: 768px) { 
      body { padding: 10px; } 
      .content { padding: 24px; } 
      .header { padding: 30px 20px; }
      .print-button {
        position: static;
        margin: 0 auto 20px;
        display: flex;
      }
      .user { margin-left: 0; } 
      .ai { margin-right: 0; } 
      .stats { flex-direction: column; align-items: center; gap: 12px; } 
      .message { padding: 20px; margin-bottom: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <button class="print-button" onclick="window.print()">
        <span>🖨️</span>
        <span>Print as PDF</span>
      </button>
      <h1>💬 LexiNote Chat History</h1>
      <div class="stats">
        <div class="stat">📄 ${sanitize(docFileName)}</div>
        <div class="stat">📅 ${new Date().toLocaleDateString()}</div>
        <div class="stat">💬 ${messagesArr.length} messages</div>
        <div class="stat">👤 ${userCount} from you</div>
        <div class="stat">🤖 ${aiCount} from AI</div>
      </div>
    </div>
    <div class="content">
      ${messagesArr.map((message, index) => {
        const formattedDate = new Date(message.createdAt).toLocaleString('en-US', {
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit',
          timeZoneName: 'short'
        });
        
        return `<div class="message ${message.isUserMessage ? "user" : "ai"}">
          <div class="sender">
            ${message.isUserMessage ? "👤 You" : "🤖 LexiNote AI"}
          </div>
          <div class="timestamp">
            ${formattedDate}
          </div>
          <div class="text">${sanitize(message.text)}</div>
        </div>`;
      }).join("")}
    </div>
    <div class="footer">
      <p><strong>Generated by LexiNote AI</strong></p>
      <p>Downloaded on ${new Date().toLocaleString()}</p>
      <p style="margin-top: 10px; font-size: 12px; opacity: 0.7;">
        This conversation history contains ${messagesArr.length} messages between you and our AI assistant.
      </p>
    </div>
  </div>
</body>
</html>`;

    return htmlContent;
  }

  // View chat history in new tab
  const handleViewChat = async () => {
    if (isLoading) {
      toast({
        title: "⏳ Loading",
        description: "Please wait for messages to load",
      });
      return;
    }

    try {
      const messages = getMessages();
      if (messages.length === 0) {
        toast({
          title: "📭 No messages",
          description: "No chat history available to view",
        });
        return;
      }

      const htmlContent = generateHtmlContent(messages, fileName);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new tab
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        toast({
          title: "❌ Popup blocked",
          description: "Please allow popups to view chat history",
          variant: "destructive",
        });
        return;
      }

      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      toast({
        title: "✅ Success",
        description: "Chat history opened in new tab",
      });
    } catch (error) {
      console.error('Error viewing chat:', error);
      toast({
        title: "❌ Error",
        description: "Failed to view chat history",
        variant: "destructive",
      });
    }
  };

  // Download chat history as HTML file
  const handleDownloadChat = async () => {
    if (isLoading) {
      toast({
        title: "⏳ Loading",
        description: "Please wait for messages to load",
      });
      return;
    }

    try {
      const messages = getMessages();
      if (messages.length === 0) {
        toast({
          title: "📭 No messages",
          description: "No chat history available to download",
        });
        return;
      }

      const htmlContent = generateHtmlContent(messages, fileName);
      const success = safeDownload(
        htmlContent, 
        `${fileName.replace(/\.[^/.]+$/, "")}_chat_history.html`, 
        'text/html'
      );
      
      if (success) {
        toast({
          title: "✅ Downloaded",
          description: "Chat history downloaded successfully",
        });
      }
    } catch (error) {
      console.error('Error downloading chat:', error);
      toast({
        title: "❌ Error",
        description: "Failed to download chat history",
        variant: "destructive",
      });
    }
  };

  const messages = getMessages();
  const hasMessages = messages.length > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "group relative overflow-hidden",
            "flex items-center gap-2 px-5 py-3",
            "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500",
            "hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600",
            "text-white font-medium rounded-xl",
            "shadow-lg hover:shadow-xl",
            "transition-all duration-300 ease-out",
            "hover:scale-105 active:scale-95",
            "border border-white/20",
            isLoading && "animate-pulse cursor-wait"
          )}
          disabled={isLoading}
        >
          
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Sparkle animation */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-white/60 rounded-full animate-ping" style={{ animationDelay: '0ms' }} />
            <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-ping" style={{ animationDelay: '800ms' }} />
            <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-white/50 rounded-full animate-ping" style={{ animationDelay: '1600ms' }} />
          </div>
          
          <div className="relative z-10 flex items-center gap-2">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm">Loading...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-sm font-medium">Download Chat</span>
                <ChevronDown className="h-3 w-3 group-hover:rotate-180 transition-transform duration-300" />
              </>
            )}
          </div>
          
          {/* Hover glow effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-indigo-400/0 group-hover:from-blue-400/20 group-hover:via-purple-400/20 group-hover:to-indigo-400/20 transition-all duration-500" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "w-64 p-2",
          "bg-white/95 backdrop-blur-xl",
          "border border-gray-200/50 shadow-2xl",
          "rounded-2xl",
          "animate-in slide-in-from-top-2 duration-200"
        )}
      >
        {error && (
          <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg mx-1 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              Error loading messages. Try refreshing.
            </div>
          </div>
        )}

        {!error && hasMessages && (
          <>
            <DropdownMenuSeparator className="my-2" />
            <div className="p-3 text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg mx-1 my-2">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span className="font-medium">{getMessages().length} messages ready</span>
              </div>
            </div>
          </>
        )}

        {/* View Chat History Option */}
        <DropdownMenuItem 
          onClick={handleViewChat}
          disabled={isLoading || !hasMessages}
          className={cn(
            "cursor-pointer p-3 rounded-xl",
            "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50",
            "transition-all duration-200",
            "group flex items-center gap-3",
            (!hasMessages || isLoading) && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
            <Eye className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">View Chat History</div>
            <div className="text-xs text-gray-500">Open in new tab</div>
          </div>
          <Sparkles className="h-4 w-4 text-purple-400 group-hover:animate-spin" />
        </DropdownMenuItem>

        {/* Download Chat Option */}
        <DropdownMenuItem 
          onClick={handleDownloadChat}
          disabled={isLoading || !hasMessages}
          className={cn(
            "cursor-pointer p-3 rounded-xl",
            "hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50",
            "transition-all duration-200",
            "group flex items-center gap-3",
            (!hasMessages || isLoading) && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
            <Download className="h-4 w-4 text-white group-hover:animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">Download Chat</div>
            <div className="text-xs text-gray-500">Save as HTML file</div>
          </div>
          <FileText className="h-4 w-4 text-emerald-400 group-hover:rotate-12 transition-transform duration-200" />
        </DropdownMenuItem>

        {!hasMessages && !isLoading && (
          <div className="p-4 text-center text-gray-500 text-sm">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <div className="font-medium">No messages yet</div>
            <div className="text-xs">Start a conversation to download</div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DownloadChatButton;