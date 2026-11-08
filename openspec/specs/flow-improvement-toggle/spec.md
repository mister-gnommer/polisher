# flow-improvement-toggle Specification

## Purpose

An optional "Improve readability flow" toggle that adds per-level flow instructions to the polishing prompt without affecting any other behavior.

## Requirements

### Requirement: Flow improvement toggle in UI
The system SHALL display a toggle labeled "Improve readability flow" in the controls panel, positioned side-by-side with the "Live polish" toggle. The toggle SHALL use the same visual style (checkbox hidden, custom track/thumb via `.live-toggle-*` classes).

#### Scenario: Toggle is visible and clickable
- **WHEN** the app is loaded and the user is authenticated
- **THEN** the "Improve readability flow" toggle is visible in the controls panel next to "Live polish"
- **AND** clicking the toggle changes its visual state between on and off

#### Scenario: Toggle disabled when blocked
- **WHEN** the UI is in an interaction-blocked state (setup modal open, or loading without live polish)
- **THEN** the "Improve readability flow" toggle is disabled and non-interactive

### Requirement: Flow toggle persistence in localStorage
The system SHALL persist the flow toggle state in `localStorage` under the key `polisher.flowImprovement`. The persisted value SHALL be the string `"true"` or `"false"`. On app initialization, the toggle SHALL read its initial state from `localStorage`.

#### Scenario: Toggle state survives page reload
- **WHEN** the user enables the flow toggle and reloads the page
- **THEN** the flow toggle is still enabled on reload

#### Scenario: Toggle defaults to off
- **WHEN** `localStorage` contains no value for `polisher.flowImprovement`
- **THEN** the flow toggle SHALL default to off (false)

### Requirement: Per-level flow improvement prompts
The system SHALL define a separate flow improvement prompt for each polishing level (1-5). Each prompt SHALL use MAY semantics — guiding the LLM to apply changes only where beneficial, without implying changes are required.

#### Scenario: Level 1 flow prompt is minimal
- **WHEN** the polishing level is 1 and flow toggle is on
- **THEN** the flow prompt SHALL instruct the LLM to only add logical paragraph breaks where missing, and SHALL NOT instruct sentence reordering or restructuring

#### Scenario: Level 5 flow prompt allows restructuring
- **WHEN** the polishing level is 5 and flow toggle is on
- **THEN** the flow prompt SHALL instruct the LLM that it MAY reorganize content for maximum clarity and impact

### Requirement: Flow prompts integrated into system prompt
The system SHALL pass the flow improvement prompt to `buildSystemPrompt` when the toggle is enabled. When the toggle is disabled, no flow instructions SHALL be included in the system prompt.

#### Scenario: Flow prompt appended when toggle is on
- **WHEN** the flow toggle is enabled and the user triggers polishing
- **THEN** the system prompt sent to the LLM SHALL include the per-level flow improvement instructions

#### Scenario: No flow prompt when toggle is off
- **WHEN** the flow toggle is disabled and the user triggers polishing
- **THEN** the system prompt sent to the LLM SHALL NOT include any flow improvement instructions

### Requirement: Level descriptions toned down for flow
The system SHALL remove explicit flow/structure language from levels 4 and 5 descriptions, since the flow toggle now owns that concern. Levels 1, 2 and 3 SHALL remain unchanged.

#### Scenario: Level 4 no longer mentions structure
- **WHEN** the app is loaded
- **THEN** the level 4 description SHALL NOT contain the word "well-structured"

#### Scenario: Level 5 no longer mentions maximal clarity
- **WHEN** the app is loaded
- **THEN** the level 5 description SHALL NOT contain the phrase "maximal clarity"

### Requirement: Flow toggle state does not affect diff-driven behaviors
The system SHALL NOT change the behavior of the output panel (diff view, copy), celebration toast, or error toast based on the flow toggle state. The flow toggle SHALL only affect prompt construction.

#### Scenario: Celebration triggers independently of flow toggle
- **WHEN** conditions for celebration are met (level ≥ 3, > 20 words, < 10% diff ratio)
- **THEN** the celebration toast SHALL display regardless of whether the flow toggle is on or off
