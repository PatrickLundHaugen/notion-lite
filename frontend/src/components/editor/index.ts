// Main Editor component (default export for routing)
export { default } from './Editor';

// Named exports
export { default as Editor } from './Editor';
export { EditorHeader } from './EditorHeader';
export { MenuBar } from './MenuBar';

// Hooks
export { useNoteEditor } from './hooks/useNoteEditor';
export type { UseNoteEditorOptions, UseNoteEditorReturn } from './hooks/useNoteEditor';

// Extensions
export { createExtensions, SlashCommandExtension } from './extensions';

// Slash Commands
export { SlashCommandMenu, slashCommands, commandGroups } from './SlashCommand';

// Types
export type {
  Page,
  Tag,
  SaveStatus,
  EditorStatus,
  SlashCommand,
  SlashCommandGroup,
  CommandCategory,
  CalloutVariant,
  CalloutAttributes,
  SuggestionProps,
  SlashCommandRenderProps,
} from './types';