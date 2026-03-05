# Polisher

Polisher is a small frontend-only web app that wraps an LLM API to improve users' writing. The user supplies their own API key; Polisher adds a structured system prompt and sends a single-turn request to the provider.

> This project follows a **sane AI-assisted workflow**: most of the boilerplate and wiring were drafted by LLMs, but **every important decision and implementation detail was reviewed and adjusted by a human** (the author). The goal is to use AI as power tools, not a replacement for judgment.

## Tech Stack

- **Framework:** Astro (static-first)
- **Interactivity:** React islands (single main `PolisherApp` component)
- **Language:** TypeScript
- **Styling:** Plain CSS
- **Hosting / CI/CD:** Vercel (Hobby / free tier)

## What It Does

- Stores **API key** and **provider** in `localStorage` as:
  - `polisher.apikey`
  - `polisher.provider`
- Blocks the app with a modal until both are set
- Lets the user:
  - Paste or write text
  - Pick a polishing level (1–5) on a slider
  - Click **POLISH** to send a single LLM request
- Shows the edited text in a result box
- Handles provider errors with a simple toast (user input is never destroyed)

## Polishing Levels

Five levels control how aggressive the editing is:

1. **Technical Correction** – Fix objective errors only; keep structure and tone.
2. **Basic Cleanup** – Light readability fixes; voice stays clearly the user’s.
3. **Moderate Enhancement** – Better flow/wording, still plausibly written by a B2/C1 human.
4. **Advanced Refinement** – "Best version of the same person"; crisper and clearer.
5. **Professional/Formal** – Formal, public-facing tone suitable for external communication.

If anything goes wrong with the level state, the app falls back to **level 3** internally.

## System Prompt & LLM Use

- **Model:** `gpt-5.2` via Abacus RouteLLM
- **Temperature:** `0.5`
- **Mode:** Single-turn (no history, no streaming)

Each request includes a system prompt that:

- Describes the selected level in natural language
- Instructs the model to:
  - Return **only** the edited text (no explanations)
  - Keep the original language
  - Respect the user’s voice and level constraints
  - Normalize all dashes to standard hyphen-minus `-`

## Guardrails

- Setup modal:
  - Blocks the entire app when no API key/provider in `localStorage`
  - Cannot be dismissed except by entering valid values and saving
- `POLISH` button is disabled when:
  - API key or provider is missing
  - Text input is empty after `trim()`
  - A request is currently in progress
- On provider error:
  - User input is preserved
  - A readable error toast is shown
  - Full error details are logged to the console

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment (Vercel)

- Connect the GitHub repo to Vercel
- Ensure **Production Branch** is `main`
- Every push to `main` triggers a new production build and deployment on Vercel’s free Hobby tier.

## Future Ideas (Not Implemented Yet)

- Additional user-selectable rules (beyond dash normalization)
- Rich text input/output
- Model and temperature selection
- One-click "Copy edited text" button
