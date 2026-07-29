## Why

The current polishing levels operate at the word and sentence level (correctness, word choice, phrasing). Users sometimes want help with paragraph-level readability — restructuring ideas so the text flows logically for the reader — without necessarily increasing the correctness-editing intensity. A separate toggle lets users decouple "how much you edit" (the level slider) from "what kind of editing" (correctness vs. conceptual flow), giving finer control.

## What Changes

- Add a new "Improve readability flow" toggle in the controls panel, side-by-side with the existing "Live polish" toggle
- Introduce per-level flow improvement prompts (MAY semantics — changes are optional, not required) that tell the LLM to improve paragraph-level structure and reader comprehension
- Tone down flow/structure language in level 4 and 5 descriptions so the toggle owns that concern
- Persist toggle state in localStorage (key: `polisher.flowImprovement`)
- Wire the toggle into `buildSystemPrompt` so flow instructions are appended only when enabled
- The toggle is disabled when the UI is in a blocked state (same as Live polish)

## Capabilities

### New Capabilities

- `flow-improvement-toggle`: A UI toggle that enables paragraph-level readability improvements with MAY semantics, intensity gated by the polishing level slider. Includes per-level prompt descriptions, localStorage persistence, and integration into the existing prompt-building pipeline.

### Modified Capabilities

None — no existing specs to modify.

## Impact

- **Files changed**: `src/components/PolisherApp.tsx` (state, UI toggle, localStorage), `src/components/PolisherApp.css` (toggle-row layout), `src/lib/polishPrompt.ts` (`buildSystemPrompt` signature and logic), `src/lib/polishingLevels.ts` (flow descriptions, L4/L5 tone-down)
- **No API changes** — system prompt is built client-side, `POST /api/polish` unchanged
- **No new dependencies**
- **No breaking changes** — existing level descriptions tweaked but semantics preserved
