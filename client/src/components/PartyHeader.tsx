
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal } from 'lucide-react';
import type { Conversation } from '../../../server/src/schema';

interface PartyHeaderProps {
  conversation: Conversation | null;
}

export function PartyHeader({ conversation }: PartyHeaderProps) {
  const getPartyEmoji = (type: string | null) => {
    switch (type) {
      case 'bachelor': return '🎩';
      case 'bachelorette': return '👰';
      default: return '🎉';
    }
  };

  const getCityFlag = (city: string | null) => {
    switch (city) {
      case 'bangkok': return '🇹🇭';
      case 'pattaya': return '🏖️';
      case 'phuket': return '🌴';
      default: return '📍';
    }
  };

  const getActivityIcon = (preference: string | null) => {
    switch (preference) {
      case 'activities': return '🎯';
      case 'package': return '📦';
      case 'nightlife': return '🌃';
      default: return '🎊';
    }
  };

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3 safe-area-top sticky top-0 z-10 backdrop-blur-sm bg-white/95">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Left Side - Bot Info */}
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-900 to-purple-900">
            <AvatarFallback className="text-white font-bold">
              🎉
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 text-sm">
              Party Planner AI
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-xs text-gray-500">Online • Planning your perfect party</p>
            </div>
          </div>
        </div>

        {/* Right Side - Party Details & Menu */}
        <div className="flex items-center space-x-2">
          {/* Party Details */}
          {conversation && (
            <div className="hidden sm:flex items-center space-x-2">
              {conversation.party_type && (
                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-900">
                  {getPartyEmoji(conversation.party_type)} {conversation.party_type}
                </Badge>
              )}
              {conversation.city && (
                <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-900">
                  {getCityFlag(conversation.city)} {conversation.city}
                </Badge>
              )}
              {conversation.activity_preference && (
                <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-900">
                  {getActivityIcon(conversation.activity_preference)} {conversation.activity_preference}
                </Badge>
              )}
            </div>
          )}

          {/* Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Party Details */}
      {conversation && (
        <div className="flex sm:hidden items-center justify-center space-x-2 mt-2 pt-2 border-t border-gray-50">
          {conversation.party_type && (
            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-900">
              {getPartyEmoji(conversation.party_type)} {conversation.party_type}
            </Badge>
          )}
          {conversation.city && (
            <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-900">
              {getCityFlag(conversation.city)} {conversation.city}
            </Badge>
          )}
          {conversation.activity_preference && (
            <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-900">
              {getActivityIcon(conversation.activity_preference)} {conversation.activity_preference}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
