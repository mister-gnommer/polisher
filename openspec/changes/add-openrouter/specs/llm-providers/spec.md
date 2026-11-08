# Spec Delta

## Purpose

Defines which LLM providers Polisher can use, how polish requests reach them through the same-origin server proxy, and how each provider's model is determined.

## ADDED Requirements

### Requirement: Supported providers
The system SHALL support exactly two providers: Abacus.ai (id `abacus`) and OpenRouter (id `openrouter`). Any other provider id SHALL be rejected by the proxy.

#### Scenario: OpenRouter is a valid provider
- **WHEN** the client sends `POST /api/polish` with `provider: "openrouter"`, a non-empty `apiKey`, `inputText`, `systemPrompt`, and `model`
- **THEN** the proxy forwards the request to OpenRouter and does not reject the provider id

#### Scenario: Unknown provider is rejected
- **WHEN** the client sends `POST /api/polish` with `provider: "foo"`
- **THEN** the proxy responds with status 400 and an `error` message naming the unsupported provider

### Requirement: Requests go through the same-origin proxy
The browser SHALL send polish requests only to `POST /api/polish`. The proxy SHALL call the selected provider's chat completions endpoint server-side, using the API key from the request body as a Bearer token. No API key SHALL be read from server environment variables.

#### Scenario: OpenRouter request is proxied
- **WHEN** the user polishes text with OpenRouter selected
- **THEN** the browser calls `/api/polish` and the server calls `https://openrouter.ai/api/v1/chat/completions` with `Authorization: Bearer <apiKey>`

### Requirement: Provider model source
Each provider SHALL declare whether it uses a fixed model or a user-supplied model. Abacus SHALL use its fixed model and ignore any `model` in the request. OpenRouter SHALL use the `model` from the request body as-is.

#### Scenario: OpenRouter uses the requested model
- **WHEN** the client sends `provider: "openrouter"` with `model: "openai/gpt-5.2"`
- **THEN** the request to OpenRouter has `model: "openai/gpt-5.2"`

#### Scenario: Abacus ignores a supplied model
- **WHEN** the client sends `provider: "abacus"` with `model: "anything"`
- **THEN** the request to Abacus uses Abacus's fixed model

### Requirement: Model required for user-supplied-model providers
The proxy SHALL reject a request with status 400 when the selected provider uses a user-supplied model and `model` is missing, not a string, or blank.

#### Scenario: Missing OpenRouter model
- **WHEN** the client sends `provider: "openrouter"` without `model`
- **THEN** the proxy responds with status 400 and an `error` stating that a model is required

#### Scenario: Abacus without model is accepted
- **WHEN** the client sends `provider: "abacus"` without `model`
- **THEN** the proxy does not reject the request for a missing model

### Requirement: Provider errors are passed through
When a provider responds with a non-2xx status or without completion text, the proxy SHALL respond with status 502 and an `error` string. The string SHALL be the provider's own error message when the provider returns one, otherwise a generic message including the HTTP status.

#### Scenario: Invalid OpenRouter model slug
- **WHEN** OpenRouter rejects the request because the model ID does not exist and returns an error message
- **THEN** the proxy responds with status 502 and `error` set to OpenRouter's message

#### Scenario: Empty completion
- **WHEN** the provider responds 200 but the first choice has no message content
- **THEN** the proxy responds with status 502 and an `error` stating the response had no completion text

### Requirement: Provider error shown to user
The client error toast SHALL show the `error` string returned by `/api/polish` when present. When the request fails without a usable message (network failure, unparseable response), the toast SHALL show the generic "Something went wrong while contacting the provider. Please try again." message.

#### Scenario: Bad model shown in toast
- **WHEN** `/api/polish` responds 502 with `error: "openai/gpt-nope is not a valid model ID"`
- **THEN** the error toast shows "openai/gpt-nope is not a valid model ID"

#### Scenario: Network failure
- **WHEN** the fetch to `/api/polish` fails with a network error
- **THEN** the error toast shows the generic provider error message
