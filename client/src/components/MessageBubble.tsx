
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { User } from 'lucide-react';
import type { Message } from '../../../server/src/schema';

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <Badge variant="secondary" className="text-xs text-gray-500 bg-gray-100 px-3 py-1">
          {message.content}
        </Badge>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''} animate-fadeIn`}>
      {/* Avatar */}
      {!isUser && (
        <Avatar className="w-8 h-8 bg-blue-900 flex-shrink-0">
          <AvatarFallback className="text-white text-xs font-bold">
            🎉
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-md ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message Bubble */}
        <Card className={`px-4 py-3 border-0 shadow-sm transition-all duration-200 ${
          isUser 
            ? 'bg-blue-900 text-white rounded-2xl rounded-br-md' 
            : 'bg-gray-50 text-gray-900 rounded-2xl rounded-bl-md hover:shadow-md'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </Card>

        {/* Timestamp */}
        <p className={`text-xs text-gray-400 mt-1 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatDistanceToNow(message.created_at, { addSuffix: true })}
        </p>
      </div>

      {/* User Avatar */}
      {isUser && (
        <Avatar className="w-8 h-8 bg-gray-200 flex-shrink-0">
          <AvatarFallback>
            <User className="w-4 h-4 text-gray-600" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
