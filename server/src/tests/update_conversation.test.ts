
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable } from '../db/schema';
import { type UpdateConversationInput } from '../schema';
import { updateConversation } from '../handlers/update_conversation';
import { eq } from 'drizzle-orm';

describe('updateConversation', () => {
  let testUserId: string;
  let testConversationId: string;

  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        id: 'test-user-id'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test conversation
    const conversationResult = await db.insert(conversationsTable)
      .values({
        id: 'test-conversation-id',
        user_id: testUserId,
        status: 'active'
      })
      .returning()
      .execute();
    testConversationId = conversationResult[0].id;
  });

  afterEach(resetDB);

  it('should update conversation basic fields', async () => {
    const input: UpdateConversationInput = {
      id: testConversationId,
      party_type: 'bachelor',
      city: 'bangkok',
      activity_preference: 'nightlife'
    };

    const result = await updateConversation(input);

    expect(result.id).toEqual(testConversationId);
    expect(result.party_type).toEqual('bachelor');
    expect(result.city).toEqual('bangkok');
    expect(result.activity_preference).toEqual('nightlife');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update conversation party details', async () => {
    const input: UpdateConversationInput = {
      id: testConversationId,
      party_name: 'John\'s Bachelor Party',
      party_dates: '{"start": "2024-06-15", "end": "2024-06-17"}',
      guest_count: 8,
      budget: 50000.00,
      theme: 'Vegas Style'
    };

    const result = await updateConversation(input);

    expect(result.party_name).toEqual('John\'s Bachelor Party');
    expect(result.party_dates).toEqual('{"start": "2024-06-15", "end": "2024-06-17"}');
    expect(result.guest_count).toEqual(8);
    expect(result.budget).toEqual(50000.00);
    expect(typeof result.budget).toEqual('number');
    expect(result.theme).toEqual('Vegas Style');
  });

  it('should update conversation preferences and status', async () => {
    const input: UpdateConversationInput = {
      id: testConversationId,
      preferences: '{"dietary_restrictions": ["vegetarian"], "accessibility": ["wheelchair"]}',
      status: 'completed'
    };

    const result = await updateConversation(input);

    expect(result.preferences).toEqual('{"dietary_restrictions": ["vegetarian"], "accessibility": ["wheelchair"]}');
    expect(result.status).toEqual('completed');
  });

  it('should save updated conversation to database', async () => {
    const input: UpdateConversationInput = {
      id: testConversationId,
      party_type: 'bachelorette',
      city: 'phuket',
      budget: 25000.50
    };

    const result = await updateConversation(input);

    // Query database to verify changes
    const conversations = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, testConversationId))
      .execute();

    expect(conversations).toHaveLength(1);
    expect(conversations[0].party_type).toEqual('bachelorette');
    expect(conversations[0].city).toEqual('phuket');
    expect(parseFloat(conversations[0].budget!)).toEqual(25000.50);
    expect(conversations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null values correctly', async () => {
    // First set some values
    await updateConversation({
      id: testConversationId,
      party_name: 'Test Party',
      theme: 'Test Theme'
    });

    // Then set them to null
    const input: UpdateConversationInput = {
      id: testConversationId,
      party_name: null,
      theme: null
    };

    const result = await updateConversation(input);

    expect(result.party_name).toBeNull();
    expect(result.theme).toBeNull();
  });

  it('should update only provided fields', async () => {
    // Set initial values
    await updateConversation({
      id: testConversationId,
      party_type: 'bachelor',
      city: 'bangkok',
      party_name: 'Original Party'
    });

    // Update only city
    const input: UpdateConversationInput = {
      id: testConversationId,
      city: 'phuket'
    };

    const result = await updateConversation(input);

    expect(result.party_type).toEqual('bachelor'); // Should remain unchanged
    expect(result.city).toEqual('phuket'); // Should be updated
    expect(result.party_name).toEqual('Original Party'); // Should remain unchanged
  });

  it('should throw error for non-existent conversation', async () => {
    const input: UpdateConversationInput = {
      id: 'non-existent-id',
      party_type: 'bachelor'
    };

    await expect(updateConversation(input)).rejects.toThrow(/not found/i);
  });
});
