
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type CreateMessageInput, type Message } from '../schema';

export const createMessage = async (input: CreateMessageInput): Promise<Message> => {
  try {
    // Generate unique message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert message record
    const result = await db.insert(messagesTable)
      .values({
        id: messageId,
        conversation_id: input.conversation_id,
        role: input.role,
        content: input.content,
        message_type: input.message_type,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null
      })
      .returning()
      .execute();

    const message = result[0];
    return message;
  } catch (error) {
    console.error('Message creation failed:', error);
    throw error;
  }
};
