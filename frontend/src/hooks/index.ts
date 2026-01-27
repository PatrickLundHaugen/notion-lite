// Editor hooks
export { useNoteEditor } from '@/components/editor/hooks/useNoteEditor';
export type { UseNoteEditorOptions, UseNoteEditorReturn } from '@/components/editor/hooks/useNoteEditor';

// Utility hooks
export { useDebounce } from './useDebounce';
export { useIsMobile } from './useMobile';
export { useTime } from './useTime';

// Version history hooks
export { useVersions } from './useVersions';
export type { UseVersionsOptions, UseVersionsReturn } from './useVersions';

// Offline/PWA hooks
export { useOnlineStatus, useNetworkStatus } from './useOnlineStatus';

// AI hooks
export { useAI, useAIAvailable } from './useAI';
export type { UseAIReturn } from './useAI';

// Pages hooks
export { usePages, usePagesState } from './usePages';
export type { PageContextType } from './usePages';