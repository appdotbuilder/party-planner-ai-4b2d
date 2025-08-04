
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createConversationInputSchema,
  updateConversationInputSchema,
  createMessageInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createConversation } from './handlers/create_conversation';
import { getConversation } from './handlers/get_conversation';
import { updateConversation } from './handlers/update_conversation';
import { createMessage } from './handlers/create_message';
import { getConversationMessages } from './handlers/get_conversation_messages';
import { processChatMessage } from './handlers/process_chat_message';
import { generateItinerary } from './handlers/generate_itinerary';
import { streamAIResponse } from './handlers/stream_ai_response';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Conversation management
  createConversation: publicProcedure
    .input(createConversationInputSchema)
    .mutation(({ input }) => createConversation(input)),

  getConversation: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(({ input }) => getConversation(input.conversationId)),

  updateConversation: publicProcedure
    .input(updateConversationInputSchema)
    .mutation(({ input }) => updateConversation(input)),

  // Message management
  createMessage: publicProcedure
    .input(createMessageInputSchema)
    .mutation(({ input }) => createMessage(input)),

  getConversationMessages: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(({ input }) => getConversationMessages(input.conversationId)),

  // Chat functionality
  processChatMessage: publicProcedure
    .input(z.object({
      conversationId: z.string(),
      userMessage: z.string(),
      messageType: z.enum(['text', 'quick_reply']).optional()
    }))
    .mutation(({ input }) => processChatMessage(
      input.conversationId,
      input.userMessage,
      input.messageType
    )),

  // Itinerary generation
  generateItinerary: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(({ input }) => generateItinerary(input.conversationId)),

  // Streaming responses
  streamAIResponse: publicProcedure
    .input(z.object({
      prompt: z.string(),
      conversationContext: z.string()
    }))
    .subscription(async function* ({ input }) {
      yield* streamAIResponse(input.prompt, input.conversationContext);
    })
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
