
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable, messagesTable } from '../db/schema';
import { processChatMessage } from '../handlers/process_chat_message';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

describe('processChatMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: string;
  let conversationId: string;

  beforeEach(async () => {
    // Create test user
    userId = randomUUID();
    await db.insert(usersTable).values({
      id: userId
    }).execute();

    // Create test conversation
    conversationId = randomUUID();
    await db.insert(conversationsTable).values({
      id: conversationId,
      user_id: userId,
      status: 'active'
    }).execute();
  });

  it('should save user message and return appropriate response for party type question', async () => {
    const result = await processChatMessage(conversationId, 'Hello');

    // Check user message was saved
    const userMessages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.role, 'user'))
      .execute();

    expect(userMessages).toHaveLength(1);
    expect(userMessages[0].content).toBe('Hello');
    expect(userMessages[0].conversation_id).toBe(conversationId);

    // Check assistant response
    expect(result.message.role).toBe('assistant');
    expect(result.message.content).toContain('What type of celebration');
    expect(result.message.message_type).toBe('quick_reply');
    expect(result.next_prompt).toContain('type of party');
    expect(result.is_streaming).toBe(false);

    // Check quick replies metadata
    const metadata = JSON.parse(result.message.metadata!);
    expect(metadata.quick_replies).toContain('Bachelor Party');
    expect(metadata.quick_replies).toContain('Bachelorette Party');
  });

  it('should progress through conversation flow correctly', async () => {
    // First message - party type
    let result = await processChatMessage(conversationId, 'Bachelor Party');
    expect(result.message.content).toContain('Which city');
    expect(result.message.message_type).toBe('quick_reply');

    // Verify party type was saved
    let conversation = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .execute();
    expect(conversation[0].party_type).toBe('bachelor');

    // Second message - city
    result = await processChatMessage(conversationId, 'Bangkok');
    expect(result.message.content).toContain('type of experience');

    // Verify city was saved
    conversation = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .execute();
    expect(conversation[0].city).toBe('bangkok');

    // Third message - activity preference
    result = await processChatMessage(conversationId, 'Adventure Activities');
    expect(result.message.content).toContain('call this party');

    // Verify activity preference was saved
    conversation = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .execute();
    expect(conversation[0].activity_preference).toBe('activities');
  });

  it('should handle guest count parsing correctly', async () => {
    // Set up conversation with required fields
    await db.update(conversationsTable)
      .set({
        party_type: 'bachelor',
        city: 'bangkok',
        activity_preference: 'activities',
        party_name: 'Test Party'
      })
      .where(eq(conversationsTable.id, conversationId))
      .execute();

    // Test valid guest count
    let result = await processChatMessage(conversationId, '8');
    expect(result.message.content).toContain('budget');

    // Verify guest count was saved
    let conversation = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .execute();
    expect(conversation[0].guest_count).toBe(8);

    // Reset conversation state for invalid test
    await db.update(conversationsTable)
      .set({ guest_count: null })
      .where(eq(conversationsTable.id, conversationId))
      .execute();

    // Test invalid guest count
    result = await processChatMessage(conversationId, 'not a number');
    expect(result.message.content).toContain('valid number');
    expect(result.next_prompt).toContain('How many people');
  });

  it('should handle budget parsing correctly', async () => {
    // Set up conversation state
    await db.update(conversationsTable)
      .set({
        party_type: 'bachelorette',
        city: 'phuket',
        activity_preference: 'nightlife',
        party_name: 'Girls Night',
        guest_count: 6
      })
      .where(eq(conversationsTable.id, conversationId))
      .execute();

    // Test valid budget
    let result = await processChatMessage(conversationId, '5000');
    expect(result.message.content).toContain('When are you planning');

    // Verify budget was saved (as string for numeric column)
    let conversation = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .execute();
    expect(parseFloat(conversation[0].budget!)).toBe(5000);

    // Reset conversation state for invalid test
    await db.update(conversationsTable)
      .set({ budget: null })
      .where(eq(conversationsTable.id, conversationId))
      .execute();

    // Test invalid budget
    result = await processChatMessage(conversationId, 'expensive');
    expect(result.message.content).toContain('valid budget');
  });

  it('should complete conversation and mark as finished', async () => {
    // Set up conversation with most fields filled
    await db.update(conversationsTable)
      .set({
        party_type: 'bachelor',
        city: 'pattaya',
        activity_preference: 'package',
        party_name: 'Epic Weekend',
        guest_count: 10,
        budget: '8000' // Insert as string for numeric column
      })
      .where(eq(conversationsTable.id, conversationId))
      .execute();

    // Final message - dates
    const result = await processChatMessage(conversationId, 'March 15-17');

    // Check completion response
    expect(result.message.content).toContain('Fantastic!');
    expect(result.message.content).toContain('Epic Weekend');
    expect(result.message.content).toContain('Bachelor Party');
    expect(result.message.content).toContain('Pattaya');
    expect(result.message.message_type).toBe('rich_media');
    expect(result.auto_continue).toBe(false);

    // Verify conversation was completed
    const conversation = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .execute();
    expect(conversation[0].status).toBe('completed');
    expect(conversation[0].party_dates).toBe('March 15-17');
  });

  it('should handle conversation not found error', async () => {
    const invalidId = randomUUID();
    
    await expect(
      processChatMessage(invalidId, 'test message')
    ).rejects.toThrow(/conversation not found/i);
  });

  it('should save both user and assistant messages', async () => {
    await processChatMessage(conversationId, 'Test message');

    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.conversation_id, conversationId))
      .execute();

    expect(messages).toHaveLength(2);
    
    const userMessage = messages.find(m => m.role === 'user');
    const assistantMessage = messages.find(m => m.role === 'assistant');

    expect(userMessage).toBeDefined();
    expect(userMessage!.content).toBe('Test message');
    expect(userMessage!.message_type).toBe('text');

    expect(assistantMessage).toBeDefined();
    expect(assistantMessage!.role).toBe('assistant');
    expect(assistantMessage!.created_at).toBeInstanceOf(Date);
  });
});
