## 1. Data Layer

- [x] 1.1 Add `FLOW_DESCRIPTIONS: Record<number, string>` with per-level MAY-semantics prompts in `src/lib/polishingLevels.ts`
- [x] 1.2 Tone down L4 description: remove "well-structured"
- [x] 1.3 Tone down L5 description: remove "maximal clarity and a" (keep "a professional tone")

## 2. Prompt Building

- [x] 2.1 Update `buildSystemPrompt` signature to accept optional `flowDescription?: string` in `src/lib/polishPrompt.ts`
- [x] 2.2 Append flow description after level description (with transition phrase) when `flowDescription` is provided

## 3. UI State

- [x] 3.1 Add `FLOW_IMPROVEMENT_KEY = 'polisher.flowImprovement'` constant in `PolisherApp.tsx`
- [x] 3.2 Add `isFlowEnabled` state initialized from localStorage (default `false`)
- [x] 3.3 Add `useEffect` to persist `isFlowEnabled` to localStorage on change
- [x] 3.4 Pass `flowDescription` to `buildSystemPrompt` in `performPolish` (from `FLOW_DESCRIPTIONS[effectiveLevel]` when toggle on)
- [x] 3.5 Include `isFlowEnabled` in `clearSettings` handler (remove from localStorage)

## 4. UI Rendering

- [x] 4.1 Add flow toggle markup side-by-side with live polish toggle (wrapping both in a `.toggle-row` container)
- [x] 4.2 Wire flow toggle's `disabled` attribute to `isInteractionBlocked`
- [x] 4.3 Apply `live-toggle--disabled` class to flow toggle when blocked

## 5. CSS

- [x] 5.1 Add `.toggle-row` class for horizontal layout (display: flex, gap, align-items) in `PolisherApp.css`
- [x] 5.2 Reuse existing `.live-toggle-*` classes for the flow toggle (same visual style)

## 6. Verification

- [x] 6.1 Run `npx tsc --noEmit` to verify no type errors
- [x] 6.2 Run `npm run build` to verify production build succeeds
- [ ] 6.3 Manual test: toggle on → polish → verify flow prompt is included
- [ ] 6.4 Manual test: toggle persists across page reload
- [ ] 6.5 Manual test: toggle is disabled when setup modal is open