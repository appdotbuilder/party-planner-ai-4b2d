
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Generate unique user ID if not provided
    const userId = input.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        id: userId
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
