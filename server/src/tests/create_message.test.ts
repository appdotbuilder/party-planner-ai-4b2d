
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable, messagesTable } from '../db/schema';
import { type CreateMessageInput } from '../schema';
import { createMessage } from '../handlers/create_message';
import { eq } from 'drizzle-orm';

describe('createMessage', () => {
  let testUserId: string;
  let testConversationId: string;

  beforeEach(async () => {
    await createDB();
    
    // Create test user first
    testUserId = 'test_user_123';
    await db.insert(usersTable)
      .values({
        id: testUserId
      })
      .execute();

    // Create test conversation
    testConversationId = 'test_conversation_123';
    await db.insert(conversationsTable)
      .values({
        id: testConversationId,
        user_id: testUserId,
        status: 'active'
      })
      .execute();
  });

  afterEach(resetDB);

  it('should create a text message', async () => {
    const testInput: CreateMessageInput = {
      conversation_id: testConversationId,
      role: 'user',
      content: 'Hello, I want to plan a bachelor party',
      message_type: 'text'
    };

    const result = await createMessage(testInput);

    // Basic field validation
    expect(result.conversation_id).toEqual(testConversationId);
    expect(result.role).toEqual('user');
    expect(result.content).toEqual('Hello, I want to plan a bachelor party');
    expect(result.message_type).toEqual('text');
    expect(result.metadata).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a message with metadata', async () => {
    const metadata = {
      quick_replies: ['Bangkok', 'Pattaya', 'Phuket'],
      rich_media: {
        images: ['https://example.com/image1.jpg']
      }
    };

    const testInput: CreateMessageInput = {
      conversation_id: testConversationId,
      role: 'assistant',
      content: 'Which city would you like to visit?',
      message_type: 'quick_reply',
      metadata
    };

    const result = await createMessage(testInput);

    expect(result.conversation_id).toEqual(testConversationId);
    expect(result.role).toEqual('assistant');
    expect(result.content).toEqual('Which city would you like to visit?');
    expect(result.message_type).toEqual('quick_reply');
    expect(result.metadata).toEqual(JSON.stringify(metadata));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save message to database', async () => {
    const testInput: CreateMessageInput = {
      conversation_id: testConversationId,
      role: 'system',
      content: 'Welcome to the party planner!',
      message_type: 'text'
    };

    const result = await createMessage(testInput);

    // Query database to verify message was saved
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].conversation_id).toEqual(testConversationId);
    expect(messages[0].role).toEqual('system');
    expect(messages[0].content).toEqual('Welcome to the party planner!');
    expect(messages[0].message_type).toEqual('text');
    expect(messages[0].metadata).toBeNull();
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should create rich media message with itinerary', async () => {
    const metadata = {
      rich_media: {
        itinerary: {
          day: 1,
          activities: [
            {
              time: '10:00 AM',
              activity: 'City Tour',
              location: 'Bangkok City Center',
              cost: 1500
            },
            {
              time: '2:00 PM',
              activity: 'Temple Visit',
              location: 'Wat Pho',
              cost: 500
            }
          ]
        }
      }
    };

    const testInput: CreateMessageInput = {
      conversation_id: testConversationId,
      role: 'assistant',
      content: 'Here is your day 1 itinerary:',
      message_type: 'itinerary',
      metadata
    };

    const result = await createMessage(testInput);

    expect(result.message_type).toEqual('itinerary');
    expect(result.metadata).toEqual(JSON.stringify(metadata));
    
    // Verify metadata can be parsed back correctly
    const parsedMetadata = JSON.parse(result.metadata!);
    expect(parsedMetadata.rich_media.itinerary.day).toEqual(1);
    expect(parsedMetadata.rich_media.itinerary.activities).toHaveLength(2);
    expect(parsedMetadata.rich_media.itinerary.activities[0].cost).toEqual(1500);
  });

  it('should generate unique message IDs', async () => {
    const testInput: CreateMessageInput = {
      conversation_id: testConversationId,
      role: 'user',
      content: 'Test message',
      message_type: 'text'
    };

    const result1 = await createMessage(testInput);
    const result2 = await createMessage(testInput);

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);
  });
});
