
import { db } from '../db';
import { conversationsTable, messagesTable } from '../db/schema';
import { type Message, type MessageMetadata } from '../schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function generateItinerary(conversationId: string): Promise<Message> {
  try {
    // Fetch conversation details to understand preferences
    const conversation = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .execute();

    if (conversation.length === 0) {
      throw new Error(`Conversation with id ${conversationId} not found`);
    }

    const conv = conversation[0];
    
    // Generate itinerary based on conversation data
    const itineraryMetadata = generateItineraryMetadata(conv);
    const content = generateItineraryContent(conv);

    // Create the message
    const messageId = nanoid();
    const messageData = {
      id: messageId,
      conversation_id: conversationId,
      role: 'assistant' as const,
      content,
      message_type: 'itinerary' as const,
      metadata: JSON.stringify(itineraryMetadata),
      created_at: new Date()
    };

    // Insert message into database
    const result = await db.insert(messagesTable)
      .values(messageData)
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Itinerary generation failed:', error);
    throw error;
  }
}

function generateItineraryContent(conversation: any): string {
  const partyType = conversation.party_type || 'bachelor';
  const city = conversation.city || 'bangkok';
  const partyName = conversation.party_name || 'the party';
  
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  const partyTypeDisplay = partyType === 'bachelor' ? 'Bachelor' : 'Bachelorette';
  
  return `Here's your personalized ${partyTypeDisplay} Party itinerary for ${partyName} in ${cityName}! 🎉 Get ready for an unforgettable experience!`;
}

function generateItineraryMetadata(conversation: any): MessageMetadata {
  const city = conversation.city || 'bangkok';
  const partyType = conversation.party_type || 'bachelor';
  const activityPreference = conversation.activity_preference || 'nightlife';
  const budget = conversation.budget ? parseFloat(conversation.budget) : 5000;
  const guestCount = conversation.guest_count || 8;

  // Generate activities based on preferences
  const activities = generateActivitiesForCity(city, partyType, activityPreference, budget, guestCount);
  
  return {
    rich_media: {
      images: getCityImages(city),
      activities: activities.slice(0, 3), // Show top 3 activities as highlights
      itinerary: {
        day: 1,
        activities: activities.map((activity, index) => ({
          time: getTimeSlot(index),
          activity: activity.name,
          location: activity.description,
          cost: activity.cost
        }))
      }
    }
  };
}

function generateActivitiesForCity(city: string, partyType: string, preference: string, budget: number, guestCount: number) {
  const baseActivities = {
    bangkok: {
      nightlife: [
        { name: 'Sky Bar Experience', description: 'Lebua State Tower', cost: Math.round(budget * 0.15 / guestCount) },
        { name: 'Khao San Road Crawl', description: 'Street Food & Bars', cost: Math.round(budget * 0.1 / guestCount) },
        { name: 'Rooftop Club Night', description: 'Octave Rooftop Bar', cost: Math.round(budget * 0.2 / guestCount) },
        { name: 'Tuk-Tuk Night Tour', description: 'Temple & Market Tour', cost: Math.round(budget * 0.08 / guestCount) }
      ],
      activities: [
        { name: 'Thai Cooking Class', description: 'Authentic Local Experience', cost: Math.round(budget * 0.12 / guestCount) },
        { name: 'Floating Market Visit', description: 'Damnoen Saduak Market', cost: Math.round(budget * 0.1 / guestCount) },
        { name: 'Temple Hopping Tour', description: 'Wat Pho & Grand Palace', cost: Math.round(budget * 0.15 / guestCount) },
        { name: 'Chao Phraya River Cruise', description: 'Sunset Dinner Cruise', cost: Math.round(budget * 0.18 / guestCount) }
      ],
      package: [
        { name: 'VIP Party Package', description: 'All-Inclusive Night Out', cost: Math.round(budget * 0.4 / guestCount) },
        { name: 'Cultural Experience Day', description: 'Temples + Cooking + Markets', cost: Math.round(budget * 0.25 / guestCount) },
        { name: 'Adventure Day Trip', description: 'Ayutthaya Historical Park', cost: Math.round(budget * 0.2 / guestCount) }
      ]
    },
    pattaya: {
      nightlife: [
        { name: 'Walking Street Party', description: 'Famous Nightlife District', cost: Math.round(budget * 0.12 / guestCount) },
        { name: 'Beach Club Experience', description: 'Beach Road Clubs', cost: Math.round(budget * 0.18 / guestCount) },
        { name: 'Cabaret Show', description: 'Tiffany\'s or Alcazar', cost: Math.round(budget * 0.15 / guestCount) },
        { name: 'Rooftop Bar Crawl', description: 'Sky Gallery & More', cost: Math.round(budget * 0.14 / guestCount) }
      ],
      activities: [
        { name: 'Coral Island Day Trip', description: 'Snorkeling & Beach Fun', cost: Math.round(budget * 0.16 / guestCount) },
        { name: 'Jet Ski Adventure', description: 'Pattaya Beach Water Sports', cost: Math.round(budget * 0.12 / guestCount) },
        { name: 'Sanctuary of Truth', description: 'Ancient Wooden Temple', cost: Math.round(budget * 0.08 / guestCount) },
        { name: 'Nong Nooch Garden', description: 'Tropical Garden & Shows', cost: Math.round(budget * 0.1 / guestCount) }
      ],
      package: [
        { name: 'Beach & Nightlife Combo', description: 'Day at Beach + Night Out', cost: Math.round(budget * 0.35 / guestCount) },
        { name: 'Adventure Water Package', description: 'All Water Sports Included', cost: Math.round(budget * 0.28 / guestCount) },
        { name: 'Cultural & Entertainment', description: 'Shows + Temples + Gardens', cost: Math.round(budget * 0.22 / guestCount) }
      ]
    },
    phuket: {
      nightlife: [
        { name: 'Bangla Road Experience', description: 'Patong\'s Famous Street', cost: Math.round(budget * 0.14 / guestCount) },
        { name: 'Beach Club Sunset', description: 'Kata Rocks or Catch', cost: Math.round(budget * 0.22 / guestCount) },
        { name: 'Phi Phi Party Cruise', description: 'Island Hopping with Drinks', cost: Math.round(budget * 0.25 / guestCount) },
        { name: 'Old Town Bar Crawl', description: 'Historic Phuket Town', cost: Math.round(budget * 0.12 / guestCount) }
      ],
      activities: [
        { name: 'James Bond Island Tour', description: 'Phang Nga Bay Adventure', cost: Math.round(budget * 0.18 / guestCount) },
        { name: 'Elephant Sanctuary Visit', description: 'Ethical Elephant Experience', cost: Math.round(budget * 0.15 / guestCount) },
        { name: 'Big Buddha & Temples', description: 'Cultural Sightseeing Tour', cost: Math.round(budget * 0.1 / guestCount) },
        { name: 'Snorkeling at Similan', description: 'World-Class Diving Spots', cost: Math.round(budget * 0.2 / guestCount) }
      ],
      package: [
        { name: 'Island Paradise Package', description: 'Multi-Island Tour + Dining', cost: Math.round(budget * 0.4 / guestCount) },
        { name: 'Adventure & Culture Mix', description: 'Activities + Temples + Markets', cost: Math.round(budget * 0.3 / guestCount) },
        { name: 'Luxury Beach Experience', description: 'Premium Beach Clubs + Spa', cost: Math.round(budget * 0.45 / guestCount) }
      ]
    }
  };

  return baseActivities[city as keyof typeof baseActivities]?.[preference as keyof typeof baseActivities.bangkok] || baseActivities.bangkok.nightlife;
}

function getCityImages(city: string): string[] {
  const imageMap = {
    bangkok: [
      'https://example.com/bangkok-skyline.jpg',
      'https://example.com/bangkok-temples.jpg',
      'https://example.com/bangkok-nightlife.jpg'
    ],
    pattaya: [
      'https://example.com/pattaya-beach.jpg',
      'https://example.com/pattaya-walking-street.jpg',
      'https://example.com/pattaya-activities.jpg'
    ],
    phuket: [
      'https://example.com/phuket-beaches.jpg',
      'https://example.com/phuket-islands.jpg',
      'https://example.com/phuket-nightlife.jpg'
    ]
  };

  return imageMap[city as keyof typeof imageMap] || imageMap.bangkok;
}

function getTimeSlot(index: number): string {
  const timeSlots = ['10:00', '14:00', '17:00', '19:30', '22:00'];
  return timeSlots[index] || `${10 + index * 2}:00`;
}
