## Context

Polisher currently has a single editing axis: the 1-5 polishing level slider. Each level blends correctness and readability improvements — level 1 is errors-only, level 5 is a formal rewrite. The "Live polish" toggle controls timing (debounced auto-polish vs. manual button).

The user wants to decouple "how much" from "what kind" by adding a second boolean axis: a flow/readability toggle that operates at the paragraph/concept level (transitions, logical ordering, scannability) rather than the word/sentence level (typos, word choice, phrasing). The toggle's intensity is gated by the level slider (level 1 = paragraph breaks only; level 5 = full restructuring), and the LLM is instructed to apply changes only where beneficial (MAY semantics).

## Goals / Non-Goals

**Goals:**
- Add a "Improve readability flow" toggle in the controls panel, side by side with "Live polish"
- Define per-level flow improvement prompts with MAY semantics
- Integrate flow prompt into the existing `buildSystemPrompt` pipeline
- Persist toggle state in localStorage
- Tone down flow/structure language in levels 4 and 5 so the toggle owns that concern

**Non-Goals:**
- Changing the API (`POST /api/polish` unchanged)
- Adding context indicators (future feature)
- Adding any other focus-area toggles beyond flow (future pattern)
- Modifying celebration/diff/copy/error behaviors

## Decisions

### Decision 1: Per-level flow descriptions (Option B)

Each polishing level gets its own flow improvement description string. When the toggle is on, `buildSystemPrompt` receives both `levelDescription` and `flowDescription` and merges them.

**Rationale**: Gives full control over what "flow" means at each level. Unlike Option A (single conditional block), the LLM doesn't need to infer intensity from the level description — it's explicit. Unlike Option C (two separate LLM calls), it's simple and avoids doubling API cost.

**Alternatives considered**:
- Option A (single conditional block): "Improve readability proportional to the editing level." Rejected because LLM may not proportion correctly and it's harder to tune per-level.
- Option C (separate LLM calls): One call for correctness, one for flow. Rejected as overengineered for this use case.

### Decision 2: Side-by-side toggle layout

The flow toggle and live polish toggle share a horizontal row in the controls panel. This uses the existing `.live-toggle-*` CSS classes (renamed generically for shared use).

**Rationale**: Clean at two toggles, visually groups "modifiers" together. The alternative (stacked toggles) scales better for more toggles in the future but takes more vertical space and feels heavier for just two.

### Decision 3: Flow prompts use MAY semantics

Each flow prompt instructs the LLM that flow improvements are optional — "where it helps," "if beneficial," "where it clearly improves readability." The prompt does not imply changes are required or expected.

**Rationale**: The user observed that the LLM always tries to find something to change even when the text is already good. Flow edits should be truly optional, not a mandate to restructure.

### Decision 4: `buildSystemPrompt` signature change

```ts
// Before
export const buildSystemPrompt = (levelDescription: string) => ...

// After
export const buildSystemPrompt = (levelDescription: string, flowDescription?: string) => ...
```

When `flowDescription` is provided, it's appended after the level description with a transition phrase like "Additionally, where it improves readability:".

**Rationale**: Minimal change to existing API. Backward compatible (callers that omit the second argument behave as before). No new data flowing through the API proxy.

### Decision 5: localStorage key `polisher.flowImprovement`

Follows the existing convention: `polisher.livePolish`, `polisher.apikey`, `polisher.provider`. Stored as `"true"` / `"false"` (stringified boolean).

**Rationale**: Consistent with existing patterns. No premature generalization (e.g., a single `polisher.features` JSON key) for just two items.

### Decision 6: L4 and L5 descriptions toned down

Level 4: Remove "well-structured" → "Shape the message into a more confident, crisp version..."
Level 5: Remove "maximal clarity and" → "Rewrite for a formal, public-facing context with a professional tone..."
Level 3: Unchanged.

**Rationale**: At levels 4-5, the flow toggle now carries the paragraph-level restructuring burden. Keeping "well-structured" and "maximal clarity" in the base descriptions would cause the LLM to double-dose flow edits at those levels.

## Risks / Trade-offs

- **[Risk] LLM may ignore MAY semantics and over-polish flow at low levels.** → Mitigation: Start with conservative flow prompts; iterate based on observed outputs.
- **[Risk] Two-toggle row may be visually cramped on narrow viewports.** → Mitigation: The `.live-toggle` styles are compact (gap: 0.5rem, font-size: 0.85rem). If needed, they can wrap to two rows via flex-wrap.
- **[Trade-off] Adding a second localStorage key** instead of a single `polisher.features` JSON key. → Acceptable: only two keys exist; a migration can be done later if more toggles are added.
