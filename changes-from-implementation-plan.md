# Changes from Implementation Plan

This file documents intentional deviations from `polisher-implementation-plan.md` and `project-description-polished.md`.

## 1) Abacus endpoint assumption

- **Plan expectation:** "Use Abacus RouteLLM API", but no exact URL was provided.
- **Implemented:** `https://api.abacus.ai/v1/chat/completions` in `src/lib/providers/abacus.ts`.
- **Rationale:** The payload format in the plan matches an OpenAI-compatible chat-completions endpoint. This URL is a practical default for an Abacus-hosted API with that schema.

## 2) Server-side proxy for API calls (CORS fix)

- **Plan expectation:** Frontend-only app; provider called directly from the browser.
- **Implemented:** `src/pages/api/polish.ts` — an Astro server-side API route that acts as a proxy. The client calls `/api/polish`, and the server forwards the request to the Abacus API. The Astro config was switched to `output: "hybrid"` to enable this route while keeping all other pages static.
- **Rationale:** Abacus (and most LLM APIs) do not set `Access-Control-Allow-Origin` headers, so direct browser-to-API calls are blocked by CORS policy. A same-origin server proxy is the standard solution. The app is still "frontend-only" in spirit — it has no database or persistent state on the server; the proxy is purely a pass-through. The `@astrojs/vercel` adapter is used, deploying the proxy as a Vercel serverless function. The main page (`/`) remains a statically prerendered HTML file.

## 2) Setup modal form behavior

- **Plan expectation:** Blocking modal that can only close after valid setup.
- **Implemented:** Exact blocking behavior, plus HTML `required` validation on the API key field and inline setup error text.
- **Rationale:** This preserves the non-dismissable guardrail while improving validation feedback.

## 3) Toast behavior (enhanced)

- **Plan expectation:** Toast with optional auto-hide or manual dismiss.
- **Implemented:** Both auto-hide (6s) and manual dismiss button.
- **Rationale:** Better UX without changing core requirements.

## 4) Level state initialization detail

- **Plan expectation:** `level` can be `null` and must fall back to 3 when invalid.
- **Implemented:** `level` type is `number | null`, initialized to `3`, with explicit runtime fallback to `3` via `getEffectiveLevel()`.
- **Rationale:** Safer default UX while preserving the required fallback path for null/invalid states.

## 5) Additional quality-of-life UI details

- **Plan expectation:** Main required controls and output.
- **Implemented:** Added input character count and a clear output placeholder/loading text.
- **Rationale:** Small usability improvement; no behavioral conflict with the plan.
