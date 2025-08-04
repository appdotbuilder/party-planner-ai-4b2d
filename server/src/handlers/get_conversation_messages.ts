
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type Message } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  try {
    const results = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.conversation_id, conversationId))
      .orderBy(asc(messagesTable.created_at))
      .execute();

    // Convert numeric fields back to numbers where needed
    return results.map(message => ({
      ...message,
      created_at: message.created_at // Already a Date object from timestamp column
    }));
  } catch (error) {
    console.error('Failed to fetch conversation messages:', error);
    throw error;
  }
}
