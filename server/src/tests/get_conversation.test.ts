
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable, usersTable } from '../db/schema';
import { getConversation } from '../handlers/get_conversation';

describe('getConversation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return conversation when it exists', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({ id: 'user-1' })
      .execute();

    // Create test conversation
    const conversationData = {
      id: 'conv-1',
      user_id: 'user-1',
      party_type: 'bachelor' as const,
      city: 'bangkok' as const,
      activity_preference: 'nightlife' as const,
      party_name: 'Johns Bachelor Party',
      party_dates: '{"start": "2024-06-01", "end": "2024-06-03"}',
      guest_count: 8,
      budget: '5000.50',
      theme: 'Vegas Style',
      preferences: '{"music": "rock", "drinks": "whiskey"}',
      status: 'active' as const
    };

    await db.insert(conversationsTable)
      .values(conversationData)
      .execute();

    const result = await getConversation('conv-1');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('conv-1');
    expect(result!.user_id).toEqual('user-1');
    expect(result!.party_type).toEqual('bachelor');
    expect(result!.city).toEqual('bangkok');
    expect(result!.activity_preference).toEqual('nightlife');
    expect(result!.party_name).toEqual('Johns Bachelor Party');
    expect(result!.party_dates).toEqual('{"start": "2024-06-01", "end": "2024-06-03"}');
    expect(result!.guest_count).toEqual(8);
    expect(result!.budget).toEqual(5000.50);
    expect(typeof result!.budget).toEqual('number');
    expect(result!.theme).toEqual('Vegas Style');
    expect(result!.preferences).toEqual('{"music": "rock", "drinks": "whiskey"}');
    expect(result!.status).toEqual('active');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when conversation does not exist', async () => {
    const result = await getConversation('non-existent-id');
    expect(result).toBeNull();
  });

  it('should handle conversation with null optional fields', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({ id: 'user-2' })
      .execute();

    // Create minimal conversation with null optional fields
    await db.insert(conversationsTable)
      .values({
        id: 'conv-minimal',
        user_id: 'user-2',
        status: 'active'
      })
      .execute();

    const result = await getConversation('conv-minimal');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('conv-minimal');
    expect(result!.user_id).toEqual('user-2');
    expect(result!.party_type).toBeNull();
    expect(result!.city).toBeNull();
    expect(result!.activity_preference).toBeNull();
    expect(result!.party_name).toBeNull();
    expect(result!.party_dates).toBeNull();
    expect(result!.guest_count).toBeNull();
    expect(result!.budget).toBeNull();
    expect(result!.theme).toBeNull();
    expect(result!.preferences).toBeNull();
    expect(result!.status).toEqual('active');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});
