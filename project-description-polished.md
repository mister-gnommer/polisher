# polisher

## project overview

This project is an LLM API wrapper that makes it easier to improve users' writing. Using an LLM API key provided by the user, it takes the user’s text, adds an appropriate system prompt, and sends it to the LLM to polish it.

## project details

### setup

Before beginning, the user has to provide an API key and choose a provider. At the beginning there is only abacus.ai, but the system design should allow adding new providers easily (with changing code, but not refactoring half an app). The chosen provider and API key should be kept in local storage.

If there is no API key and provider in local storage, show a modal with a backdrop blocking the whole app to force entering them. Also disable inputs and buttons programmatically just in case. The modal can't be dismissed or closed in any other way than by providing an API key and choosing a provider.

### design

The application should be clear and use two accent/main colors: orange `#ff9514` and dark grey `#282828`. Text should be black and the background can be light grey `#d6d6d6`.

### usage

When an API key is provided, the user sees a large text input. Below it there is a slider with 5 polishing levels (described below), set to 3 by default. Next to the slider is a "POLISH" button, and below the slider there is the chosen level description (as below) in a light font.

The response with the edited text appears in a box below the level description.

### polishing levels

1. Technical Correction
   Fix objective errors and typos only (including tense, conditionals, and phrasing that is grammatically “wrong”). Preserve the original structure and tone. Keep edits minimal: make it correct, not different.

2. Basic Cleanup
   Correct errors and lightly smooth readability (punctuation fixes, splitting run-on sentences, small reordering for clarity). Keep the user’s voice unmistakably intact and stay close to copy-paste.

3. Moderate Enhancement
   Improve flow and word choice in a noticeable but restrained way. Keep it natural and non-corporate, and ensure it still sounds like something a B2/C1 writer could realistically produce with effort—not like it was professionally rewritten.

4. Advanced Refinement (Aspirational Voice)
   Shape the message into a more confident, crisp, well-structured version while staying faithful to the user’s voice. Reduce ambiguity, tighten phrasing, and make the writing feel like the “best version of the same person,” not a different persona.

5. Professional/Formal
   Rewrite for a formal, public-facing context with maximal clarity and a professional tone. Minimize slang and casual phrasing, use precise wording, and make it suitable for a website, announcement, or external email.

### other

Returned text should always use short dashes / minus signs (`-`) instead of long dashes (`–`).

## implementation/technical details

### technical stack and hosting

This is a frontend-only app to be hosted using the free tier of Vercel or Netlify or similar. 
The API key and name of the chosen provider are stored in local storage as `polisher.apikey` and `polisher.provider`.

### API handling

When communicating with the LLM API, use only a single-turn approach (no sending history). There is also no streaming planned.

### system prompt

For now, the app should use by default the GPT 5.2 API provided by Abacus with temperature set to 0.5. 
Each time a request is sent to the LLM, there should be a system prompt attached:

"You are a strict text editor. Edit text provided by user according to this level: {{chosen level description here}}.

Rules:

Respond with the edited text only. Do not add explanations, comments, or headings.
Do not change the language of the text.
Respect the user’s voice and constraints defined in the level description.
Always normalize dashes: use the standard hyphen-minus character - instead of any en dash, em dash, or similar characters.
"

### edge cases and errors

The "POLISH" button is disabled until an API key and provider are stored in local storage. It is also disabled until there is anything in the text input (check after trimming).

When no level is chosen (for example by an overly tech-savvy user), fall back to level 3.

If the provider returns an error, show a simple, readable error toast and keep the user’s input intact. Show the full error in the console to allow debugging.

## future development (TODO list) - DO NOT IMPLEMENT NOW!

- [ ] allow user to choose additional rules (like the one with dashes) to use
- [ ] use rich text input and return
- [ ] allow choosing model and temperature
- [ ] button to copy edited text
