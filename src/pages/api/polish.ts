import type { APIRoute } from "astro";
import type { PolishApiResponse } from "../../lib/polishApi";
import { getProviderById, isValidProviderId } from "../../lib/providers";

export const prerender = false;

interface PolishRequestBody {
  apiKey?: unknown;
  provider?: unknown;
  inputText?: unknown;
  systemPrompt?: unknown;
}

const jsonResponse = (payload: PolishApiResponse, status: number) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const jsonError = (message: string, status: number) =>
  jsonResponse({ error: message }, status);

export const POST: APIRoute = async ({ request }) => {
  let body: PolishRequestBody;
  try {
    body = (await request.json()) as PolishRequestBody;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const { apiKey, provider: providerId, inputText, systemPrompt } = body;

  if (!apiKey || typeof apiKey !== "string") {
    return jsonError("apiKey is required.", 400);
  }
  if (!providerId || typeof providerId !== "string") {
    return jsonError("provider is required.", 400);
  }
  if (!isValidProviderId(providerId)) {
    return jsonError(`Provider "${providerId}" is not supported.`, 400);
  }
  if (!inputText || typeof inputText !== "string") {
    return jsonError("inputText is required.", 400);
  }
  if (!systemPrompt || typeof systemPrompt !== "string") {
    return jsonError("systemPrompt is required.", 400);
  }

  const providerClient = getProviderById(providerId)!;

  try {
    const result = await providerClient.polish({
      apiKey,
      inputText,
      systemPrompt,
    });

    return jsonResponse({ result }, 200);
  } catch (error) {
    console.error("Provider error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown provider error";
    return jsonResponse({ error: message }, 502);
  }
};
