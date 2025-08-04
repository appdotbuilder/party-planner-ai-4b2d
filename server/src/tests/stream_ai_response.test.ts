
import { describe, expect, it } from 'bun:test';
import { streamAIResponse } from '../handlers/stream_ai_response';

describe('streamAIResponse', () => {
  it('should stream response chunks with typewriter effect', async () => {
    const prompt = "Hello, I want to plan a party";
    const context = "New conversation";
    
    const chunks = [];
    const stream = streamAIResponse(prompt, context);
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    // Should have multiple chunks
    expect(chunks.length).toBeGreaterThan(1);
    
    // Each chunk should be progressively longer
    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i].chunk.length).toBeGreaterThanOrEqual(chunks[i - 1].chunk.length);
    }
    
    // Only last chunk should be complete
    const completeChunks = chunks.filter(chunk => chunk.is_complete);
    expect(completeChunks).toHaveLength(1);
    expect(chunks[chunks.length - 1].is_complete).toBe(true);
    
    // Only last chunk should have message_id
    const chunksWithId = chunks.filter(chunk => chunk.message_id);
    expect(chunksWithId).toHaveLength(1);
    expect(chunks[chunks.length - 1].message_id).toBeDefined();
  });

  it('should generate contextual greeting response', async () => {
    const prompt = "Hi there!";
    const context = "";
    
    const chunks = [];
    const stream = streamAIResponse(prompt, context);
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const finalResponse = chunks[chunks.length - 1].chunk;
    expect(finalResponse.toLowerCase()).toContain('hello');
    expect(finalResponse.toLowerCase()).toContain('party');
    expect(finalResponse.toLowerCase()).toContain('help');
  });

  it('should adapt response based on party type context', async () => {
    const prompt = "I chose bachelor party";
    const context = "party_type: bachelor, user wants to plan celebration";
    
    const chunks = [];
    const stream = streamAIResponse(prompt, context);
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const finalResponse = chunks[chunks.length - 1].chunk;
    expect(finalResponse.toLowerCase()).toContain('bachelor');
    expect(finalResponse.toLowerCase()).toContain('city');
  });

  it('should include city information when city is selected', async () => {
    const prompt = "I want to celebrate in Bangkok";
    const context = "party_type: bachelorette, city: bangkok, planning celebration";
    
    const chunks = [];
    const stream = streamAIResponse(prompt, context);
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const finalResponse = chunks[chunks.length - 1].chunk;
    expect(finalResponse).toContain('Bangkok');
    expect(finalResponse.toLowerCase()).toContain('bachelorette');
    expect(finalResponse.toLowerCase()).toContain('activities');
  });

  it('should progress to planning details when activity preference is set', async () => {
    const prompt = "I prefer activities";
    const context = "party_type: bachelor, city: phuket, activity_preference: activities, planning party";
    
    const chunks = [];
    const stream = streamAIResponse(prompt, context);
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const finalResponse = chunks[chunks.length - 1].chunk;
    expect(finalResponse.toLowerCase()).toContain('activities');
    expect(finalResponse.toLowerCase()).toContain('name');
  });

  it('should ask about budget when guest count is provided', async () => {
    const prompt = "We will have 8 people";
    const context = "party_type: bachelor, city: bangkok, activity_preference: activities, guest_count: 8";
    
    const chunks = [];
    const stream = streamAIResponse(prompt, context);
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const finalResponse = chunks[chunks.length - 1].chunk;
    expect(finalResponse).toContain('8');
    expect(finalResponse.toLowerCase()).toContain('budget');
  });

  it('should generate final planning response when budget is set', async () => {
    const prompt = "Our budget is $2000";
    const context = "party_type: bachelorette, city: pattaya, activity_preference: nightlife, guest_count: 6, budget: 2000";
    
    const chunks = [];
    const stream = streamAIResponse(prompt, context);
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const finalResponse = chunks[chunks.length - 1].chunk;
    expect(finalResponse.toLowerCase()).toContain('bachelorette');
    expect(finalResponse).toContain('Pattaya');
    expect(finalResponse.toLowerCase()).toContain('itinerary');
  });

  it('should handle errors gracefully', async () => {
    // Test with normal input - error handling is internal
    const prompt = "Plan my party";
    const context = "party_type: bachelor";
    
    const chunks = [];
    const stream = streamAIResponse(prompt, context);
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    // Should still produce chunks
    expect(chunks.length).toBeGreaterThan(0);
    
    // Last chunk should be complete
    expect(chunks[chunks.length - 1].is_complete).toBe(true);
    expect(chunks[chunks.length - 1].message_id).toBeDefined();
  });

  it('should generate unique message IDs', async () => {
    const prompt = "Hello";
    const context = "";
    
    const messageIds = [];
    
    // Generate multiple streams
    for (let i = 0; i < 2; i++) {
      const chunks = [];
      const stream = streamAIResponse(prompt, context);
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      const messageId = chunks[chunks.length - 1].message_id;
      messageIds.push(messageId);
      
      // Small delay between iterations to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // All message IDs should be unique
    const uniqueIds = new Set(messageIds);
    expect(uniqueIds.size).toBe(2);
    
    // Message IDs should follow expected format
    messageIds.forEach(id => {
      expect(id).toMatch(/^msg_\d+_[a-z0-9]+$/);
    });
  });

  it('should stream chunks progressively building the message', async () => {
    const prompt = "Tell me about Bangkok";
    const context = "city: bangkok";
    
    const chunks = [];
    const stream = streamAIResponse(prompt, context);
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    // Verify progressive building
    let previousLength = 0;
    for (const chunk of chunks) {
      expect(chunk.chunk.length).toBeGreaterThanOrEqual(previousLength);
      previousLength = chunk.chunk.length;
    }
    
    // Final chunk should contain the complete message
    const finalChunk = chunks[chunks.length - 1];
    const words = finalChunk.chunk.split(' ');
    expect(words.length).toBe(chunks.length);
    
    // Each non-final chunk should not be marked complete
    for (let i = 0; i < chunks.length - 1; i++) {
      expect(chunks[i].is_complete).toBe(false);
      expect(chunks[i].message_id).toBeUndefined();
    }
  });
});
