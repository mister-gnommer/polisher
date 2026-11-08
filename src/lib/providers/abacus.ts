import { requestChatCompletion } from "./openAiCompatible";
import type { PolisherProvider } from "./types";

const ABACUS_CHAT_COMPLETIONS_URL =
  "https://routellm.abacus.ai/v1/chat/completions";
const ABACUS_MODEL = "gpt-5.2";

export const abacusProvider: PolisherProvider = {
  id: "abacus",
  name: "Abacus.ai",
  modelSource: "fixed",
  async polish({ apiKey, inputText, systemPrompt }) {
    return requestChatCompletion({
      url: ABACUS_CHAT_COMPLETIONS_URL,
      apiKey,
      model: ABACUS_MODEL,
      systemPrompt,
      inputText,
    });
  },
};
