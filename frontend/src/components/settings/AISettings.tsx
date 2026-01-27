import { useState } from 'react';
import { Eye, EyeOff, Key, Loader2, CheckCircle, AlertCircle, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAI } from '@/hooks/useAI';
import { AI_MODELS, type AIModel } from '@/lib/ai';

// Custom Slider component (brutalist style)
interface CustomSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

function CustomSlider({ value, onChange, min, max, step }: CustomSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="relative w-full h-6 flex items-center">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 appearance-none bg-muted border-2 border-border cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:bg-foreground
          [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-foreground
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-4
          [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:bg-foreground
          [&::-moz-range-thumb]:border-2
          [&::-moz-range-thumb]:border-foreground
          [&::-moz-range-thumb]:cursor-pointer
          [&::-moz-range-thumb]:rounded-none"
        style={{
          background: `linear-gradient(to right, var(--foreground) 0%, var(--foreground) ${percentage}%, var(--muted) ${percentage}%, var(--muted) 100%)`,
        }}
      />
    </div>
  );
}

interface AISettingsProps {
  trigger?: React.ReactNode;
}

export function AISettings({ trigger }: AISettingsProps) {
  const [open, setOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const {
    isConfigured,
    isLoading,
    error,
    settings,
    configure,
    updateSettings,
    clearConfiguration,
    testConnection,
  } = useAI();

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return;

    setTestStatus('testing');
    const success = await configure(apiKeyInput.trim());
    setTestStatus(success ? 'success' : 'error');

    if (success) {
      setApiKeyInput('');
      setTimeout(() => setTestStatus('idle'), 2000);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    const success = await testConnection();
    setTestStatus(success ? 'success' : 'error');
    
    if (success) {
      setTimeout(() => setTestStatus('idle'), 2000);
    }
  };

  const handleRemoveKey = () => {
    clearConfiguration();
    setTestStatus('idle');
  };

  const defaultTrigger = (
    <Button variant="outline" className="rounded-none gap-2">
      <Key size={14} />
      AI Settings
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="rounded-none border-2 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">AI Configuration</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Use your own OpenAI API key for AI-powered writing assistance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* API Key Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                OpenAI API Key
              </label>
              {isConfigured && (
                <span className="flex items-center gap-1 text-[10px] text-tag-green">
                  <CheckCircle size={12} />
                  Configured
                </span>
              )}
            </div>

            {isConfigured ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted border-2 border-border text-sm font-mono text-muted-foreground">
                    sk-••••••••••••••••••••••••••••••••
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleTestConnection}
                    disabled={isLoading}
                    className="rounded-none h-10 w-10"
                  >
                    {testStatus === 'testing' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : testStatus === 'success' ? (
                      <CheckCircle size={14} className="text-tag-green" />
                    ) : testStatus === 'error' ? (
                      <AlertCircle size={14} className="text-tag-red" />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveKey}
                    className="rounded-none h-10 w-10 text-destructive hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                {error && (
                  <p className="text-[11px] text-tag-red">{error}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="sk-..."
                      className="rounded-none pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <Button
                    onClick={handleSaveKey}
                    disabled={isLoading || !apiKeyInput.trim()}
                    className="rounded-none"
                  >
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>

                {error && (
                  <p className="text-[11px] text-tag-red">{error}</p>
                )}

                <p className="text-[11px] text-muted-foreground">
                  Your API key is stored locally and never sent to our servers.{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-tag-blue hover:underline"
                  >
                    Get an API key
                    <ExternalLink size={10} />
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Settings - only show when configured */}
          {isConfigured && (
            <>
              <div className="h-px bg-border" />

              {/* Model Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Model
                </label>
                <Select
                  value={settings.model}
                  onValueChange={(value) => updateSettings({ model: value as AIModel })}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id} className="rounded-none">
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Creativity
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {settings.temperature.toFixed(1)}
                  </span>
                </div>
                <CustomSlider
                  value={settings.temperature}
                  onChange={(value) => updateSettings({ temperature: value })}
                  min={0}
                  max={1}
                  step={0.1}
                />
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Max Length
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {settings.maxTokens} tokens
                  </span>
                </div>
                <CustomSlider
                  value={settings.maxTokens}
                  onChange={(value) => updateSettings({ maxTokens: value })}
                  min={100}
                  max={4000}
                  step={100}
                />
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>Short</span>
                  <span>Long</span>
                </div>
              </div>
            </>
          )}

          {/* Info Box */}
          <div className="p-3 bg-card border-2 border-border">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              How It Works
            </p>
            <ul className="space-y-1 text-[11px] text-muted-foreground">
              <li>• Your API key stays in your browser</li>
              <li>• AI requests go directly to OpenAI</li>
              <li>• We never see your key or content</li>
              <li>• You pay OpenAI directly for usage</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact AI status indicator for header
 */
export function AIStatusIndicator() {
  const { isConfigured } = useAI();

  if (!isConfigured) {
    return (
      <AISettings
        trigger={
          <Button
            variant="ghost"
            className="rounded-none h-7 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
          >
            <Key size={12} className="mr-1" />
            Setup AI
          </Button>
        }
      />
    );
  }

  return (
    <AISettings
      trigger={
        <Button
          variant="ghost"
          className="rounded-none h-7 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-tag-green"
        >
          <CheckCircle size={12} className="mr-1" />
          AI Ready
        </Button>
      }
    />
  );
}