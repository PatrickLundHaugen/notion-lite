/**
 * AI Commands for Slash Menu
 * 
 * Defines AI-powered slash commands that integrate with the editor.
 */

import type { Editor } from '@tiptap/react';
import { 
  Sparkles, 
  Minimize2, 
  Maximize2, 
  CheckCircle, 
  ArrowRight,
  FileText,
  Briefcase,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { hasApiKey, streamComplete, type AIMessage } from './client';
import { getCommandPrompt, truncateContext } from './prompts';

// ============================================
// Types
// ============================================

export interface AICommand {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
  requiresSelection: boolean;
  action: (editor: Editor, onProgress?: (text: string) => void) => Promise<void>;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get selected text from editor
 */
function getSelection(editor: Editor): string {
  const { from, to } = editor.state.selection;
  return editor.state.doc.textBetween(from, to, ' ');
}

/**
 * Get context (last ~500 characters before cursor)
 */
function getContext(editor: Editor, maxLength: number = 500): string {
  const { from } = editor.state.selection;
  const start = Math.max(0, from - maxLength);
  return editor.state.doc.textBetween(start, from, ' ');
}

/**
 * Execute an AI command
 */
async function executeAICommand(
  editor: Editor,
  commandId: string,
  useSelection: boolean,
  onProgress?: (text: string) => void
): Promise<void> {
  if (!hasApiKey()) {
    // Show settings prompt (this should be handled by the UI)
    throw new Error('Please configure your OpenAI API key in settings');
  }

  const selection = useSelection ? getSelection(editor) : '';
  const context = useSelection ? '' : truncateContext(getContext(editor));

  if (useSelection && !selection) {
    throw new Error('Please select some text first');
  }

  const { system, user } = getCommandPrompt(commandId, context, selection);

  const messages: AIMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];

  let fullText = '';
  const { from, to } = editor.state.selection;

  // Delete selection if we're replacing text
  if (useSelection && selection) {
    editor.chain().focus().deleteRange({ from, to }).run();
  }

  await streamComplete(messages, {
    onStart: () => {
      // Could show a loading indicator
    },
    onToken: (token) => {
      fullText += token;
      onProgress?.(fullText);
      
      // Insert token at cursor position
      editor.chain().focus().insertContent(token).run();
    },
    onComplete: () => {
      // Could show completion state
    },
    onError: (error) => {
      throw error;
    },
  });
}

// ============================================
// AI Commands
// ============================================

export const aiCommands: AICommand[] = [
  {
    id: 'ai-improve',
    label: 'Improve Writing',
    description: 'Enhance clarity, grammar, and flow',
    icon: Sparkles,
    keywords: ['ai', 'improve', 'enhance', 'better', 'rewrite'],
    requiresSelection: true,
    action: async (editor, onProgress) => {
      await executeAICommand(editor, 'improve', true, onProgress);
    },
  },
  {
    id: 'ai-shorter',
    label: 'Make Shorter',
    description: 'Condense without losing meaning',
    icon: Minimize2,
    keywords: ['ai', 'shorter', 'condense', 'brief', 'concise'],
    requiresSelection: true,
    action: async (editor, onProgress) => {
      await executeAICommand(editor, 'shorter', true, onProgress);
    },
  },
  {
    id: 'ai-longer',
    label: 'Make Longer',
    description: 'Expand with more detail',
    icon: Maximize2,
    keywords: ['ai', 'longer', 'expand', 'elaborate', 'detail'],
    requiresSelection: true,
    action: async (editor, onProgress) => {
      await executeAICommand(editor, 'longer', true, onProgress);
    },
  },
  {
    id: 'ai-fix',
    label: 'Fix Grammar',
    description: 'Correct spelling and grammar',
    icon: CheckCircle,
    keywords: ['ai', 'fix', 'grammar', 'spelling', 'correct'],
    requiresSelection: true,
    action: async (editor, onProgress) => {
      await executeAICommand(editor, 'fix', true, onProgress);
    },
  },
  {
    id: 'ai-continue',
    label: 'Continue Writing',
    description: 'Let AI continue from here',
    icon: ArrowRight,
    keywords: ['ai', 'continue', 'write', 'next', 'more'],
    requiresSelection: false,
    action: async (editor, onProgress) => {
      await executeAICommand(editor, 'continue', false, onProgress);
    },
  },
  {
    id: 'ai-summarize',
    label: 'Summarize',
    description: 'Create a brief summary',
    icon: FileText,
    keywords: ['ai', 'summarize', 'summary', 'tldr', 'brief'],
    requiresSelection: true,
    action: async (editor, onProgress) => {
      await executeAICommand(editor, 'summarize', true, onProgress);
    },
  },
  {
    id: 'ai-professional',
    label: 'Professional Tone',
    description: 'Rewrite in formal style',
    icon: Briefcase,
    keywords: ['ai', 'professional', 'formal', 'business', 'tone'],
    requiresSelection: true,
    action: async (editor, onProgress) => {
      await executeAICommand(editor, 'professional', true, onProgress);
    },
  },
  {
    id: 'ai-casual',
    label: 'Casual Tone',
    description: 'Rewrite in friendly style',
    icon: MessageCircle,
    keywords: ['ai', 'casual', 'friendly', 'informal', 'tone'],
    requiresSelection: true,
    action: async (editor, onProgress) => {
      await executeAICommand(editor, 'casual', true, onProgress);
    },
  },
  {
    id: 'ai-explain',
    label: 'Explain',
    description: 'Explain in simple terms',
    icon: HelpCircle,
    keywords: ['ai', 'explain', 'simplify', 'understand', 'clarify'],
    requiresSelection: true,
    action: async (editor, onProgress) => {
      await executeAICommand(editor, 'explain', true, onProgress);
    },
  },
];

/**
 * Check if AI commands should be shown
 */
export function shouldShowAICommands(): boolean {
  return hasApiKey();
}

/**
 * Filter AI commands based on query
 */
export function filterAICommands(query: string): AICommand[] {
  if (!shouldShowAICommands()) {
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    return aiCommands;
  }

  return aiCommands.filter(cmd => 
    cmd.label.toLowerCase().includes(lowerQuery) ||
    cmd.description.toLowerCase().includes(lowerQuery) ||
    cmd.keywords.some(kw => kw.includes(lowerQuery))
  );
}