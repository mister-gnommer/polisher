import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requestChatCompletion } from '../src/lib/providers/openAiCompatible.ts';

test('preserves provider errors when no completion is returned, including HTTP 200', async (t) => {
  for (const status of [200, 400]) {
    t.mock.method(globalThis, 'fetch', async () => new Response(
      JSON.stringify({ error: { message: 'Requested model is unavailable' } }),
      { status },
    ));

    await assert.rejects(requestChatCompletion({
      url: 'https://example.invalid',
      apiKey: 'fake',
      model: 'vendor/model',
      systemPrompt: 'Polish the text.',
      inputText: 'Some text.',
    }), { message: 'Requested model is unavailable' });
    t.mock.restoreAll();
  }
});
