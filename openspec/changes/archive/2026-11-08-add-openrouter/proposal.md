## Why

Polisher only supports Abacus.ai with a hardcoded model, so users without an Abacus key can't use it, and nobody can pick a different model. OpenRouter gives one key access to hundreds of models (including free ones), which covers both gaps without adding a provider per vendor.

## What Changes

- Add an OpenRouter provider that calls `https://openrouter.ai/api/v1/chat/completions` through the existing `/api/polish` proxy.
- OpenRouter uses a user-entered, free-text model ID (e.g. `openai/gpt-5.2`). Abacus keeps its hardcoded model.
- Setup modal shows a "Model" field when the selected provider needs one; the value is persisted in localStorage under `polisher.model`.
- `POST /api/polish` accepts an optional `model` field and rejects requests for a model-requiring provider when it is missing.
- Settings modal gets a "Change provider" action that reopens setup (cancellable) without wiping other preferences (live polish, flow toggle).
- A single API key is still stored (`polisher.apikey`). Changing provider requires a new key; keeping the same provider (e.g. only changing the model) may leave the key field blank to keep the current key.
- Error toast shows the provider's error message when one is returned, so a mistyped model ID is diagnosable. Falls back to the current generic message otherwise.
- Shared OpenAI-compatible request/response handling is extracted so Abacus and OpenRouter don't duplicate it.

## Capabilities

### New Capabilities

- `llm-providers`: Which LLM providers exist, how a polish request is routed through the server proxy to the selected provider, and how a provider's model is chosen (fixed vs user-supplied).
- `provider-setup`: How the user configures provider, API key, and model; how they are persisted; and how the user changes them later from Settings.

### Modified Capabilities

None. No existing specs.

## Impact

- **Code**: `src/lib/providers/` (new `openrouter.ts`, shared OpenAI-compatible helper, `types.ts`, `index.ts`, `abacus.ts`), `src/pages/api/polish.ts`, `src/components/SetupModal.tsx`, `src/components/SettingsModal.tsx`, `src/components/PolisherApp.tsx`, possibly `PolisherApp.css`.
- **API**: `POST /api/polish` body gains optional `model`. Backward compatible for Abacus.
- **Storage**: new `polisher.model` key; cleared by "Clear all local settings".
- **Docs**: `AGENTS.md` (localStorage keys, API proxy section).
- **Dependencies**: none.
