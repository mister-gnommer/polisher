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

export interface ChatCompletionRequest {
  url: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  inputText: string;
}

export async function requestChatCompletion({
  url,
  apiKey,
  model,
  systemPrompt,
  inputText,
}: ChatCompletionRequest): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
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
    throw new Error(
      payload?.error?.message ?? "Provider response did not include completion text.",
    );
  }

  return text;
}
