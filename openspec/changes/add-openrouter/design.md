# Design

## Context

- Providers live in `src/lib/providers/`: `PolisherProvider { id, name, polish({ apiKey, inputText, systemPrompt }) }`, registered in `index.ts`. Abacus is the only one; its model (`gpt-5.2`) and temperature (0.5) are hardcoded in `abacus.ts`.
- `src/pages/api/polish.ts` validates the body and calls `provider.polish`. Provider errors become `502 { error }`.
- `SetupModal` owns its form state and writes `polisher.apikey` / `polisher.provider` itself. It renders `null` when closed but stays mounted, so its `useState` values persist between openings.
- `PolisherApp` reads storage on mount, owns `apiKey` / `provider`, and always shows a generic toast on polish failure, discarding the server's `error`.
- OpenRouter's chat completions API is OpenAI-compatible: same request body, `Authorization: Bearer`, and the same `{ choices[0].message.content }` / `{ error: { message } }` shapes Abacus returns.

## Goals / Non-Goals

**Goals:**
- One shared OpenAI-compatible request path for both providers.
- Provider-level declaration of model source, so the UI and proxy don't special-case `"openrouter"` by id.

**Non-Goals:**
- Model selection for Abacus, temperature selection, fetching or validating the OpenRouter model list.
- OpenRouter app-attribution headers (`HTTP-Referer`, `X-OpenRouter-Title`).
- Per-provider API key storage (single `polisher.apikey` stays).
- Streaming.

## Decisions

### Shared OpenAI-compatible helper
Extract the fetch / parse / error logic from `abacus.ts` into `src/lib/providers/openAiCompatible.ts`, e.g. `requestChatCompletion({ url, apiKey, model, systemPrompt, inputText })`. `abacus.ts` and `openrouter.ts` become thin wrappers that pass their URL and model.
- *Alternative*: copy `abacus.ts` into `openrouter.ts`. Rejected: ~50 duplicated lines that must stay in sync on every error-handling fix.

### Model source on the provider
Extend `PolisherProvider` with `modelSource: "fixed" | "user"` and add optional `model?: string` to `PolishOptions`. Abacus is `"fixed"` and ignores `model`; OpenRouter is `"user"` and uses it. The proxy, `SetupModal`, and `PolisherApp`'s load check all branch on `modelSource`, not provider id.
- *Alternative*: `requiresModel: boolean`. Equivalent; the union reads better if a "fixed with override" mode appears later.

### Model validation split
- Client (`SetupModal`): trim; require non-empty, no whitespace, `vendor/model` shape (`/^[^\s/]+\/\S+$/`). Catches typos like a missing vendor prefix before any network call.
- Server: require a non-blank string only. OpenRouter is the source of truth for whether a model exists; its error message reaches the user via the toast.
- *Alternative*: fetch `/api/v1/models` to validate. Rejected as a non-goal; adds latency and another failure mode.

### Persistence moves to `PolisherApp`
`SetupModal` stops touching localStorage. It calls `onSave({ apiKey, providerId, model })` where `apiKey` may be `null` (meaning "keep current", only allowed when provider is unchanged). `PolisherApp` resolves the final key, writes `polisher.apikey`, `polisher.provider`, and writes or removes `polisher.model`. All storage keys then live in one component, alongside the existing clear-settings logic.
- *Alternative*: pass a third storage-key prop into `SetupModal`. Rejected: spreads key-reuse logic across two components.

### Setup modal modes and fresh state
`SetupModal` gets `mode: "initial" | "change"`, `initialProviderId`, `initialModel`, `currentProviderId`, and `onCancel`. `"change"` shows Cancel and allows a blank key when the provider is unchanged (field hint: "Leave blank to keep current key"). `PolisherApp` tracks the mode (`setupMode` state) and renders `{isSetupModalOpen && <SetupModal … />}` so each opening remounts with fresh state from current props.
- *Alternative*: `useEffect` syncing props into state on open. Rejected: more code, easy to get stale.

### Settings wiring
`SettingsModal` gets an `onChangeProvider` prop and a "Change provider" button in the Account section, above "Clear all local settings". `PolisherApp` handler: close Settings, set mode `"change"`, open setup. `isInteractionBlocked` already covers the open setup modal.

### Surfacing provider errors
In `performPolish`, keep the message from `data.error` (thrown as `Error`) and show it in the toast. Network errors and JSON parse failures still show the generic message. Implement by distinguishing an API-error class or a flag rather than showing arbitrary `Error.message` values (e.g. `TypeError: Failed to fetch`).

## Risks / Trade-offs

- [Free OpenRouter models can be slow or rate-limited] → Error passthrough shows OpenRouter's rate-limit message; Vercel function timeout is an existing risk shared with Abacus.
- [Some models reject `temperature`] → OpenRouter generally drops unsupported params; if a model errors, the message is shown. Keep `temperature: 0.5` for both.
- [Single key means switching providers loses the old key] → Accepted per user decision; the "keep key" path covers model-only edits.
- [Provider error text shown verbatim could be long or technical] → Acceptable for a single-user tool; toast already auto-dismisses after 6 s.

## Migration Plan

No data migration. Existing Abacus users have no `polisher.model`, which is valid for a fixed-model provider, so they see no setup prompt. Rollback is a plain revert; a stale `polisher.model` left behind is ignored by the old code.
