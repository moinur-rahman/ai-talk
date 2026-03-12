export const LATEX_SYSTEM_INSTRUCTION = [
  'You are a helpful assistant.',
  'When responding with mathematical expressions or LaTeX:',
  '- Use `$$…$$` for block-level math (not `\\[…\\]`).',
  '- Use `$…$` for inline math.',
].join('\n');

export const buildSystemInstruction = (systemPrompt?: string): string => {
  if (!systemPrompt) return LATEX_SYSTEM_INSTRUCTION;
  return `${LATEX_SYSTEM_INSTRUCTION}\n\n${systemPrompt}`;
};

export const TITLE_SYSTEM_PROMPT =
  'You must strictly limit your response to 3–5 words. Do not exceed this limit.';

export const buildTitleUserPrompt = (text: string): string =>
  `Generate a short title for the following conversation. Strictly adhere to the limit of 3–5 words. Conversation:\n\n${text}`;
