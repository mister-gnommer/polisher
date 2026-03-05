# Polisher App – Implementation Plan

## 1. Project Setup

### 1.1. Create Astro project
- [x] Run `npm create astro@latest` and create a **minimal** project (no extra example components/pages).
- [x] Use TypeScript when asked.
- [x] Choose no UI framework or pick React if needed for islands (this plan assumes **React islands** where interactivity is required).
- [x] Run `npm install` in the new project directory.

### 1.2. Basic directory structure
- [x] From the project root, create folders:
  - [x] `mkdir -p src/components src/styles src/lib/providers`
- [x] Confirm Astro created:
  - [x] `src/pages/`
  - [x] `src/layouts/`

### 1.3. Dependencies
- [ ] Install React + ReactDOM for client islands (if not already added by Astro wizard):
  - `npm install react react-dom`
- [ ] Optionally install TypeScript types:
  - `npm install -D @types/react @types/react-dom`
- [ ] If using Tailwind (optional), follow Astro docs; otherwise, stick to plain CSS.


## 2. Global Design & Styling

### 2.1. Color tokens and base styles
- [ ] Create `src/styles/global.css` with:
  - [ ] CSS variables for colors:
    - `--color-accent: #ff9514;`
    - `--color-dark: #282828;`
    - `--color-bg: #d6d6d6;`
    - `--color-text: #000000;`
  - [ ] `body` styles:
    - Background: `var(--color-bg)`
    - Text color: `var(--color-text)`
    - A readable sans-serif font
  - [ ] Basic reset / box-sizing rules
- [ ] Import `src/styles/global.css` in the main layout or in `src/pages/_astro` pattern as per Astro docs (usually via `src/layouts/Layout.astro`).

### 2.2. Layout container and typography helpers
- [ ] Define reusable classes in `global.css`, for example:
  - [ ] `.app-shell` – centers content, max-width (e.g. 900px), padding, margin auto.
  - [ ] `.card` – white or very light background, subtle border radius, box-shadow.
  - [ ] `.heading`, `.subheading`, `.label`, `.muted` text helpers.


## 3. Routing & Top-Level Layout

### 3.1. Main page
- [ ] Create `src/pages/index.astro` as the single main page.
- [ ] Use a top-level layout if desired, e.g. `src/layouts/MainLayout.astro`:
  - [ ] Include `<head>` title like "Polisher – LLM Text Polishing Tool".
  - [ ] Include global styles.
- [ ] In `index.astro`, structure basic static HTML:
  - [ ] App title and short description.
  - [ ] Mount a single interactive client island for the app logic (e.g. `<PolisherApp client:load />`).


## 4. Core React Island: `PolisherApp`

### 4.1. Component file
- [ ] Create `src/components/PolisherApp.tsx`.
- [ ] This component will:
  - [ ] Manage all application state (API key, provider, text, level, loading, errors, result).
  - [ ] Render:
    - Blocking setup modal (for API key & provider)
    - Main text area
    - Level slider & level description
    - "POLISH" button
    - Output box
    - Error toast when needed

### 4.2. State structure
Inside `PolisherApp`, define React state hooks for:
- [ ] `apiKey: string | null`
- [ ] `provider: string | null`
- [ ] `inputText: string`
- [ ] `level: number | null` (allow null to test defaulting to 3)
- [ ] `outputText: string`
- [ ] `isLoading: boolean`
- [ ] `errorMessage: string | null` (for toast)
- [ ] `isSetupModalOpen: boolean` – derived from whether `apiKey` and `provider` exist in localStorage

### 4.3. Local storage integration
- [ ] On component mount (`useEffect` with empty dependency array):
  - [ ] Read `localStorage.getItem('polisher.apikey')`.
  - [ ] Read `localStorage.getItem('polisher.provider')`.
  - [ ] If both exist and are non-empty:
    - [ ] Set `apiKey` and `provider` in state.
    - [ ] Set `isSetupModalOpen = false`.
  - [ ] Otherwise:
    - [ ] Set `isSetupModalOpen = true` and clear state for safety.
- [ ] When user saves from the modal:
  - [ ] Validate API key is non-empty.
  - [ ] Validate provider is one of allowed providers (currently only `abacus`).
  - [ ] Write to localStorage:
    - [ ] `localStorage.setItem('polisher.apikey', value)`
    - [ ] `localStorage.setItem('polisher.provider', value)`
  - [ ] Update state (`apiKey`, `provider`).
  - [ ] Close modal (`isSetupModalOpen = false`).

### 4.4. Guardrails for modal & app blocking
- [ ] The setup modal must:
  - [ ] Cover the entire viewport with a semi-opaque backdrop.
  - [ ] Be non-dismissable by clicking outside or pressing Escape.
  - [ ] Have **no** close button.
  - [ ] Only close when valid API key and provider are saved.
- [ ] While `isSetupModalOpen` is true:
  - [ ] Visually block the app content behind the modal.
  - [ ] Additionally, programmatically disable interaction with the main controls:
    - [ ] Textarea `disabled={true}`
    - [ ] Slider `disabled={true}`
    - [ ] "POLISH" button `disabled={true}`
- [ ] Even when modal is closed, keep a **logical** guard:
  - [ ] If `!apiKey || !provider`, the "POLISH" button must remain disabled regardless of UI.


## 5. UI Elements & Behavior

### 5.1. Setup modal UI
- [ ] Create `SetupModal` component inside `PolisherApp.tsx` or as a separate component.
- [ ] Fields:
  - [ ] API key: text input (or password-style input to hide value if desired).
  - [ ] Provider: select or radio list (initially only "Abacus.ai").
- [ ] Buttons:
  - [ ] "Save" – validates, writes to localStorage, closes modal.
- [ ] Minimal text explaining that the key is stored locally only.

### 5.2. Text input area
- [ ] Large `<textarea>` with:
  - [ ] Adaptive height or fixed reasonable height (e.g. 10–15 lines).
  - [ ] Full width inside the card or container.
  - [ ] `onChange` updating `inputText`.
- [ ] Guardrail: The "POLISH" button must be disabled when `inputText.trim().length === 0`.

### 5.3. Polishing level slider
- [ ] Use an `<input type="range">` with:
  - [ ] `min=1`, `max=5`, `step=1`.
  - [ ] Default `value={3}` when the app loads.
- [ ] Store the numeric level in `level` state.
- [ ] If `level` somehow becomes `null` or invalid (e.g. via future changes), ensure a fallback to `3` when constructing the system prompt.
- [ ] Next to the slider:
  - [ ] Display the current level number.
  - [ ] Display the short label (e.g. "Moderate Enhancement").
- [ ] Below the slider:
  - [ ] Render a description text in a lighter font or muted style.

### 5.4. Level descriptions mapping
- [ ] In a separate constant (e.g. `polishingLevels.ts` or inside the component), define a mapping:
  - [ ] Keyed by numeric level (1–5).
  - [ ] Each entry contains:
    - [ ] `title`: e.g. "Technical Correction".
    - [ ] `description`: the full multi-sentence text from the spec.
- [ ] Use this mapping for:
  - [ ] Displaying the description under the slider.
  - [ ] Inserting the description into the system prompt.

### 5.5. POLISH button behavior & disabled logic
- [ ] Render a prominent button labeled exactly `"POLISH"`.
- [ ] Button should use the primary accent color `#ff9514` with appropriate hover/active states.
- [ ] Disable conditions (button `disabled={true}`) when any of the following is true:
  - [ ] `!apiKey || !provider`
  - [ ] `inputText.trim().length === 0`
  - [ ] `isLoading === true`
- [ ] On click (when enabled):
  - [ ] Trigger `handlePolish()` async function.


## 6. System Prompt & Request Construction

### 6.1. Normalizing level for safety
- [ ] In `handlePolish()`, compute an `effectiveLevel`:
  - [ ] If `level` is 1–5, use it.
  - [ ] Otherwise, fallback to `3`.

### 6.2. Building the system prompt
- [ ] Retrieve level description from the level mapping using `effectiveLevel`.
- [ ] Build this exact system prompt template, inserting the chosen level description where indicated:

  "You are a strict text editor. Edit text provided by user according to this level: {{chosen level description here}}.

  Rules:

  Respond with the edited text only. Do not add explanations, comments, or headings.
  Do not change the language of the text.
  Respect the user’s voice and constraints defined in the level description.
  Always normalize dashes: use the standard hyphen-minus character - instead of any en dash, em dash, or similar characters.
  "

- [ ] Programmatically replace `{{chosen level description here}}` with the full description string from the mapping.

### 6.3. Input constraints and dash normalization rule
- [ ] **Do not** perform your own text rewriting in the client beyond basic `trim()` checks.
- [ ] Rely on the LLM and system prompt rule:
  - Specifically: "Always normalize dashes: use the standard hyphen-minus character - instead of any en dash, em dash, or similar characters."


## 7. Provider Abstraction

### 7.1. Provider interface
- [ ] Create `src/lib/providers/types.ts` (or similar) with:
  - [ ] A TypeScript interface, e.g. `PolisherProvider`:
    - [ ] `id: string` (e.g. "abacus")
    - [ ] `name: string`
    - [ ] `polish(options: { apiKey: string; inputText: string; systemPrompt: string; level: number }): Promise<string>`
- [ ] This interface will make it easy to add providers later without touching most UI code.

### 7.2. Abacus provider implementation
- [ ] Create `src/lib/providers/abacus.ts` that exports an object implementing `PolisherProvider`.
- [ ] `polish()` should:
  - [ ] Accept `{ apiKey, inputText, systemPrompt, level }`.
  - [ ] Construct a request to the Abacus RouteLLM API using GPT 5.2 with temperature 0.5.
  - [ ] Use a **single-turn** interaction: no conversation history, no streaming.
  - [ ] Use a body structure similar to:
    - `model: "gpt-5.2"`
    - `temperature: 0.5`
    - `messages: [ { role: "system", content: systemPrompt }, { role: "user", content: inputText } ]`
  - [ ] Send `Authorization: Bearer ${apiKey}` header.
  - [ ] Parse the JSON response and extract the text content from the assistant message.
  - [ ] Throw an `Error` with useful message if the response does not contain an expected completion.

### 7.3. Provider registry
- [ ] Create `src/lib/providers/index.ts`:
  - [ ] Import the Abacus provider.
  - [ ] Export a `providers` map or array, e.g. `const providersById: Record<string, PolisherProvider>`.
  - [ ] Export a `getProviderById(id: string): PolisherProvider | undefined` helper.
- [ ] In UI code (`PolisherApp`):
  - [ ] When calling, use `getProviderById(provider)`.
  - [ ] If provider not found, handle gracefully (e.g. show an error toast and do not send a request).


## 8. LLM Call Flow (`handlePolish`)

### 8.1. Precondition checks
In `handlePolish()`:
- [ ] If `!apiKey` or `!provider`, return early and optionally log a warning.
- [ ] If `inputText.trim().length === 0`, return early.
- [ ] Resolve `effectiveLevel` (with fallback to 3).
- [ ] Resolve `currentProvider` via `getProviderById(provider)`.
  - [ ] If no provider found, set `errorMessage` to a readable message and return.

### 8.2. Call lifecycle
- [ ] Set `isLoading = true`.
- [ ] Clear previous `errorMessage`.
- [ ] Optionally preserve previous `outputText` until new response arrives.
- [ ] Try/catch around provider call:
  - [ ] In `try`:
    - [ ] Call `currentProvider.polish({ apiKey, inputText, systemPrompt, level: effectiveLevel })`.
    - [ ] On success, set `outputText` to the returned string.
  - [ ] In `catch`:
    - [ ] Log full error to console (`console.error(error)`).
    - [ ] Set `errorMessage` to a short, generic but readable text like:
      - "Something went wrong while contacting the provider. Please try again."
    - [ ] **Do not** modify `inputText`.
- [ ] In `finally`:
  - [ ] Set `isLoading = false`.


## 9. Error Handling & Toasts

### 9.1. Error toast behavior
- [ ] Implement a simple toast component or inline UI:
  - [ ] Appears at top or bottom of the app.
  - [ ] Shows `errorMessage` string when not null.
  - [ ] Has clear, readable styling (contrasting background, simple border).
- [ ] Auto-hide behavior (optional):
  - [ ] Use `setTimeout` to clear `errorMessage` after a few seconds.
  - [ ] Or require user to click a small "x" to dismiss.

### 9.2. Logging full error
- [ ] In the provider implementation and/or `handlePolish` catch block:
  - [ ] `console.error('Provider error:', error)`.
  - [ ] If the error comes from `fetch`, also log the HTTP status and response body if available.


## 10. Output Box

### 10.1. Displaying polished text
- [ ] Below the level description, render a box or card labeled "Polished text" (or no label if spec prefers plain).
- [ ] When `outputText` is non-empty:
  - [ ] Show the returned result.
  - [ ] Use a monospaced or regular font as desired, but match the rest of the UI styling.
- [ ] When `outputText` is empty:
  - [ ] Optionally show placeholder text like "Your polished text will appear here." in muted style.

### 10.2. Loading state indication
- [ ] While `isLoading === true`:
  - [ ] Disable inputs as per above.
  - [ ] Optionally show a small spinner or "Polishing..." text near the button or in the output box.


## 11. Guardrails Recap (Important)

- [ ] The app **must not** allow interaction with text or POLISH button unless:
  - [ ] `polisher.apikey` and `polisher.provider` exist in localStorage and are non-empty.
- [ ] The setup modal **cannot** be closed in any other way than entering valid credentials and clicking "Save".
- [ ] The "POLISH" button is disabled when:
  - [ ] No API key/provider.
  - [ ] Input text is empty after trimming.
  - [ ] A request is currently in progress.
- [ ] When no level is chosen (invalid state), always fallback to level 3 internally.
- [ ] If the provider returns an error:
  - [ ] Show a readable error toast.
  - [ ] Preserve user input intact.
  - [ ] Log the full error in the browser console.
- [ ] LLM usage:
  - [ ] Single-turn only (no history, no streaming).
  - [ ] Always attach system prompt with full set of rules.
  - [ ] Use GPT 5.2 model via Abacus with `temperature = 0.5`.


## 12. Non-Goals / Future TODOs (explicitly do NOT implement now)

These are future features and should be left as commented TODOs or separate notes:
- [ ] Allow user to choose additional rules (like the dash normalization rule) to apply.
- [ ] Use rich text input and rich text output.
- [ ] Allow choosing model and temperature.
- [ ] Add a button to copy edited text.


## 13. Final Integration Checks

- [ ] Verify localStorage keys:
  - [ ] `polisher.apikey`
  - [ ] `polisher.provider`
- [ ] Verify UI flow:
  - [ ] On first load with no stored values, modal appears and main app is blocked.
  - [ ] After saving valid API key & provider, modal closes and app becomes interactive.
  - [ ] POLISH button only enabled when input is non-empty and no request is in progress.
  - [ ] Level description updates correctly with slider changes.
  - [ ] LLM responses appear in the output box.
  - [ ] Errors show toast and log details to console.
- [ ] Ensure styling respects:
  - [ ] Accent orange: `#ff9514`.
  - [ ] Dark gray: `#282828`.
  - [ ] Background: `#d6d6d6`.
  - [ ] Default text: black.
