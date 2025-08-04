
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable, messagesTable } from '../db/schema';
import { getConversationMessages } from '../handlers/get_conversation_messages';

describe('getConversationMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return messages for a conversation in chronological order', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      id: 'user-1'
    }).execute();

    await db.insert(conversationsTable).values({
      id: 'conv-1',
      user_id: 'user-1',
      status: 'active'
    }).execute();

    // Create messages with different timestamps
    const now = new Date();
    const earlier = new Date(now.getTime() - 10000); // 10 seconds earlier
    const later = new Date(now.getTime() + 10000); // 10 seconds later

    await db.insert(messagesTable).values([
      {
        id: 'msg-2',
        conversation_id: 'conv-1',
        role: 'assistant',
        content: 'Second message',
        message_type: 'text',
        created_at: later
      },
      {
        id: 'msg-1',
        conversation_id: 'conv-1',
        role: 'user',
        content: 'First message',
        message_type: 'text',
        created_at: earlier
      },
      {
        id: 'msg-3',
        conversation_id: 'conv-1',
        role: 'user',
        content: 'Third message',
        message_type: 'text',
        created_at: now
      }
    ]).execute();

    const messages = await getConversationMessages('conv-1');

    expect(messages).toHaveLength(3);
    
    // Verify chronological order (earliest first)
    expect(messages[0].content).toEqual('First message');
    expect(messages[1].content).toEqual('Third message');
    expect(messages[2].content).toEqual('Second message');
    
    // Verify all message fields are present
    messages.forEach(message => {
      expect(message.id).toBeDefined();
      expect(message.conversation_id).toEqual('conv-1');
      expect(message.role).toBeDefined();
      expect(message.content).toBeDefined();
      expect(message.message_type).toBeDefined();
      expect(message.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for conversation with no messages', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      id: 'user-1'
    }).execute();

    await db.insert(conversationsTable).values({
      id: 'conv-empty',
      user_id: 'user-1',
      status: 'active'
    }).execute();

    const messages = await getConversationMessages('conv-empty');

    expect(messages).toHaveLength(0);
    expect(Array.isArray(messages)).toBe(true);
  });

  it('should return empty array for non-existent conversation', async () => {
    const messages = await getConversationMessages('non-existent-conv');

    expect(messages).toHaveLength(0);
    expect(Array.isArray(messages)).toBe(true);
  });

  it('should only return messages for the specified conversation', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      id: 'user-1'
    }).execute();

    await db.insert(conversationsTable).values([
      {
        id: 'conv-1',
        user_id: 'user-1',
        status: 'active'
      },
      {
        id: 'conv-2',
        user_id: 'user-1',
        status: 'active'
      }
    ]).execute();

    // Create messages for different conversations
    await db.insert(messagesTable).values([
      {
        id: 'msg-conv1',
        conversation_id: 'conv-1',
        role: 'user',
        content: 'Message for conv-1',
        message_type: 'text'
      },
      {
        id: 'msg-conv2',
        conversation_id: 'conv-2',
        role: 'user',
        content: 'Message for conv-2',
        message_type: 'text'
      }
    ]).execute();

    const messages = await getConversationMessages('conv-1');

    expect(messages).toHaveLength(1);
    expect(messages[0].content).toEqual('Message for conv-1');
    expect(messages[0].conversation_id).toEqual('conv-1');
  });

  it('should handle messages with metadata and different types', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      id: 'user-1'
    }).execute();

    await db.insert(conversationsTable).values({
      id: 'conv-1',
      user_id: 'user-1',
      status: 'active'
    }).execute();

    const metadata = JSON.stringify({
      quick_replies: ['Yes', 'No'],
      rich_media: {
        images: ['image1.jpg']
      }
    });

    await db.insert(messagesTable).values([
      {
        id: 'msg-text',
        conversation_id: 'conv-1',
        role: 'user',
        content: 'Simple text message',
        message_type: 'text',
        metadata: null
      },
      {
        id: 'msg-rich',
        conversation_id: 'conv-1',
        role: 'assistant',
        content: 'Rich message with metadata',
        message_type: 'rich_media',
        metadata: metadata
      }
    ]).execute();

    const messages = await getConversationMessages('conv-1');

    expect(messages).toHaveLength(2);
    
    const textMessage = messages.find(m => m.message_type === 'text');
    const richMessage = messages.find(m => m.message_type === 'rich_media');
    
    expect(textMessage?.metadata).toBeNull();
    expect(richMessage?.metadata).toEqual(metadata);
    expect(richMessage?.role).toEqual('assistant');
  });
});
