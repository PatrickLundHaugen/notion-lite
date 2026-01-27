import type { Editor, Range } from '@tiptap/react';
import type { LucideIcon } from 'lucide-react';
import type { TagData } from '@/components/tags/types';

// Page types (existing)
export interface Page {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  owner_id: number;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  children: Page[];
  tags: TagData[];
}

// Re-export TagData as Tag for convenience
export type Tag = TagData;

// Editor state types
export type SaveStatus = 'unsaved' | 'saving' | 'saved';
export type EditorStatus = 'loading' | 'ready' | 'error';

// Slash command types - updated to include 'ai' category
export type CommandCategory = 'text' | 'lists' | 'media' | 'advanced' | 'ai';

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: CommandCategory;
  keywords: string[];
  shortcut?: string;
  action: (editor: Editor) => void;
}

export interface SlashCommandGroup {
  category: CommandCategory;
  label: string;
  commands: SlashCommand[];
}

// Callout types
export type CalloutVariant = 'info' | 'warning' | 'success' | 'error' | 'note';

export interface CalloutAttributes {
  variant: CalloutVariant;
}

// Suggestion props type for slash commands
export interface SuggestionProps {
  editor: Editor;
  range: Range;
  clientRect: (() => DOMRect | null) | null;
}

// Slash command renderer interface
export interface SlashCommandRenderProps {
  onStart: (props: SuggestionProps) => void;
  onUpdate: (props: SuggestionProps) => void;
  onExit: () => void;
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

// AI-related types for the editor
export interface AICommandContext {
  editor: Editor;
  selection: string;
  context: string;
  range: Range;
}

export interface AICommandResult {
  success: boolean;
  error?: string;
}