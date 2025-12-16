import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role, ModelType } from '../types';

// Initialize the API client
// Ideally this should be outside the render loop, effectively a singleton in this module scope
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface StreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export const streamGeminiResponse = async (
  model: ModelType,
  history: Message[],
  newMessageText: string,
  attachments: { mimeType: string; data: string }[] | undefined,
  callbacks: StreamCallbacks
) => {
  try {
    // 1. Prepare the conversation history for the API
    // The API expects an array of content objects.
    // We map our internal Message structure to the Gemini content structure.
    
    // We only take previous successful messages.
    const validHistory = history.filter(m => !m.isError);

    // If there are attachments in the current message, we need to handle them differently
    // than a simple text chat.
    
    // For simplicity in this demo, we will treat the "history" as context, 
    // but the `generateContentStream` works best when we construct a Chat session
    // or pass the full contents list if stateless.
    
    // Construct the full contents array including the new message
    const contents = validHistory.map((msg) => {
      const parts: any[] = [{ text: msg.text }];
      
      // If the historical message had attachments, add them.
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          parts.unshift({
             inlineData: {
               mimeType: att.mimeType,
               data: att.data
             }
          });
        });
      }

      return {
        role: msg.role === Role.User ? 'user' : 'model',
        parts: parts
      };
    });

    // Add the current new message
    const currentParts: any[] = [{ text: newMessageText }];
    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        currentParts.unshift({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    // 2. Call the API
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: {
        // Optional: Add system instructions or safety settings here
        systemInstruction: "You are a helpful, witty, and concise AI assistant named Nexus.",
      }
    });

    // 3. Process the stream
    for await (const chunk of responseStream) {
      // chunk is a GenerateContentResponse
      const chunkResponse = chunk as GenerateContentResponse;
      const text = chunkResponse.text;
      if (text) {
        callbacks.onChunk(text);
      }
    }

    callbacks.onComplete();

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    callbacks.onError(error instanceof Error ? error : new Error("Unknown error occurred"));
  }
};
