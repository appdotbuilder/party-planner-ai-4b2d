
import { z } from 'zod';

// Enums for party planning
export const partyTypeEnum = z.enum(['bachelor', 'bachelorette']);
export const cityEnum = z.enum(['bangkok', 'pattaya', 'phuket']);
export const activityPreferenceEnum = z.enum(['activities', 'package', 'nightlife']);
export const conversationStatusEnum = z.enum(['active', 'completed', 'paused']);
export const messageRoleEnum = z.enum(['user', 'assistant', 'system']);
export const messageTypeEnum = z.enum(['text', 'quick_reply', 'rich_media', 'itinerary']);

// User schema
export const userSchema = z.object({
  id: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Conversation schema
export const conversationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  party_type: partyTypeEnum.nullable(),
  city: cityEnum.nullable(),
  activity_preference: activityPreferenceEnum.nullable(),
  party_name: z.string().nullable(),
  party_dates: z.string().nullable(), // JSON string for date ranges
  guest_count: z.number().int().nullable(),
  budget: z.number().nullable(),
  theme: z.string().nullable(),
  preferences: z.string().nullable(), // JSON string for dynamic preferences
  status: conversationStatusEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Conversation = z.infer<typeof conversationSchema>;

// Message metadata for rich content
export const messageMetadataSchema = z.object({
  quick_replies: z.array(z.string()).optional(),
  rich_media: z.object({
    images: z.array(z.string()).optional(),
    activities: z.array(z.object({
      name: z.string(),
      description: z.string(),
      cost: z.number().optional(),
      image_url: z.string().optional()
    })).optional(),
    itinerary: z.object({
      day: z.number(),
      activities: z.array(z.object({
        time: z.string(),
        activity: z.string(),
        location: z.string(),
        cost: z.number().optional()
      }))
    }).optional()
  }).optional()
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// Message schema
export const messageSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  role: messageRoleEnum,
  content: z.string(),
  message_type: messageTypeEnum,
  metadata: z.string().nullable(), // JSON string for MessageMetadata
  created_at: z.coerce.date()
});

export type Message = z.infer<typeof messageSchema>;

// Input schemas for creating/updating
export const createUserInputSchema = z.object({
  id: z.string().optional() // Will be generated if not provided
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createConversationInputSchema = z.object({
  user_id: z.string(),
  party_type: partyTypeEnum.optional(),
  city: cityEnum.optional(),
  activity_preference: activityPreferenceEnum.optional()
});

export type CreateConversationInput = z.infer<typeof createConversationInputSchema>;

export const updateConversationInputSchema = z.object({
  id: z.string(),
  party_type: partyTypeEnum.optional(),
  city: cityEnum.optional(),
  activity_preference: activityPreferenceEnum.optional(),
  party_name: z.string().nullable().optional(),
  party_dates: z.string().nullable().optional(),
  guest_count: z.number().int().optional(),
  budget: z.number().optional(),
  theme: z.string().nullable().optional(),
  preferences: z.string().nullable().optional(),
  status: conversationStatusEnum.optional()
});

export type UpdateConversationInput = z.infer<typeof updateConversationInputSchema>;

export const createMessageInputSchema = z.object({
  conversation_id: z.string(),
  role: messageRoleEnum,
  content: z.string(),
  message_type: messageTypeEnum,
  metadata: messageMetadataSchema.optional()
});

export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;

// Response schemas for streaming and chat
export const chatResponseSchema = z.object({
  message: messageSchema,
  is_streaming: z.boolean(),
  next_prompt: z.string().optional(),
  auto_continue: z.boolean().optional()
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;

export const streamingChunkSchema = z.object({
  chunk: z.string(),
  is_complete: z.boolean(),
  message_id: z.string().optional()
});

export type StreamingChunk = z.infer<typeof streamingChunkSchema>;
