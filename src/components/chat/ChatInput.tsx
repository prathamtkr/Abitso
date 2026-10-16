import { Send, Loader2, XCircle, Sparkles, MessageCircle, Mic, MicOff } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useContext, useRef, useState, useEffect } from "react";
import { ChatContext } from "./ChatContext";

interface ChatInputProps {
  isDisabled?: boolean;
  isShared?: boolean;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// SpeechRecognition interface
interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

const MAX_LENGTH = 500;

const ChatInput = ({ isDisabled, isShared = false }: ChatInputProps) => {
  const { addMessage, handleInputChange, isLoading, message } =
    useContext(ChatContext);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const progressPercentage = (message.length / MAX_LENGTH) * 100;
  const isNearLimit = progressPercentage > 90;

  const suggestions = [
    "Summarize this document",
    "What are the key points?", 
    "Explain this section"
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        const currentMessage = textareaRef.current?.value || '';
        const newMessage = currentMessage + (currentMessage ? ' ' : '') + transcript;
        
        handleInputChange({ 
          target: { value: newMessage } 
        } as React.ChangeEvent<HTMLTextAreaElement>);
        
        if (textareaRef.current) {
          textareaRef.current.value = newMessage;
          textareaRef.current.focus();
        }
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [handleInputChange]);

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLTextAreaElement>);
    await addMessage();
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full bg-white p-3 sm:p-4 pb-4 sm:pb-6">
      
      {/* Floating Suggestions */}
      {!message && !isLoading && (
        <div className="mb-2 sm:mb-3">
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleInputChange({ target: { value: suggestion } } as React.ChangeEvent<HTMLTextAreaElement>)}
                className="group px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-full transition-all duration-300 whitespace-nowrap hover:scale-105 shadow-sm hover:shadow-md"
              >
                <span className="text-indigo-600 group-hover:text-indigo-700 font-medium transition-colors">
                  {suggestion}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Container */}
      <div className="relative max-w-4xl mx-auto">
        <div className={`
          relative bg-white rounded-2xl sm:rounded-3xl shadow-lg border transition-all duration-300
          ${isFocused 
            ? 'ring-2 ring-indigo-500/50 shadow-xl border-indigo-200 scale-[1.01]' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
          }
          ${isLoading ? 'animate-pulse' : ''}
        `}>
          
          <div className="relative flex items-end gap-2 sm:gap-3 p-2.5 sm:p-3">
            
            {/* Main textarea container */}
            <div className="flex-1 relative">
              <textarea
                rows={1}
                ref={textareaRef}
                maxLength={MAX_LENGTH}
                onChange={handleInputChange}
                value={message}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isShared 
                    ? "Ask questions about this shared document..." 
                    : isDisabled
                    ? "Upload a document to start chatting..."
                    : "Ask me anything about this document..."
                }
                disabled={isDisabled}
                className="resize-none w-full bg-transparent border-0 focus:outline-none text-sm sm:text-base placeholder:text-gray-400 text-gray-700 py-2 px-0 leading-relaxed min-h-[36px] sm:min-h-[40px] max-h-[100px] sm:max-h-[120px] overflow-y-auto"
              />

              {/* Character limit progress bar */}
              {message && (
                <div className="absolute bottom-1 left-0 right-0 h-0.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${
                      isNearLimit 
                        ? 'bg-gradient-to-r from-amber-400 to-red-500' 
                        : 'bg-gradient-to-r from-indigo-400 to-violet-500'
                    }`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              )}

              {/* Character counter */}
              {message && (
                <div className={`
                  absolute bottom-2 right-0 text-xs transition-all duration-300 pointer-events-none
                  ${isNearLimit ? "text-red-500 font-semibold animate-pulse" : "text-gray-400"}
                `}>
                  {message.length}/{MAX_LENGTH}
                </div>
              )}
            </div>

            {/* Right side buttons */}
            <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 mb-1">
              
              {/* Voice input button */}
              <button 
                onClick={toggleVoiceInput}
                disabled={isDisabled || isLoading}
                className={`
                  relative p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-110 border-2
                  ${isListening 
                    ? 'text-red-500 bg-red-50 border-red-200 hover:bg-red-100 animate-pulse' 
                    : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 border-transparent hover:border-indigo-200'
                  }
                  ${(isLoading || isDisabled) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? (
                  <div className="relative">
                    <MicOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                  </div>
                ) : (
                  <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </button>

              {/* Send button */}
              <button
                disabled={isLoading || isDisabled || !message.trim()}
                onClick={handleSendMessage}
                className={`
                  relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg
                  ${message.trim() && !isLoading && !isDisabled
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white hover:scale-110 hover:shadow-xl active:scale-95' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Voice listening indicator */}
          {isListening && (
            <div className="px-3 sm:px-4 pb-2 sm:pb-3">
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-red-600">
                <div className="flex gap-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full animate-bounce" />
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="font-medium">Listening... Speak now</span>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !isListening && (
            <div className="px-3 sm:px-4 pb-2 sm:pb-3">
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-indigo-600">
                <div className="flex gap-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="font-medium">AI is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;