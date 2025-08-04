
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { ChatInterface } from '@/components/ChatInterface';
import type { Conversation, Message, ChatResponse } from '../../server/src/schema';

// Fallback data for development when backend is not available
const createFallbackConversation = (userId: string): Conversation => ({
  id: `conv_${Date.now()}`,
  user_id: userId,
  party_type: null,
  city: null,
  activity_preference: null,
  party_name: null,
  party_dates: null,
  guest_count: null,
  budget: null,
  theme: null,
  preferences: null,
  status: 'active',
  created_at: new Date(),
  updated_at: new Date()
});

const createWelcomeMessage = (conversationId: string): Message => ({
  id: `msg_welcome_${Date.now()}`,
  conversation_id: conversationId,
  role: 'assistant',
  content: "🎉 Hey there! I'm your personal party planning AI assistant, and I'm SO excited to help you create the most EPIC bachelor or bachelorette party ever! ✨\n\nLet's start with the basics - what type of celebration are we planning?",
  message_type: 'text',
  metadata: JSON.stringify({
    quick_replies: ['Bachelor Party 🎩', 'Bachelorette Party 👰']
  }),
  created_at: new Date()
});

const createFallbackResponse = (conversationId: string, userMessage: string): ChatResponse => {
  const responseMessage: Message = {
    id: `msg_${Date.now()}`,
    conversation_id: conversationId,
    role: 'assistant',
    content: '',
    message_type: 'text',
    metadata: null,
    created_at: new Date()
  };

  // Handle different conversation flows
  if (userMessage.toLowerCase().includes('bachelor')) {
    responseMessage.content = "Awesome! A bachelor party - let's make this legendary! 🍻🎯\n\nNow, where do you want to party? I've got some amazing destinations that are perfect for bachelor parties:";
    responseMessage.metadata = JSON.stringify({
      quick_replies: ['Bangkok 🇹🇭', 'Pattaya 🏖️', 'Phuket 🌴']
    });
  } else if (userMessage.toLowerCase().includes('bachelorette')) {
    responseMessage.content = "YES! A bachelorette party - we're going to make this absolutely magical! 💃✨\n\nTime to pick your perfect party destination! Here are my top recommendations for an unforgettable bachelorette experience:";
    responseMessage.metadata = JSON.stringify({
      quick_replies: ['Bangkok 🇹🇭', 'Pattaya 🏖️', 'Phuket 🌴']
    });
  } else if (userMessage.toLowerCase().includes('bangkok')) {
    responseMessage.content = "Bangkok - excellent choice! The city of angels is absolutely PERFECT for partying! 🌃🍸\n\nWhat kind of vibe are you going for? I can create something totally customized for your crew:";
    responseMessage.metadata = JSON.stringify({
      quick_replies: ['Fun Activities 🎯', 'Full Package 📦', 'Epic Nightlife 🌃'],
      rich_media: {
        images: ['bangkok1.jpg', 'bangkok2.jpg'],
        activities: [
          {
            name: 'Sky Bar Rooftop Experience',
            description: 'Sip cocktails with breathtaking city views at one of Bangkok\'s most iconic rooftop bars',
            cost: 85
          },
          {
            name: 'Thai Cooking Class & Market Tour',
            description: 'Learn authentic Thai cooking with a fun group experience including market visit',
            cost: 65
          },
          {
            name: 'Khao San Road Pub Crawl',
            description: 'Epic nightlife adventure through Bangkok\'s most famous backpacker street',
            cost: 45
          }
        ]
      }
    });
  } else if (userMessage.toLowerCase().includes('pattaya')) {
    responseMessage.content = "Pattaya - oh WOW! Beach vibes meets crazy nightlife! 🏖️🎊\n\nThis place is going to be INSANE for your party! What's calling to you most?";
    responseMessage.metadata = JSON.stringify({
      quick_replies: ['Beach Activities 🏄‍♂️', 'VIP Package 🥂', 'Wild Nightlife 🕺'],
      rich_media: {
        images: ['pattaya1.jpg', 'pattaya2.jpg'],
        activities: [
          {
            name: 'Private Beach Club Day',
            description: 'VIP beach club experience with private cabana, unlimited drinks and water sports',
            cost: 120
          },
          {
            name: 'Jet Ski Adventure',
            description: 'Thrilling jet ski tour around Pattaya\'s beautiful coastline with stops at hidden beaches',
            cost: 75
          },
          {
            name: 'Walking Street VIP Tour',
            description: 'Skip-the-line access to the hottest clubs and bars on famous Walking Street',
            cost: 95
          }
        ]
      }
    });
  } else if (userMessage.toLowerCase().includes('phuket')) {
    responseMessage.content = "Phuket - you've got incredible taste! Tropical paradise meets world-class partying! 🌺🍹\n\nThis island is going to give you the most amazing memories! What sounds most exciting?";
    responseMessage.metadata = JSON.stringify({
      quick_replies: ['Island Adventures 🏝️', 'Luxury Package 💎', 'Beach Nightlife 🌊'],
      rich_media: {
        images: ['phuket1.jpg', 'phuket2.jpg'],
        activities: [
          {
            name: 'Private Yacht Day Trip',
            description: 'Luxury yacht charter to Phi Phi Islands with snorkeling, lunch and sunset views',
            cost: 200
          },
          {
            name: 'Bangla Road Party Tour',
            description: 'Guided nightlife tour through Patong\'s most exclusive venues with VIP treatment',
            cost: 110
          },
          {
            name: 'Thai Spa & Wellness Day',
            description: 'Relaxing spa day with traditional Thai massages and wellness treatments',
            cost: 90
          }
        ]
      }
    });
  } else if (userMessage.toLowerCase().includes('activities') || userMessage.toLowerCase().includes('fun')) {
    responseMessage.content = "Perfect! You want the full adventure experience! 🎯🎪\n\nI'm putting together an action-packed itinerary that'll have you and your crew making memories that'll last forever! Here's what I'm thinking:";
    responseMessage.metadata = JSON.stringify({
      rich_media: {
        itinerary: {
          day: 1,
          activities: [
            {
              time: '10:00 AM',
              activity: 'Welcome Brunch & Planning Session',
              location: 'Rooftop Restaurant',
              cost: 35
            },
            {
              time: '2:00 PM',
              activity: 'Adventure Activity (Zip-lining/Karting)',
              location: 'Adventure Park',
              cost: 65
            },
            {
              time: '6:00 PM',
              activity: 'Sunset Cocktails',
              location: 'Sky Bar',
              cost: 45
            },
            {
              time: '9:00 PM',
              activity: 'Group Dinner Experience',
              location: 'Local Hot Spot',
              cost: 55
            }
          ]
        }
      }
    });
  } else if (userMessage.toLowerCase().includes('package') || userMessage.toLowerCase().includes('full')) {
    responseMessage.content = "YES! The full VIP treatment - I love it! 📦✨\n\nWe're talking complete luxury here! Let me craft the ultimate all-inclusive experience for your squad:";
    responseMessage.metadata = JSON.stringify({
      rich_media: {
        itinerary: {
          day: 1,
          activities: [
            {
              time: '11:00 AM',
              activity: 'VIP Airport Pickup & Welcome',
              location: 'Private Transfer',
              cost: 75
            },
            {
              time: '1:00 PM',
              activity: 'Luxury Hotel Check-in & Champagne',
              location: '5-Star Resort',
              cost: 150
            },
            {
              time: '4:00 PM',
              activity: 'Private Spa Session',
              location: 'Resort Spa',
              cost: 120
            },
            {
              time: '8:00 PM',
              activity: 'Exclusive Dinner Experience',
              location: 'Michelin Restaurant',
              cost: 200
            }
          ]
        }
      }
    });
  } else if (userMessage.toLowerCase().includes('nightlife') || userMessage.toLowerCase().includes('wild')) {
    responseMessage.content = "OH MY GOD YES! You want to party HARD! 🌃🔥\n\nI'm talking about the most EPIC nightlife experience! Get ready for a night you'll never forget:";
    responseMessage.metadata = JSON.stringify({
      rich_media: {
        itinerary: {
          day: 1,
          activities: [
            {
              time: '7:00 PM',
              activity: 'Pre-Game Party Prep',
              location: 'Hotel Suite',
              cost: 25
            },
            {
              time: '9:00 PM',
              activity: 'VIP Club Entry & Table Service',
              location: 'Top Nightclub',
              cost: 180
            },
            {
              time: '12:00 AM',
              activity: 'Late Night Bar Crawl',
              location: 'Entertainment District',
              cost: 95
            },
            {
              time: '3:00 AM',
              activity: 'After-Party Karaoke',
              location: 'Private KTV Room',
              cost: 120
            }
          ]
        }
      }
    });
  } else {
    responseMessage.content = "That sounds amazing! Tell me more about what you're looking for - I want to make sure this party is absolutely PERFECT for you! 🎉\n\nWhat's the vibe you're going for?";
    responseMessage.metadata = JSON.stringify({
      quick_replies: ['Chill & Fun 😎', 'Wild & Crazy 🤪', 'Classy & Elegant 💎']
    });
  }

  return {
    message: responseMessage,
    is_streaming: false,
    next_prompt: undefined,
    auto_continue: false
  };
};

function App() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [currentUserId] = useState(`user_${Date.now()}`);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  
  // Initialize conversation on app start
  const initializeConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Try to connect to the real backend first with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        await trpc.healthcheck.query();
        clearTimeout(timeoutId);
        
        // Backend is available, proceed with real API calls
        await trpc.createUser.mutate({ id: currentUserId });
        const newConversation = await trpc.createConversation.mutate({
          user_id: currentUserId
        });
        setConversation(newConversation);
        
        const existingMessages = await trpc.getConversationMessages.query({
          conversationId: newConversation.id
        });
        
        if (existingMessages.length === 0) {
          const welcomeResponse = await trpc.processChatMessage.mutate({
            conversationId: newConversation.id,
            userMessage: 'start_conversation',
            messageType: 'text'
          });
          setMessages([welcomeResponse.message]);
        } else {
          setMessages(existingMessages);
        }
      } catch {
        // Backend is not available, use fallback data
        console.warn('Backend not available, using fallback data for development');
        setIsBackendAvailable(false);
        
        const fallbackConversation = createFallbackConversation(currentUserId);
        setConversation(fallbackConversation);
        
        const welcomeMessage = createWelcomeMessage(fallbackConversation.id);
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      
      // Fallback to alternative data if everything fails
      const fallbackConversation = createFallbackConversation(currentUserId);
      setConversation(fallbackConversation);
      
      const welcomeMessage = createWelcomeMessage(fallbackConversation.id);
      setMessages([welcomeMessage]);
      setIsBackendAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    initializeConversation();
  }, [initializeConversation]);

  const sendMessage = useCallback(async (
    content: string, 
    messageType: 'text' | 'quick_reply' = 'text',
    skipUserMessage: boolean = false
  ): Promise<void> => {
    if (!conversation) return;

    try {
      setIsTyping(true);
      
      // Add user message to chat (unless it's a quick reply auto-continue)
      if (!skipUserMessage) {
        const userMessage: Message = {
          id: `msg_${Date.now()}_user`,
          conversation_id: conversation.id,
          role: 'user',
          content,
          message_type: messageType,
          metadata: null,
          created_at: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
      }
      
      let response: ChatResponse;
      
      if (isBackendAvailable) {
        // Try real backend
        try {
          response = await trpc.processChatMessage.mutate({
            conversationId: conversation.id,
            userMessage: content,
            messageType
          });
        } catch {
          console.warn('Backend call failed, falling back to alternative response');
          setIsBackendAvailable(false);
          response = createFallbackResponse(conversation.id, content);
        }
      } else {
        // Use fallback response
        response = createFallbackResponse(conversation.id, content);
      }
      
      // Add AI response with typewriter effect
      if (response.is_streaming) {
        setMessages(prev => [...prev, response.message]);
        setIsTyping(false);
      } else {
        // Add message with typewriter effect
        const messageWithoutContent = { ...response.message, content: '' };
        setMessages(prev => [...prev, messageWithoutContent]);
        
        // Simulate typewriter effect
        let currentText = '';
        const fullText = response.message.content;
        const typingSpeed = 30; // Faster typing for better UX
        
        for (let i = 0; i <= fullText.length; i++) {
          currentText = fullText.slice(0, i);
          
          setTimeout(() => {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === response.message.id 
                  ? { ...msg, content: currentText }
                  : msg
              )
            );
            
            if (i === fullText.length) {
              setIsTyping(false);
              
              // Auto-continue if specified
              if (response.auto_continue && response.next_prompt) {
                setTimeout(() => {
                  sendMessage(response.next_prompt!, 'quick_reply', true);
                }, 1000);
              }
            }
          }, i * typingSpeed);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
      
      // Add error recovery message
      const errorMessage: Message = {
        id: `msg_error_${Date.now()}`,
        conversation_id: conversation.id,
        role: 'assistant',
        content: "Oops! Something went wrong, but I'm still here to help! 😅 Could you try that again?",
        message_type: 'text',
        metadata: null,
        created_at: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [conversation, isBackendAvailable]);

  const handleQuickReply = useCallback((reply: string) => {
    sendMessage(reply, 'quick_reply');
  }, [sendMessage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Starting your party planning journey...</p>
          {!isBackendAvailable && (
            <p className="text-xs text-gray-400">Running in demo mode</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ChatInterface
        messages={messages}
        onSendMessage={sendMessage}
        onQuickReply={handleQuickReply}
        isTyping={isTyping}
        conversation={conversation}
      />
      {!isBackendAvailable && (
        <div className="fixed top-0 left-0 right-0 bg-amber-50 border-b border-amber-200 px-4 py-2 text-center z-50 safe-area-top">
          <p className="text-xs text-amber-800">
            <span className="font-medium">Demo Mode:</span> Backend not connected - using fallback data for demonstration
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
