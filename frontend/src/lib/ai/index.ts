/**
 * AI Integration Module
 * 
 * Provides BYOK (Bring Your Own Key) AI integration.
 * Uses OpenAI API directly from the client - no backend involvement.
 */

export {
  // Client
  saveApiKey,
  getApiKey,
  clearApiKey,
  hasApiKey,
  saveSettings,
  getSettings,
  testApiKey,
  complete,
  streamComplete,
  AI_MODELS,
  type AIConfig,
  type AIModel,
  type AIMessage,
  type AIStreamCallbacks,
  type AISettings,
} from './client';

export {
  // Prompts
  AI_PROMPTS,
  getCommandPrompt,
  estimateTokens,
  truncateContext,
  type AICommandPrompt,
} from './prompts';

export {
  // Commands
  aiCommands,
  shouldShowAICommands,
  filterAICommands,
  type AICommand,
} from './commands';