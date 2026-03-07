import type { PolisherProvider } from "./types";

interface ChatCompletionChoice {
  message?: {
    content?: string;
  };
}

interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
  error?: {
    message?: string;
  };
}

const ABACUS_CHAT_COMPLETIONS_URL =
  "https://routellm.abacus.ai/v1/chat/completions";

export const abacusProvider: PolisherProvider = {
  id: "abacus",
  name: "Abacus.ai",
  async polish({ apiKey, inputText, systemPrompt }) {
    const response = await fetch(ABACUS_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.2",
        temperature: 0.5,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: inputText },
        ],
      }),
    });

    let payload: ChatCompletionResponse | null = null;
    try {
      payload = (await response.json()) as ChatCompletionResponse;
    } catch (error) {
      console.error("Provider error: could not parse response body", error);
    }

    if (!response.ok) {
      console.error("Provider error response:", {
        status: response.status,
        body: payload,
      });
      throw new Error(
        payload?.error?.message ??
          `Provider request failed with status ${response.status}`,
      );
    }

    const text = payload?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      console.error("Provider error: missing completion text", payload);
      throw new Error("Provider response did not include completion text.");
    }

    return text;
  },
};
