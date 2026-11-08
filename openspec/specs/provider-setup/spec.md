# provider-setup Specification

## Purpose

Defines how the user configures their provider, API key, and model, how that configuration is stored on the device, and how it can be changed later without losing other preferences.

## Requirements

### Requirement: Provider selection in setup
The setup modal SHALL list every supported provider (Abacus.ai, OpenRouter) in the provider select. Abacus.ai SHALL remain the default selection on first-time setup.

#### Scenario: OpenRouter is selectable
- **WHEN** the setup modal is open
- **THEN** the provider select contains "Abacus.ai" and "OpenRouter"

### Requirement: Model field for user-supplied-model providers
The setup modal SHALL show a text "Model" field only while the selected provider uses a user-supplied model. The field SHALL show an example OpenRouter model ID as placeholder and SHALL be required while shown.

#### Scenario: Model field appears for OpenRouter
- **WHEN** the user selects "OpenRouter" in the setup modal
- **THEN** a "Model" text field is shown

#### Scenario: Model field hidden for Abacus
- **WHEN** the user selects "Abacus.ai" in the setup modal
- **THEN** no "Model" field is shown

### Requirement: Model ID validation
On save, the setup modal SHALL trim the model ID and reject it with an inline error when it is empty, contains whitespace, or lacks a `/` separating a non-empty vendor and model name. The modal SHALL NOT check that the model exists.

#### Scenario: Empty model rejected
- **WHEN** OpenRouter is selected and the user saves with a blank model field
- **THEN** an inline error says a model is required and nothing is saved

#### Scenario: Malformed model rejected
- **WHEN** OpenRouter is selected and the user saves with model `gpt-5.2`
- **THEN** an inline error says the model must look like `vendor/model` and nothing is saved

#### Scenario: Well-formed model accepted
- **WHEN** OpenRouter is selected, a key is entered, and the user saves with model `  meta-llama/llama-4-scout:free  `
- **THEN** the model `meta-llama/llama-4-scout:free` is saved

### Requirement: Setup persistence
On successful save the system SHALL store the API key in `polisher.apikey`, the provider id in `polisher.provider`, and, for a user-supplied-model provider, the model ID in `polisher.model`. For a fixed-model provider, `polisher.model` SHALL be removed.

#### Scenario: OpenRouter setup persisted
- **WHEN** the user saves OpenRouter with a key and model `openai/gpt-5.2` and reloads the page
- **THEN** the app opens without the setup modal and polishes with OpenRouter and `openai/gpt-5.2`

#### Scenario: Switching to Abacus clears model
- **WHEN** the user switches from OpenRouter to Abacus.ai and saves
- **THEN** `polisher.model` is no longer present in localStorage

### Requirement: Incomplete stored setup reopens setup
On load, the system SHALL treat setup as incomplete and open the setup modal when the API key or provider is missing, or when the stored provider uses a user-supplied model and `polisher.model` is missing or blank.

#### Scenario: OpenRouter without stored model
- **WHEN** localStorage has a key and `polisher.provider = "openrouter"` but no `polisher.model`
- **THEN** the setup modal opens on load

#### Scenario: Existing Abacus users unaffected
- **WHEN** localStorage has a key and `polisher.provider = "abacus"` and no `polisher.model`
- **THEN** the app opens without the setup modal

### Requirement: Change provider from Settings
The Settings modal SHALL offer a "Change provider" action. It SHALL close Settings and open the setup modal prefilled with the current provider and model. Live polish and flow toggle preferences SHALL be kept.

#### Scenario: Open setup from Settings
- **WHEN** the user clicks "Change provider" in Settings
- **THEN** Settings closes and the setup modal opens with the current provider selected and, for OpenRouter, the current model filled in
- **AND** the live polish and flow toggles keep their current state

### Requirement: Cancel change provider
When the setup modal was opened via "Change provider", it SHALL offer a Cancel action that closes it and keeps the previous configuration. First-time setup and setup after clearing settings SHALL NOT offer Cancel.

#### Scenario: Cancel keeps previous setup
- **WHEN** the user opens "Change provider", edits fields, and clicks Cancel
- **THEN** the modal closes and the previous provider, key, and model remain in use and in localStorage

#### Scenario: No cancel on first setup
- **WHEN** the setup modal opens because no setup is stored
- **THEN** no Cancel action is shown

### Requirement: API key reuse when provider is unchanged
When the setup modal was opened via "Change provider", the API key field SHALL start empty. Saving with an empty key SHALL keep the current key only if the selected provider equals the current provider; otherwise a key SHALL be required.

#### Scenario: Change only the model
- **WHEN** the current provider is OpenRouter and the user changes only the model, leaving the key blank, and saves
- **THEN** the new model is saved and the existing key is kept

#### Scenario: Switch provider requires a key
- **WHEN** the current provider is Abacus.ai and the user selects OpenRouter with a blank key and saves
- **THEN** an inline error says the API key is required and nothing is saved

### Requirement: Clear settings removes model
"Clear all local settings" SHALL also remove `polisher.model`.

#### Scenario: Clear after OpenRouter setup
- **WHEN** the user has OpenRouter configured and clicks "Clear all local settings"
- **THEN** `polisher.model` is removed along with the other Polisher keys and the setup modal opens without Cancel
