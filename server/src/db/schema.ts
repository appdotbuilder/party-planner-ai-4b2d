
import { text, pgTable, timestamp, integer, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for database
export const partyTypeEnum = pgEnum('party_type', ['bachelor', 'bachelorette']);
export const cityEnum = pgEnum('city', ['bangkok', 'pattaya', 'phuket']);
export const activityPreferenceEnum = pgEnum('activity_preference', ['activities', 'package', 'nightlife']);
export const conversationStatusEnum = pgEnum('conversation_status', ['active', 'completed', 'paused']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'quick_reply', 'rich_media', 'itinerary']);

// Users table
export const usersTable = pgTable('users', {
  id: text('id').primaryKey(), // UUID or generated ID
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Conversations table
export const conversationsTable = pgTable('conversations', {
  id: text('id').primaryKey(), // UUID or generated ID
  user_id: text('user_id').references(() => usersTable.id).notNull(),
  party_type: partyTypeEnum('party_type'), // Nullable - determined during conversation
  city: cityEnum('city'), // Nullable - determined during conversation
  activity_preference: activityPreferenceEnum('activity_preference'), // Nullable
  party_name: text('party_name'), // Nullable - gathered later
  party_dates: text('party_dates'), // Nullable - JSON string for date ranges
  guest_count: integer('guest_count'), // Nullable - gathered later
  budget: numeric('budget', { precision: 10, scale: 2 }), // Nullable - monetary values
  theme: text('theme'), // Nullable - optional party theme
  preferences: text('preferences'), // Nullable - JSON string for dynamic preferences
  status: conversationStatusEnum('status').notNull().default('active'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Messages table
export const messagesTable = pgTable('messages', {
  id: text('id').primaryKey(), // UUID or generated ID
  conversation_id: text('conversation_id').references(() => conversationsTable.id).notNull(),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  message_type: messageTypeEnum('message_type').notNull(),
  metadata: text('metadata'), // Nullable - JSON string for rich content metadata
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  conversations: many(conversationsTable)
}));

export const conversationsRelations = relations(conversationsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [conversationsTable.user_id],
    references: [usersTable.id]
  }),
  messages: many(messagesTable)
}));

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  conversation: one(conversationsTable, {
    fields: [messagesTable.conversation_id],
    references: [conversationsTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Conversation = typeof conversationsTable.$inferSelect;
export type NewConversation = typeof conversationsTable.$inferInsert;
export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  conversations: conversationsTable,
  messages: messagesTable
};
