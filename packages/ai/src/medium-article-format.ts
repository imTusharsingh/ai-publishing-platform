/** Shared Medium-style article structure used by writer prompts and mock generation. */
export const MEDIUM_EXPLAINER_SECTIONS = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
  summary: 'In summary',
} as const;

export const MEDIUM_EXPLAINER_HTML_FORMAT = [
  'FORMAT (Medium-style explainer):',
  `- Opening <p> with <strong>${MEDIUM_EXPLAINER_SECTIONS.easy}:</strong> then 2-3 short paragraphs using a vivid analogy anyone can follow`,
  `- <h3>Here's the catch:</h3> then <ul> of 2-4 honest limitations or trade-offs`,
  `- <h2>${MEDIUM_EXPLAINER_SECTIONS.moderate}</h2> then 1 setup paragraph + labeled bullet lists (<strong>Type:</strong>, <strong>Speed:</strong>, etc.)`,
  '- Under Moderate: "Advantages of …" and "Things to Consider:" as separate <ul> blocks with 4-6 items each',
  `- <h2>${MEDIUM_EXPLAINER_SECTIONS.hard}</h2> then 4-6 dense technical paragraphs (architecture, internals, concurrency, durability, benchmarks)`,
  `- <h2>${MEDIUM_EXPLAINER_SECTIONS.summary}</h2> then 1-2 synthesis paragraphs tying Easy→Hard together`,
  '- Use h2/h3, p, ul, li, strong only. No h1. Target 1,400-2,200 words.',
].join('\n');
