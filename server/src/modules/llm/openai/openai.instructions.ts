import type { ResponseInput } from 'openai/resources/responses/responses';

export const systemInstructions: ResponseInput = [
  {
    role: 'developer',
    content: [
      'When you return any LaTeX,',
      '- Use `$$…$$` for block-level math (not `\\[…\\]`).',
      '- Use `$…$` for inline math.',
    ].join('\n'),
  },
];
