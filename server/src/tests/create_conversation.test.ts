
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable, usersTable } from '../db/schema';
import { type CreateConversationInput } from '../schema';
import { createConversation } from '../handlers/create_conversation';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateConversationInput = {
  user_id: 'user_123',
  party_type: 'bachelor',
  city: 'bangkok',
  activity_preference: 'nightlife'
};

describe('createConversation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a conversation with required fields', async () => {
    // Create prerequisite user first
    await db.insert(usersTable)
      .values({
        id: 'user_123'
      })
      .execute();

    const result = await createConversation(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('user_123');
    expect(result.party_type).toEqual('bachelor');
    expect(result.city).toEqual('bangkok');
    expect(result.activity_preference).toEqual('nightlife');
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
    expect(result.id).toMatch(/^conv_\d+_[a-z0-9]+$/);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Nullable fields should be null initially
    expect(result.party_name).toBeNull();
    expect(result.party_dates).toBeNull();
    expect(result.guest_count).toBeNull();
    expect(result.budget).toBeNull();
    expect(result.theme).toBeNull();
    expect(result.preferences).toBeNull();
  });

  it('should create a conversation with minimal input', async () => {
    // Create prerequisite user first
    await db.insert(usersTable)
      .values({
        id: 'user_minimal'
      })
      .execute();

    const minimalInput: CreateConversationInput = {
      user_id: 'user_minimal'
    };

    const result = await createConversation(minimalInput);

    expect(result.user_id).toEqual('user_minimal');
    expect(result.party_type).toBeNull();
    expect(result.city).toBeNull();
    expect(result.activity_preference).toBeNull();
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
  });

  it('should save conversation to database', async () => {
    // Create prerequisite user first
    await db.insert(usersTable)
      .values({
        id: 'user_123'
      })
      .execute();

    const result = await createConversation(testInput);

    // Query using proper drizzle syntax
    const conversations = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, result.id))
      .execute();

    expect(conversations).toHaveLength(1);
    expect(conversations[0].user_id).toEqual('user_123');
    expect(conversations[0].party_type).toEqual('bachelor');
    expect(conversations[0].city).toEqual('bangkok');
    expect(conversations[0].activity_preference).toEqual('nightlife');
    expect(conversations[0].status).toEqual('active');
    expect(conversations[0].created_at).toBeInstanceOf(Date);
    expect(conversations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique conversation IDs', async () => {
    // Create prerequisite user first
    await db.insert(usersTable)
      .values({
        id: 'user_unique'
      })
      .execute();

    const input: CreateConversationInput = {
      user_id: 'user_unique'
    };

    const result1 = await createConversation(input);
    const result2 = await createConversation(input);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.id).toMatch(/^conv_\d+_[a-z0-9]+$/);
    expect(result2.id).toMatch(/^conv_\d+_[a-z0-9]+$/);
  });

  it('should throw error for non-existent user', async () => {
    const invalidInput: CreateConversationInput = {
      user_id: 'non_existent_user'
    };

    await expect(createConversation(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
