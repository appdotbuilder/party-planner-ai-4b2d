
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type CreateConversationInput, type Conversation } from '../schema';

export const createConversation = async (input: CreateConversationInput): Promise<Conversation> => {
  try {
    // Generate unique conversation ID
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert conversation record
    const result = await db.insert(conversationsTable)
      .values({
        id: conversationId,
        user_id: input.user_id,
        party_type: input.party_type || null,
        city: input.city || null,
        activity_preference: input.activity_preference || null,
        budget: null, // Will be set later during conversation
        status: 'active'
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const conversation = result[0];
    return {
      ...conversation,
      budget: conversation.budget ? parseFloat(conversation.budget) : null
    };
  } catch (error) {
    console.error('Conversation creation failed:', error);
    throw error;
  }
};
