/**
 * AI Command Prompts
 * 
 * System prompts and templates for each AI command.
 * These are carefully crafted to produce consistent, high-quality results.
 */

export interface AICommandPrompt {
  system: string;
  buildUserPrompt: (context: string, selection?: string) => string;
}

// ============================================
// System Prompts
// ============================================

const BASE_INSTRUCTIONS = `You are a writing assistant integrated into a note-taking app. 
Your responses should:
- Be clear and well-structured
- Match the user's writing style when improving existing text
- Use proper formatting (paragraphs, not bullet points unless requested)
- Be concise but thorough
- Never include meta-commentary about the task`;

// ============================================
// Command Prompts
// ============================================

export const AI_PROMPTS: Record<string, AICommandPrompt> = {
  // Improve writing quality
  improve: {
    system: `${BASE_INSTRUCTIONS}

Your task is to improve the provided text while preserving the original meaning and voice.
Focus on:
- Clarity and readability
- Grammar and punctuation
- Flow and transitions
- Word choice (remove redundancy, use stronger verbs)

Return ONLY the improved text, nothing else.`,
    buildUserPrompt: (_, selection) => `Improve this text:\n\n${selection}`,
  },

  // Make text shorter
  shorter: {
    system: `${BASE_INSTRUCTIONS}

Your task is to make the text more concise without losing important information.
- Remove redundant words and phrases
- Combine sentences where appropriate
- Keep the core message intact
- Aim for 30-50% reduction in length

Return ONLY the shortened text, nothing else.`,
    buildUserPrompt: (_, selection) => `Make this text shorter:\n\n${selection}`,
  },

  // Make text longer
  longer: {
    system: `${BASE_INSTRUCTIONS}

Your task is to expand the text with more detail and depth.
- Add relevant examples or explanations
- Expand on key points
- Improve transitions between ideas
- Keep the same tone and style
- Aim for 50-100% increase in length

Return ONLY the expanded text, nothing else.`,
    buildUserPrompt: (_, selection) => `Expand this text with more detail:\n\n${selection}`,
  },

  // Fix grammar and spelling
  fix: {
    system: `${BASE_INSTRUCTIONS}

Your task is to fix grammar, spelling, and punctuation errors.
- Correct all grammatical mistakes
- Fix spelling errors
- Improve punctuation
- Do NOT change the writing style or meaning
- Do NOT rephrase unless necessary for grammar

Return ONLY the corrected text, nothing else.`,
    buildUserPrompt: (_, selection) => `Fix the grammar and spelling in this text:\n\n${selection}`,
  },

  // Continue writing
  continue: {
    system: `${BASE_INSTRUCTIONS}

Your task is to continue writing from where the user left off.
- Match the tone, style, and voice of the existing text
- Continue the logical flow of ideas
- Write 2-4 sentences that naturally extend the content
- If it's a list, continue the list format
- If it's a paragraph, continue in paragraph form

Return ONLY the continuation text (do not repeat the original), nothing else.`,
    buildUserPrompt: (context) => 
      `Continue writing from this text (provide only the continuation):\n\n${context}`,
  },

  // Summarize
  summarize: {
    system: `${BASE_INSTRUCTIONS}

Your task is to create a clear, concise summary.
- Capture the main points and key information
- Use bullet points for multiple distinct ideas
- Keep it to 3-5 bullet points or 2-3 sentences
- Preserve important details

Return ONLY the summary, nothing else.`,
    buildUserPrompt: (context, selection) => {
      const text = selection || context;
      return `Summarize this text:\n\n${text}`;
    },
  },

  // Change tone - Professional
  professional: {
    system: `${BASE_INSTRUCTIONS}

Your task is to rewrite the text in a professional, formal tone.
- Use formal language and complete sentences
- Remove casual expressions and slang
- Maintain clarity and precision
- Keep the same meaning and information

Return ONLY the rewritten text, nothing else.`,
    buildUserPrompt: (_, selection) => 
      `Rewrite this in a professional tone:\n\n${selection}`,
  },

  // Change tone - Casual
  casual: {
    system: `${BASE_INSTRUCTIONS}

Your task is to rewrite the text in a casual, friendly tone.
- Use conversational language
- Add contractions where natural
- Keep it approachable and easy to read
- Maintain the same meaning and information

Return ONLY the rewritten text, nothing else.`,
    buildUserPrompt: (_, selection) => 
      `Rewrite this in a casual, friendly tone:\n\n${selection}`,
  },

  // Explain
  explain: {
    system: `${BASE_INSTRUCTIONS}

Your task is to explain the concept or topic clearly.
- Break down complex ideas into simple terms
- Use examples where helpful
- Structure the explanation logically
- Keep it concise but thorough

Return ONLY the explanation, nothing else.`,
    buildUserPrompt: (_, selection) => 
      `Explain this in simple terms:\n\n${selection}`,
  },

  // Custom prompt
  custom: {
    system: `${BASE_INSTRUCTIONS}

Follow the user's specific instructions for this text.`,
    buildUserPrompt: (context, selection) => {
      // Selection contains the custom instruction for this command
      return `${selection}\n\nContext/text to work with:\n${context}`;
    },
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get the prompt for a specific command
 */
export function getCommandPrompt(
  commandId: string,
  context: string,
  selection?: string
): { system: string; user: string } {
  const prompt = AI_PROMPTS[commandId];
  
  if (!prompt) {
    throw new Error(`Unknown AI command: ${commandId}`);
  }

  return {
    system: prompt.system,
    user: prompt.buildUserPrompt(context, selection),
  };
}

/**
 * Calculate approximate token count (rough estimate)
 * OpenAI uses ~4 characters per token on average
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate context to fit within token limits
 */
export function truncateContext(
  text: string, 
  maxTokens: number = 2000
): string {
  const estimatedTokens = estimateTokens(text);
  
  if (estimatedTokens <= maxTokens) {
    return text;
  }

  // Truncate to approximate length
  const maxChars = maxTokens * 4;
  return text.slice(-maxChars); // Keep the most recent text
}