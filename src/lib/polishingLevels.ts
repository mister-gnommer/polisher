export interface PolishingLevel {
  title: string;
  description: string;
}

export const DEFAULT_POLISHING_LEVEL = 3;

export const POLISHING_LEVELS: Record<number, PolishingLevel> = {
  1: {
    title: 'Technical Correction',
    description:
      'Fix objective errors and typos only (including tense, conditionals, and phrasing that is grammatically "wrong"). Preserve the original structure and tone. Keep edits minimal: make it correct, not different.',
  },
  2: {
    title: 'Basic Cleanup',
    description:
      "Correct errors and lightly smooth readability (punctuation fixes, splitting run-on sentences, small reordering for clarity). Keep the user's voice unmistakably intact and stay close to copy-paste.",
  },
  3: {
    title: 'Moderate Enhancement',
    description:
      'Improve flow and word choice in a noticeable but restrained way. Keep it natural and non-corporate, and ensure it still sounds like something a B2/C1 writer could realistically produce with effort-not like it was professionally rewritten.',
  },
  4: {
    title: 'Advanced Refinement (Aspirational Voice)',
    description:
      'Shape the message into a more confident, crisp version while staying faithful to the user\'s voice. Reduce ambiguity, tighten phrasing, and make the writing feel like the "best version of the same person," not a different persona.',
  },
  5: {
    title: 'Professional/Formal',
    description:
      'Rewrite for a formal, public-facing context with a professional tone. Minimize slang and casual phrasing, use precise wording, and make it suitable for a website, announcement, or external email.',
  },
};

export const FLOW_DESCRIPTIONS: Record<number, string> = {
  1: 'You may add logical paragraph breaks where they are clearly missing. Do not reorder sentences or otherwise restructure the content.',
  2: 'You may lightly improve paragraph structure and add transitions between ideas where it helps readability. Keep reordering minimal.',
  3: 'You may restructure paragraphs and reorder ideas to create a clearer logical flow where it helps reader comprehension. Preserve all key points.',
  4: 'You may optimize the reader\'s journey through the text: lead with the strongest point, group related ideas, and ensure each paragraph has a clear purpose. Only restructure where it clearly improves readability.',
  5: 'You may reorganize freely for maximum clarity and impact: lead with the core message, remove digressions, and ensure the text flows logically from introduction to conclusion.',
};

export const isValidPolishingLevel = (value: number): boolean =>
  Number.isInteger(value) && value >= 1 && value <= 5;

export const getEffectiveLevel = (level: number | null): number => {
  if (level !== null && isValidPolishingLevel(level)) {
    return level;
  }
  return DEFAULT_POLISHING_LEVEL;
};
