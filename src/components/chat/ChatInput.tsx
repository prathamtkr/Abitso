"use client";

import { useContext, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { ChatContext } from "./ChatContext";

interface ChatInputProps {
  isDisabled?: boolean;
  isShared?: boolean;
}

const MAX_LENGTH = 500;

const ChatInput = ({ isDisabled = false, isShared = false }: ChatInputProps) => {
  const { addMessage, handleInputChange, isLoading, message } = useContext(ChatContext);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const disabled = isDisabled || isLoading;

  const handleSendMessage = () => {
    if (disabled || !message.trim()) return;
    addMessage();
    textareaRef.current?.focus();
  };

  return (
    <form
      className="flex w-full items-end gap-2 rounded-[10px] border border-slate-300 bg-white p-2 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/15"
      onSubmit={(event) => {
        event.preventDefault();
        handleSendMessage();
      }}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        maxLength={MAX_LENGTH}
        onChange={handleInputChange}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
          }
        }}
        value={message}
        placeholder={
          isShared
            ? "Ask questions about this shared document"
            : isDisabled
              ? "Upload a document to start chatting"
              : "Ask anything about this document"
        }
        disabled={disabled}
        aria-label="Ask anything about this document"
        className="max-h-28 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-white"
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        aria-label="Send message"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-teal-700 text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </button>
    </form>
  );
};

export default ChatInput;
