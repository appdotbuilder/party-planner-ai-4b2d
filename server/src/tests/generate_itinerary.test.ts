
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable, messagesTable } from '../db/schema';
import { generateItinerary } from '../handlers/generate_itinerary';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

describe('generateItinerary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate itinerary for basic conversation', async () => {
    // Create test user
    const userId = nanoid();
    await db.insert(usersTable)
      .values({ id: userId })
      .execute();

    // Create test conversation
    const conversationId = nanoid();
    await db.insert(conversationsTable)
      .values({
        id: conversationId,
        user_id: userId,
        party_type: 'bachelor',
        city: 'bangkok',
        activity_preference: 'nightlife',
        status: 'active'
      })
      .execute();

    const result = await generateItinerary(conversationId);

    // Verify message structure
    expect(result.id).toBeDefined();
    expect(result.conversation_id).toEqual(conversationId);
    expect(result.role).toEqual('assistant');
    expect(result.message_type).toEqual('itinerary');
    expect(result.content).toContain('Bachelor Party itinerary');
    expect(result.content).toContain('Bangkok');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.metadata).toBeDefined();

    // Verify metadata structure
    const metadata = JSON.parse(result.metadata!);
    expect(metadata.rich_media).toBeDefined();
    expect(metadata.rich_media.images).toBeInstanceOf(Array);
    expect(metadata.rich_media.activities).toBeInstanceOf(Array);
    expect(metadata.rich_media.itinerary).toBeDefined();
    expect(metadata.rich_media.itinerary.day).toEqual(1);
    expect(metadata.rich_media.itinerary.activities).toBeInstanceOf(Array);

    // Verify activities have required fields
    const activities = metadata.rich_media.itinerary.activities;
    expect(activities.length).toBeGreaterThan(0);
    activities.forEach((activity: any) => {
      expect(activity.time).toBeDefined();
      expect(activity.activity).toBeDefined();
      expect(activity.location).toBeDefined();
      expect(typeof activity.cost).toEqual('number');
    });
  });

  it('should save message to database', async () => {
    // Create test user and conversation
    const userId = nanoid();
    await db.insert(usersTable)
      .values({ id: userId })
      .execute();

    const conversationId = nanoid();
    await db.insert(conversationsTable)
      .values({
        id: conversationId,
        user_id: userId,
        party_type: 'bachelorette',
        city: 'phuket',
        activity_preference: 'activities',
        status: 'active'
      })
      .execute();

    const result = await generateItinerary(conversationId);

    // Verify message was saved to database
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].conversation_id).toEqual(conversationId);
    expect(messages[0].role).toEqual('assistant');
    expect(messages[0].message_type).toEqual('itinerary');
    expect(messages[0].metadata).toBeDefined();
  });

  it('should generate different content for different cities', async () => {
    // Create test user
    const userId = nanoid();
    await db.insert(usersTable)
      .values({ id: userId })
      .execute();

    // Test Bangkok
    const bangkokConversationId = nanoid();
    await db.insert(conversationsTable)
      .values({
        id: bangkokConversationId,
        user_id: userId,
        city: 'bangkok',
        status: 'active'
      })
      .execute();

    const bangkokResult = await generateItinerary(bangkokConversationId);

    // Test Pattaya
    const pattayaConversationId = nanoid();
    await db.insert(conversationsTable)
      .values({
        id: pattayaConversationId,
        user_id: userId,
        city: 'pattaya',
        status: 'active'
      })
      .execute();

    const pattayaResult = await generateItinerary(pattayaConversationId);

    // Verify different content for different cities
    expect(bangkokResult.content).toContain('Bangkok');
    expect(pattayaResult.content).toContain('Pattaya');
    
    const bangkokMetadata = JSON.parse(bangkokResult.metadata!);
    const pattayaMetadata = JSON.parse(pattayaResult.metadata!);
    
    // Images should be different
    expect(bangkokMetadata.rich_media.images[0]).not.toEqual(pattayaMetadata.rich_media.images[0]);
  });

  it('should handle conversation with full details', async () => {
    // Create test user
    const userId = nanoid();
    await db.insert(usersTable)
      .values({ id: userId })
      .execute();

    // Create detailed conversation
    const conversationId = nanoid();
    await db.insert(conversationsTable)
      .values({
        id: conversationId,
        user_id: userId,
        party_type: 'bachelor',
        city: 'bangkok',
        activity_preference: 'package',
        party_name: 'John\'s Epic Weekend',
        guest_count: 12,
        budget: '15000.50',
        theme: 'Traditional Thai',
        status: 'active'
      })
      .execute();

    const result = await generateItinerary(conversationId);

    // Verify content includes party name
    expect(result.content).toContain('John\'s Epic Weekend');
    expect(result.content).toContain('Bachelor Party');

    // Verify metadata uses budget and guest count for cost calculations
    const metadata = JSON.parse(result.metadata!);
    const activities = metadata.rich_media.itinerary.activities;
    
    // Costs should be reasonable per person (budget/guest_count based)
    activities.forEach((activity: any) => {
      expect(activity.cost).toBeGreaterThan(0);
      expect(activity.cost).toBeLessThan(2000); // Reasonable per-person cost
    });
  });

  it('should throw error for non-existent conversation', async () => {
    const nonExistentId = nanoid();
    
    await expect(generateItinerary(nonExistentId)).rejects.toThrow(/not found/i);
  });

  it('should generate activities based on preference type', async () => {
    // Create test user
    const userId = nanoid();
    await db.insert(usersTable)
      .values({ id: userId })
      .execute();

    // Test nightlife preference
    const nightlifeConversationId = nanoid();
    await db.insert(conversationsTable)
      .values({
        id: nightlifeConversationId,
        user_id: userId,
        city: 'bangkok',
        activity_preference: 'nightlife',
        status: 'active'
      })
      .execute();

    const nightlifeResult = await generateItinerary(nightlifeConversationId);
    const nightlifeMetadata = JSON.parse(nightlifeResult.metadata!);

    // Test activities preference
    const activitiesConversationId = nanoid();
    await db.insert(conversationsTable)
      .values({
        id: activitiesConversationId,
        user_id: userId,
        city: 'bangkok',
        activity_preference: 'activities',
        status: 'active'
      })
      .execute();

    const activitiesResult = await generateItinerary(activitiesConversationId);
    const activitiesMetadata = JSON.parse(activitiesResult.metadata!);

    // Activities should be different based on preference
    const nightlifeActivities = nightlifeMetadata.rich_media.activities;
    const dayActivities = activitiesMetadata.rich_media.activities;

    expect(nightlifeActivities[0].name).not.toEqual(dayActivities[0].name);
    
    // Verify nightlife activities contain night-related terms
    const nightlifeActivityNames = nightlifeActivities.map((a: any) => a.name.toLowerCase()).join(' ');
    expect(nightlifeActivityNames).toMatch(/(bar|club|night|rooftop)/i);
  });
});
