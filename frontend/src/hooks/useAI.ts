/**
 * Hook for AI state management
 * 
 * Provides reactive access to AI configuration and actions.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  hasApiKey,
  getApiKey,
  saveApiKey,
  clearApiKey,
  testApiKey,
  getSettings,
  saveSettings,
  type AISettings,
} from '@/lib/ai';

export interface UseAIReturn {
  // State
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  settings: AISettings;
  
  // Actions
  configure: (apiKey: string) => Promise<boolean>;
  updateSettings: (settings: Partial<AISettings>) => void;
  clearConfiguration: () => void;
  testConnection: () => Promise<boolean>;
}

export function useAI(): UseAIReturn {
  const [isConfigured, setIsConfigured] = useState(hasApiKey());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AISettings>(getSettings());

  // Check configuration on mount
  useEffect(() => {
    setIsConfigured(hasApiKey());
    setSettings(getSettings());
  }, []);

  /**
   * Configure AI with a new API key
   */
  const configure = useCallback(async (apiKey: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate the key
      const result = await testApiKey(apiKey);
      
      if (result.valid) {
        saveApiKey(apiKey);
        setIsConfigured(true);
        return true;
      } else {
        setError(result.error || 'Invalid API key');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate key');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update AI settings
   */
  const updateSettings = useCallback((newSettings: Partial<AISettings>) => {
    saveSettings(newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  /**
   * Clear AI configuration
   */
  const clearConfiguration = useCallback(() => {
    clearApiKey();
    setIsConfigured(false);
    setError(null);
  }, []);

  /**
   * Test the current configuration
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError('No API key configured');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await testApiKey(apiKey);
      
      if (!result.valid) {
        setError(result.error || 'Connection failed');
      }
      
      return result.valid;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isConfigured,
    isLoading,
    error,
    settings,
    configure,
    updateSettings,
    clearConfiguration,
    testConnection,
  };
}

/**
 * Simple hook to check if AI is available
 */
export function useAIAvailable(): boolean {
  const [available, setAvailable] = useState(hasApiKey());

  useEffect(() => {
    // Check periodically in case key is added/removed in another tab
    const check = () => setAvailable(hasApiKey());
    check();
    
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  return available;
}