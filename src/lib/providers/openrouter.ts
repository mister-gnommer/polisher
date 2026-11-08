import { requestChatCompletion } from "./openAiCompatible";
import type { PolisherProvider } from "./types";

const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";

export const openrouterProvider: PolisherProvider = {
  id: "openrouter",
  name: "OpenRouter",
  modelSource: "user",
  async polish({ apiKey, model, inputText, systemPrompt }) {
    if (!model) {
      // the proxy rejects missing models first; this covers direct polish() calls
      throw new Error("model is required.");
    }
    return requestChatCompletion({
      url: OPENROUTER_CHAT_COMPLETIONS_URL,
      apiKey,
      model,
      systemPrompt,
      inputText,
    });
  },
};
