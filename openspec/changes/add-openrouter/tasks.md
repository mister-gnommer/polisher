# Tasks

No test suite exists; verification uses `npx tsc --noEmit`, `curl` against `npm run dev`, and manual checks in the browser.

## 1. Provider layer

- [ ] 1.1 Add `modelSource: "fixed" | "user"` to `PolisherProvider` and optional `model?: string` to `PolishOptions` in `src/lib/providers/types.ts`; verify `npx tsc --noEmit` reports only the expected missing-field errors in `abacus.ts`
- [ ] 1.2 Extract fetch/parse/error handling from `abacus.ts` into `src/lib/providers/openAiCompatible.ts` (`requestChatCompletion({ url, apiKey, model, systemPrompt, inputText })`, temperature 0.5); rewrite `abacus.ts` as a `"fixed"` wrapper using model `gpt-5.2`; verify `npx tsc --noEmit` passes and an Abacus polish still works in `npm run dev`
- [ ] 1.3 Add `src/lib/providers/openrouter.ts` (`id: "openrouter"`, `name: "OpenRouter"`, `modelSource: "user"`, URL `https://openrouter.ai/api/v1/chat/completions`, passes `model` through) and register it in `index.ts`; verify `npx tsc --noEmit` passes

## 2. Proxy

- [ ] 2.1 In `src/pages/api/polish.ts`, accept optional `model`; return 400 "model is required." when the provider's `modelSource` is `"user"` and `model` is not a non-blank string; pass trimmed `model` to `polish`; verify with `curl` on the dev server: openrouter without model → 400, abacus without model → not a model error, unknown provider → 400
- [ ] 2.2 Verify with `curl` and a real OpenRouter key: valid model → 200 with `result`; bogus model (e.g. `openai/gpt-nope`) → 502 with OpenRouter's message in `error`

## 3. Client error surfacing

- [ ] 3.1 In `PolisherApp.performPolish`, show `data.error` in the toast when the API returns one, and keep the generic message for network/parse failures (don't surface raw `TypeError` text); verify in the browser that a bogus OpenRouter model shows OpenRouter's message and stopping the dev server mid-request shows the generic message

## 4. Setup modal and persistence

- [ ] 4.1 Add `MODEL_STORAGE_KEY = 'polisher.model'` in `PolisherApp`; move all setup localStorage writes from `SetupModal` into `handleSaveSetup` (write or remove `polisher.model` by `modelSource`; keep current key when `onSave` passes `apiKey: null`); include `polisher.model` in `handleClearSettings`; send `model` in the `/api/polish` body; verify in browser devtools that keys are written/removed as specified in `specs/provider-setup/spec.md`
- [ ] 4.2 Update the mount check: setup is incomplete when key/provider is missing, or the provider is `"user"`-model and `polisher.model` is blank; verify by editing localStorage that OpenRouter without a model opens setup and Abacus without a model does not
- [ ] 4.3 Rework `SetupModal` props (`mode`, `initialProviderId`, `initialModel`, `currentProviderId`, `onSave({ apiKey | null, providerId, model })`, `onCancel`); show a required "Model" field (placeholder `e.g. openai/gpt-5.2`) only for `"user"`-model providers; validate model with `/^[^\s/]+\/\S+$/` after trim; in `"change"` mode show Cancel and allow a blank key only when the provider is unchanged (hint "Leave blank to keep current key"); verify each scenario in `specs/provider-setup/spec.md` manually
- [ ] 4.4 Render `SetupModal` conditionally (`{isSetupModalOpen && …}`) with a `setupMode` state so each opening starts from current values; add any needed styles in `PolisherApp.css` using existing custom properties; verify reopening the modal after cancelling shows the current values, not the edited ones

## 5. Settings

- [ ] 5.1 Add `onChangeProvider` prop and a "Change provider" button in the Account section of `SettingsModal`; wire it in `PolisherApp` to close Settings, set mode `"change"`, and open setup; verify live polish and flow toggles keep their state after changing provider and after cancelling

## 6. Docs and integration

- [ ] 6.1 Update `AGENTS.md`: `polisher.model` in localStorage keys, `polisher.provider` values (`"abacus"`, `"openrouter"`), API proxy section now forwarding to the selected provider's URL, `model` body field; verify the doc matches the code
- [ ] 6.2 Run `npm run build` and verify it succeeds; then in `npm run preview` do a full pass: first-time OpenRouter setup → polish → change model only → switch to Abacus (key required) → clear settings
