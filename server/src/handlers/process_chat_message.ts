
import { db } from '../db';
import { conversationsTable, messagesTable } from '../db/schema';
import { type ChatResponse, type MessageMetadata } from '../schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function processChatMessage(
  conversationId: string, 
  userMessage: string, 
  messageType: 'text' | 'quick_reply' = 'text'
): Promise<ChatResponse> {
  try {
    // Get current conversation state first
    const conversations = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .execute();

    if (conversations.length === 0) {
      throw new Error('Conversation not found');
    }

    let conversation = conversations[0];

    // Save the user's message
    const userMessageId = randomUUID();
    await db.insert(messagesTable).values({
      id: userMessageId,
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
      message_type: messageType,
      metadata: null
    }).execute();

    // Determine next question and response based on conversation state
    let assistantResponse: string;
    let nextPrompt: string | undefined;
    let autoContinue = false;
    let responseMessageType: 'text' | 'quick_reply' | 'rich_media' | 'itinerary' = 'text';
    let metadata: MessageMetadata | null = null;
    let conversationUpdates: Partial<typeof conversation> = {};

    // Analyze what information we still need
    if (!conversation.party_type) {
      // Update party type based on user response if it looks like a party type answer
      if (userMessage.toLowerCase().includes('bachelor') && !userMessage.toLowerCase().includes('bachelorette')) {
        conversationUpdates.party_type = 'bachelor';
        conversation = { ...conversation, party_type: 'bachelor' };
      } else if (userMessage.toLowerCase().includes('bachelorette')) {
        conversationUpdates.party_type = 'bachelorette';
        conversation = { ...conversation, party_type: 'bachelorette' };
      }

      // If we still don't have party type, ask for it
      if (!conversation.party_type) {
        assistantResponse = "Welcome! I'm here to help you plan an amazing party. What type of celebration are you organizing?";
        responseMessageType = 'quick_reply';
        metadata = {
          quick_replies: ['Bachelor Party', 'Bachelorette Party']
        };
        nextPrompt = "Please select the type of party you're planning.";
      } else {
        // We just got the party type, ask for city
        assistantResponse = "Great choice! Which city would you like to celebrate in? Each destination offers unique experiences.";
        responseMessageType = 'quick_reply';
        metadata = {
          quick_replies: ['Bangkok', 'Pattaya', 'Phuket']
        };
        nextPrompt = "Please choose your destination city.";
      }
    } else if (!conversation.city) {
      // Update city based on user response
      const cityLower = userMessage.toLowerCase();
      if (cityLower.includes('bangkok')) {
        conversationUpdates.city = 'bangkok';
        conversation = { ...conversation, city: 'bangkok' };
      } else if (cityLower.includes('pattaya')) {
        conversationUpdates.city = 'pattaya';
        conversation = { ...conversation, city: 'pattaya' };
      } else if (cityLower.includes('phuket')) {
        conversationUpdates.city = 'phuket';
        conversation = { ...conversation, city: 'phuket' };
      }

      assistantResponse = `Perfect! ${conversation.city?.charAt(0).toUpperCase()}${conversation.city?.slice(1)} is an amazing destination. What type of experience are you looking for?`;
      responseMessageType = 'quick_reply';
      metadata = {
        quick_replies: ['Adventure Activities', 'Complete Package', 'Nightlife Focus']
      };
      nextPrompt = "What's your preferred style of celebration?";
    } else if (!conversation.activity_preference) {
      // Update activity preference
      const activityLower = userMessage.toLowerCase();
      if (activityLower.includes('activities') || activityLower.includes('adventure')) {
        conversationUpdates.activity_preference = 'activities';
      } else if (activityLower.includes('package') || activityLower.includes('complete')) {
        conversationUpdates.activity_preference = 'package';
      } else if (activityLower.includes('nightlife')) {
        conversationUpdates.activity_preference = 'nightlife';
      }

      assistantResponse = "Excellent! Now, what should we call this party? This will help personalize your experience.";
      nextPrompt = "Please enter a name for your party (e.g., 'John's Bachelor Bash', 'Sarah's Big Weekend').";
    } else if (!conversation.party_name) {
      // Save party name
      conversationUpdates.party_name = userMessage.trim();
      
      assistantResponse = `"${userMessage.trim()}" sounds like it's going to be epic! How many people will be joining the celebration?`;
      nextPrompt = "Please enter the number of guests (including yourself).";
    } else if (!conversation.guest_count) {
      // Parse and save guest count
      const guestCount = parseInt(userMessage.trim());
      if (!isNaN(guestCount) && guestCount > 0) {
        conversationUpdates.guest_count = guestCount;
        assistantResponse = `Perfect! For ${guestCount} ${guestCount === 1 ? 'person' : 'people'}, what's your budget range per person? This helps me recommend the best options.`;
        nextPrompt = "Please enter your budget per person (e.g., 5000, 10000).";
      } else {
        assistantResponse = "Please enter a valid number of guests (e.g., 8, 12).";
        nextPrompt = "How many people will be attending?";
      }
    } else if (!conversation.budget) {
      // Parse and save budget
      const budget = parseFloat(userMessage.replace(/[^0-9.]/g, ''));
      if (!isNaN(budget) && budget > 0) {
        conversationUpdates.budget = budget.toString(); // Convert number to string for numeric column
        assistantResponse = `Great! With a budget of ${budget} per person, we can create something amazing. When are you planning to celebrate?`;
        nextPrompt = "Please provide your preferred dates (e.g., 'March 15-17' or 'Next weekend').";
      } else {
        assistantResponse = "Please enter a valid budget amount (numbers only, e.g., 5000, 10000).";
        nextPrompt = "What's your budget per person?";
      }
    } else if (!conversation.party_dates) {
      // Save party dates and generate final response
      conversationUpdates.party_dates = userMessage.trim();
      conversationUpdates.status = 'completed';

      const partyType = conversation.party_type === 'bachelor' ? 'Bachelor' : 'Bachelorette';
      assistantResponse = `Fantastic! I have all the details for ${conversation.party_name}:\n\n` +
        `🎉 ${partyType} Party in ${conversation.city?.charAt(0).toUpperCase()}${conversation.city?.slice(1)}\n` +
        `👥 ${conversation.guest_count} guests\n` +
        `💰 ${conversation.budget ? parseFloat(conversation.budget.toString()) : 'Budget'} per person\n` +
        `📅 ${userMessage.trim()}\n` +
        `🎯 Focus: ${conversation.activity_preference}\n\n` +
        `I'm now preparing personalized recommendations for your group. You'll receive a detailed itinerary shortly!`;
      
      responseMessageType = 'rich_media';
      metadata = {
        rich_media: {
          activities: [
            {
              name: "Custom Itinerary",
              description: "Personalized recommendations being prepared",
              cost: conversation.budget ? parseFloat(conversation.budget.toString()) : undefined
            }
          ]
        }
      };
      autoContinue = false; // Conversation is complete
    } else {
      // Conversation is already complete
      assistantResponse = "Your party planning is complete! I'll be in touch with your personalized itinerary soon.";
      autoContinue = false;
    }

    // Update conversation if needed
    if (Object.keys(conversationUpdates).length > 0) {
      await db.update(conversationsTable)
        .set({
          ...conversationUpdates,
          updated_at: new Date()
        })
        .where(eq(conversationsTable.id, conversationId))
        .execute();
    }

    // Create and save assistant message
    const assistantMessageId = randomUUID();
    const metadataString = metadata ? JSON.stringify(metadata) : null;
    
    await db.insert(messagesTable).values({
      id: assistantMessageId,
      conversation_id: conversationId,
      role: 'assistant',
      content: assistantResponse,
      message_type: responseMessageType,
      metadata: metadataString
    }).execute();

    // Return the chat response
    return {
      message: {
        id: assistantMessageId,
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantResponse,
        message_type: responseMessageType,
        metadata: metadataString,
        created_at: new Date()
      },
      is_streaming: false,
      next_prompt: nextPrompt,
      auto_continue: autoContinue
    };

  } catch (error) {
    console.error('Chat message processing failed:', error);
    throw error;
  }
}
