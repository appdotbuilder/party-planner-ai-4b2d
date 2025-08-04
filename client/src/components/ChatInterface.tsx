
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageBubble } from './MessageBubble';
import { QuickReplies } from './QuickReplies';
import { RichContent } from './RichContent';
import { PartyHeader } from './PartyHeader';
import { Send, Mic, Plus } from 'lucide-react';
import type { Message, Conversation } from '../../../server/src/schema';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string, messageType?: 'text' | 'quick_reply', skipUserMessage?: boolean) => Promise<void>;
  onQuickReply: (reply: string) => void;
  isTyping: boolean;
  conversation: Conversation | null;
}

export function ChatInterface({ 
  messages, 
  onSendMessage, 
  onQuickReply, 
  isTyping, 
  conversation 
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Auto-resize input field
  const adjustInputHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const newHeight = Math.min(inputRef.current.scrollHeight, 120);
      inputRef.current.style.height = `${newHeight}px`;
      setInputHeight(newHeight);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const message = inputValue.trim();
    setInputValue('');
    setInputHeight(40);
    
    await onSendMessage(message, 'text');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get quick reply options from the last assistant message
  const getQuickReplies = (): string[] => {
    const lastAssistantMessage = messages
      .filter(m => m.role === 'assistant')
      .slice(-1)[0];
    
    if (!lastAssistantMessage?.metadata) return [];
    
    try {
      const metadata = JSON.parse(lastAssistantMessage.metadata);
      return metadata.quick_replies || [];
    } catch {
      return [];
    }
  };

  const quickReplies = getQuickReplies();

  return (
    <div className="flex flex-col h-screen bg-white relative">
      {/* Header */}
      <PartyHeader conversation={conversation} />

      {/* Messages Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 pb-2 pt-2 space-y-4 scroll-smooth"
        style={{ 
          paddingBottom: `${inputHeight + 80}px`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <style>{`.flex-1::-webkit-scrollbar { display: none; }`}</style>
        
        {messages.map((message, index) => (
          <div key={message.id} className="space-y-3">
            <MessageBubble 
              message={message} 
              isLatest={index === messages.length - 1}
            />
            
            {/* Rich content for assistant messages */}
            {message.role === 'assistant' && message.metadata && (
              <RichContent metadata={message.metadata} />
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start space-x-3 animate-fadeIn">
            <Avatar className="w-8 h-8 bg-blue-900 flex-shrink-0">
              <AvatarFallback className="text-white text-xs font-bold">
                🎉
              </AvatarFallback>
            </Avatar>
            <Card className="px-4 py-3 bg-gray-50 border-0 shadow-sm max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-900 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-900 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-900 rounded-full animate-bounce"></div>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {quickReplies.length > 0 && !isTyping && (
        <div className="px-4 pb-2">
          <QuickReplies 
            options={quickReplies} 
            onSelect={onQuickReply}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-area-bottom">
        <div className="flex items-end space-x-3 max-w-4xl mx-auto">
          {/* Additional Actions */}
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex-shrink-0 mb-1"
          >
            <Plus className="w-5 h-5" />
          </Button>

          {/* Input Field */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                adjustInputHeight();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-white placeholder:text-gray-500 max-h-32 overflow-y-auto"
              style={{ height: `${inputHeight}px` }}
              disabled={isTyping && !inputValue.trim()}
            />
            
            {/* Voice Input Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 bottom-2 w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="w-10 h-10 rounded-full bg-blue-900 hover:bg-blue-800 text-white flex-shrink-0 mb-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
