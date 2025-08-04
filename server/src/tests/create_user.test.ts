
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with provided ID', async () => {
    const testInput: CreateUserInput = {
      id: 'test_user_123'
    };

    const result = await createUser(testInput);

    // Basic field validation
    expect(result.id).toEqual('test_user_123');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user with generated ID when not provided', async () => {
    const testInput: CreateUserInput = {};

    const result = await createUser(testInput);

    // ID should be generated
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
    expect(result.id).toMatch(/^user_\d+_[a-z0-9]+$/);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const testInput: CreateUserInput = {
      id: 'test_user_456'
    };

    const result = await createUser(testInput);

    // Query database to verify persistence
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].id).toEqual('test_user_456');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for multiple users', async () => {
    const testInput: CreateUserInput = {};

    const user1 = await createUser(testInput);
    const user2 = await createUser(testInput);

    // IDs should be different
    expect(user1.id).not.toEqual(user2.id);
    expect(user1.id).toBeDefined();
    expect(user2.id).toBeDefined();

    // Both should be saved to database
    const users = await db.select()
      .from(usersTable)
      .execute();

    expect(users).toHaveLength(2);
    expect(users.map(u => u.id)).toContain(user1.id);
    expect(users.map(u => u.id)).toContain(user2.id);
  });
});
