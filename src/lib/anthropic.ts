import OpenAI from 'openai';

// Named 'anthropic' to minimize diffs in existing routes
export const anthropic = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});
