
import { type StreamingChunk } from '../schema';

// AI response templates based on conversation context
const responseTemplates = {
  greeting: "Hello! I'm here to help you plan the perfect {partyType} party. Let's start by getting to know what you have in mind!",
  partyTypeFollowup: "Great choice on a {partyType} party! These are always so much fun. What city are you thinking of celebrating in?",
  cityFollowup: "{city} is an amazing choice for a {partyType} party! There's so much to do there. Are you more interested in activities, a complete package, or nightlife?",
  activityFollowup: "Perfect! I love working with people who want {activityPreference}. What's the name of the party guest we're celebrating?",
  planningDetails: "Wonderful! Now let's get into the fun details. When are you planning to have this celebration?",
  budgetDiscussion: "That sounds like it's going to be an incredible {partyType} party for {guestCount} people! What's your budget range for this celebration?",
  finalPlanning: "Excellent! I have all the details I need. Let me create a personalized itinerary for your {partyType} party in {city}...",
  default: "That's great! Let me help you with the next steps for planning your perfect party experience."
};

// Generate contextual response based on prompt and conversation context
function generateContextualResponse(prompt: string, conversationContext: string): string {
  const context = conversationContext.toLowerCase();
  const promptLower = prompt.toLowerCase();

  // Parse conversation context to extract party details
  const partyType = context.includes('bachelorette') ? 'bachelorette' : 'bachelor';
  
  const city = context.includes('bangkok') ? 'Bangkok' :
               context.includes('pattaya') ? 'Pattaya' :
               context.includes('phuket') ? 'Phuket' : 'Thailand';

  const activityPreference = context.includes('activities') ? 'activities' :
                            context.includes('package') ? 'complete packages' :
                            context.includes('nightlife') ? 'nightlife' : 'experiences';

  // Extract guest count if mentioned (look for number pattern)
  const guestCountMatch = context.match(/guest_count:\s*(\d+)|(\d+)\s*people|(\d+)\s*guest/);
  const guestCount = guestCountMatch ? (guestCountMatch[1] || guestCountMatch[2] || guestCountMatch[3]) : 'your group';

  // Determine response type based on conversation flow - check in reverse order of completion
  let template = responseTemplates.default;
  
  // Check for greeting or very short context first
  if (promptLower.includes('hello') || promptLower.includes('hi') || context.length < 20) {
    template = responseTemplates.greeting;
  }
  // Check most advanced states first (budget planning)
  else if (context.includes('budget')) {
    template = responseTemplates.finalPlanning;
  }
  // Check for guest count (should lead to budget discussion)
  else if (context.includes('guest_count')) {
    template = responseTemplates.budgetDiscussion;
  }
  // Check if party name is set but dates are not
  else if (context.includes('party_name') && !context.includes('party_dates')) {
    template = responseTemplates.planningDetails;
  }
  // Check if activity preference is set but party name is not
  else if (context.includes('activity_preference') && !context.includes('party_name')) {
    template = responseTemplates.activityFollowup;
  }
  // Check if city is set but activity preference is not
  else if (context.includes('city') && !context.includes('activity_preference')) {
    template = responseTemplates.cityFollowup;
  }
  // Check if party type is set but city is not
  else if (context.includes('party_type') && !context.includes('city')) {
    template = responseTemplates.partyTypeFollowup;
  }

  // Replace placeholders with actual values
  return template
    .replace(/\{partyType\}/g, partyType)
    .replace(/\{city\}/g, city)
    .replace(/\{activityPreference\}/g, activityPreference)
    .replace(/\{guestCount\}/g, guestCount);
}

// Calculate dynamic delay based on content type and position
function calculateStreamingDelay(wordIndex: number, totalWords: number, word: string): number {
  const baseDelay = 50; // Reduced base delay for faster testing
  
  // Longer pause for punctuation
  if (word.includes('.') || word.includes('!') || word.includes('?')) {
    return baseDelay * 1.5;
  }
  
  // Shorter delay for articles and prepositions
  const quickWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
  if (quickWords.includes(word.toLowerCase())) {
    return baseDelay * 0.5;
  }
  
  // Slightly faster at the end to maintain engagement
  if (wordIndex > totalWords * 0.8) {
    return baseDelay * 0.7;
  }
  
  return baseDelay;
}

export async function* streamAIResponse(
  prompt: string, 
  conversationContext: string
): AsyncGenerator<StreamingChunk, void, unknown> {
  try {
    // Generate contextual response
    const response = generateContextualResponse(prompt, conversationContext);
    const words = response.split(' ');
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Stream response word by word with typewriter effect
    for (let i = 0; i < words.length; i++) {
      const chunk = words.slice(0, i + 1).join(' ');
      const isComplete = i === words.length - 1;
      
      yield {
        chunk,
        is_complete: isComplete,
        message_id: isComplete ? messageId : undefined
      };
      
      // Don't delay after the last word
      if (!isComplete) {
        const delay = calculateStreamingDelay(i, words.length, words[i]);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } catch (error) {
    console.error('Streaming AI response failed:', error);
    
    // Yield error fallback response
    const fallbackResponse = "I apologize, but I'm having trouble generating a response right now. Please try again.";
    const fallbackMessageId = `msg_error_${Date.now()}`;
    
    yield {
      chunk: fallbackResponse,
      is_complete: true,
      message_id: fallbackMessageId
    };
  }
}
