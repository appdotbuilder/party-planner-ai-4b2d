
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type UpdateConversationInput, type Conversation } from '../schema';
import { eq } from 'drizzle-orm';

export const updateConversation = async (input: UpdateConversationInput): Promise<Conversation> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof conversationsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.party_type !== undefined) {
      updateData.party_type = input.party_type;
    }
    if (input.city !== undefined) {
      updateData.city = input.city;
    }
    if (input.activity_preference !== undefined) {
      updateData.activity_preference = input.activity_preference;
    }
    if (input.party_name !== undefined) {
      updateData.party_name = input.party_name;
    }
    if (input.party_dates !== undefined) {
      updateData.party_dates = input.party_dates;
    }
    if (input.guest_count !== undefined) {
      updateData.guest_count = input.guest_count;
    }
    if (input.budget !== undefined) {
      updateData.budget = input.budget.toString(); // Convert number to string for numeric column
    }
    if (input.theme !== undefined) {
      updateData.theme = input.theme;
    }
    if (input.preferences !== undefined) {
      updateData.preferences = input.preferences;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Update conversation record
    const result = await db.update(conversationsTable)
      .set(updateData)
      .where(eq(conversationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Conversation with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const conversation = result[0];
    return {
      ...conversation,
      budget: conversation.budget ? parseFloat(conversation.budget) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Conversation update failed:', error);
    throw error;
  }
};
