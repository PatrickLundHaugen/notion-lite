/**
 * AI Client for OpenAI API
 * 
 * Handles direct communication with OpenAI API using user's own key.
 * All API calls are made client-side - no backend involvement.
 */

// ============================================
// Types
// ============================================

export interface AIConfig {
  apiKey: string;
  model: AIModel;
  maxTokens: number;
  temperature: number;
}

export type AIModel = 
  | 'gpt-4o-mini' 
  | 'gpt-4o' 
  | 'gpt-4-turbo' 
  | 'gpt-3.5-turbo';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIStreamCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

// ============================================
// Storage keys
// ============================================

const STORAGE_KEYS = {
  API_KEY: 'pats_notes_ai_key',
  MODEL: 'pats_notes_ai_model',
  SETTINGS: 'pats_notes_ai_settings',
} as const;

// ============================================
// API Key Management
// ============================================

/**
 * Save API key to localStorage
 * Note: For additional security, you could encrypt this
 */
export function saveApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEYS.API_KEY, key);
}

/**
 * Get API key from localStorage
 */
export function getApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEYS.API_KEY);
}

/**
 * Remove API key from localStorage
 */
export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
}

/**
 * Check if API key is configured
 */
export function hasApiKey(): boolean {
  const key = getApiKey();
  return !!key && key.length > 0;
}

// ============================================
// Settings Management
// ============================================

export interface AISettings {
  model: AIModel;
  temperature: number;
  maxTokens: number;
}

const DEFAULT_SETTINGS: AISettings = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 1000,
};

export function saveSettings(settings: Partial<AISettings>): void {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
}

export function getSettings(): AISettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to parse AI settings:', e);
  }
  return DEFAULT_SETTINGS;
}

// ============================================
// OpenAI API Client
// ============================================

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Test if the API key is valid
 */
export async function testApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
    });

    if (response.ok) {
      return { valid: true };
    }

    const data = await response.json();
    return { 
      valid: false, 
      error: data.error?.message || `HTTP ${response.status}`,
    };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Make a non-streaming completion request
 */
export async function complete(
  messages: AIMessage[],
  options?: Partial<AISettings>
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const settings = { ...getSettings(), ...options };

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      max_tokens: settings.maxTokens,
      temperature: settings.temperature,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Make a streaming completion request
 */
export async function streamComplete(
  messages: AIMessage[],
  callbacks: AIStreamCallbacks,
  options?: Partial<AISettings>,
  signal?: AbortSignal
): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) {
    callbacks.onError?.(new Error('API key not configured'));
    return;
  }

  const settings = { ...getSettings(), ...options };

  try {
    callbacks.onStart?.();

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error?.message || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

      for (const line of lines) {
        const data = line.replace('data: ', '').trim();
        
        if (data === '[DONE]') {
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          
          if (content) {
            fullText += content;
            callbacks.onToken?.(content);
          }
        } catch (e) {
          // Ignore parse errors for partial chunks
        }
      }
    }

    callbacks.onComplete?.(fullText);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      callbacks.onComplete?.(error.message || 'Request cancelled');
      return;
    }
    callbacks.onError?.(error instanceof Error ? error : new Error('Unknown error'));
  }
}

// ============================================
// Available Models
// ============================================

export const AI_MODELS: { id: AIModel; name: string; description: string }[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and affordable. Great for most tasks.',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable. Best for complex writing.',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Powerful with long context window.',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fastest and cheapest option.',
  },
];