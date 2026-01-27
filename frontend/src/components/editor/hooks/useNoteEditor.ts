import { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, type Editor } from '@tiptap/react';
import { api } from '@/lib/api';
import { getPageOfflineAware } from '@/lib/offline-helpers';
import { createVersion, getVersionCount } from '@/lib/api/versions';
import { createExtensions, setSlashCommandRenderer } from '@/components/editor/extensions';
import type { Page, SaveStatus, EditorStatus, SlashCommandRenderProps } from '@/components/editor/types';

const AUTO_SAVE_DELAY = 2000;
const VERSION_CHAR_THRESHOLD = 50; // Create version if content changes by more than this
const VERSION_TIME_THRESHOLD = 5 * 60 * 1000; // Or if more than 5 minutes since last version

export interface UseNoteEditorOptions {
  slug: string | undefined;
  onSlashCommand?: SlashCommandRenderProps;
}

export interface UseNoteEditorReturn {
  editor: Editor | null;
  status: EditorStatus;
  saveStatus: SaveStatus;
  errorMessage: string;
  page: Page | null;
  title: string;
  setTitle: (title: string) => void;
  lastSaved: Date | null;
  handleDelete: () => Promise<void>;
  handleSave: () => Promise<void>;
  isDeleting: boolean;
  versionCount: number;
  reloadPage: () => Promise<void>;
}

export function useNoteEditor({ slug, onSlashCommand }: UseNoteEditorOptions): UseNoteEditorReturn {
  const [page, setPage] = useState<Page | null>(null);
  const [status, setStatus] = useState<EditorStatus>('loading');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [title, setTitleState] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [versionCount, setVersionCount] = useState(0);
  
  const lastSavedContent = useRef<string>('');
  const lastSavedTitle = useRef<string>('');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);
  const pageIdRef = useRef<number | null>(null);
  
  // Version tracking refs
  const lastVersionedContent = useRef<string>('');
  const lastVersionedTitle = useRef<string>('');
  const lastVersionTime = useRef<number>(Date.now());
  const versionPendingRef = useRef(false);

  useEffect(() => {
    if (onSlashCommand) {
      setSlashCommandRenderer(onSlashCommand);
    }
  }, [onSlashCommand]);

  const editor = useEditor({
    extensions: createExtensions(),
    content: '',
    editorProps: {
      attributes: {
        class: 'noteflow-editor outline-none min-h-[400px]',
        spellcheck: 'true',
      },
    },
    onUpdate: () => {
      if (!isInitialLoad.current) {
        setSaveStatus('unsaved');
      }
    },
  });

  // Check if we should create a version
  const shouldCreateVersion = useCallback((currentContent: string, currentTitle: string): boolean => {
    const contentDiff = Math.abs(currentContent.length - lastVersionedContent.current.length);
    const titleChanged = currentTitle !== lastVersionedTitle.current;
    const timeSinceLastVersion = Date.now() - lastVersionTime.current;
    
    // Create version if:
    // 1. Content changed significantly (> threshold chars)
    // 2. OR title changed
    // 3. OR enough time passed since last version
    return (
      contentDiff >= VERSION_CHAR_THRESHOLD ||
      titleChanged ||
      timeSinceLastVersion >= VERSION_TIME_THRESHOLD
    );
  }, []);

  // Create a version snapshot
  const createVersionSnapshot = useCallback(async (content: string, currentTitle: string) => {
    if (!slug || versionPendingRef.current) return;
    
    versionPendingRef.current = true;
    
    try {
      await createVersion(slug, { title: currentTitle, content });
      lastVersionedContent.current = content;
      lastVersionedTitle.current = currentTitle;
      lastVersionTime.current = Date.now();
      setVersionCount(prev => prev + 1);
    } catch (error) {
      console.error('Failed to create version:', error);
    } finally {
      versionPendingRef.current = false;
    }
  }, [slug]);

  // Load version count
  const loadVersionCount = useCallback(async () => {
    if (!slug) return;
    
    try {
      const result = await getVersionCount(slug);
      setVersionCount(result.count);
    } catch (error) {
      console.error('Failed to load version count:', error);
    }
  }, [slug]);

  // Load page data - GET uses slug
  const loadPage = useCallback(async () => {
    if (!slug || !editor) return;

    try {
      isInitialLoad.current = true;
      setStatus('loading');
      setErrorMessage('');
      
      // GET /pages/{slug} - uses slug
      const data = await getPageOfflineAware(slug, async () => {
        return await api.get(`/pages/${slug}`) as Page;
      });
      
      setPage(data);
      pageIdRef.current = data.id; // Store the numeric ID for PUT/DELETE
      setTitleState(data.title);
      lastSavedTitle.current = data.title;
      lastSavedContent.current = data.content || '';
      lastVersionedContent.current = data.content || '';
      lastVersionedTitle.current = data.title;
      lastVersionTime.current = Date.now();
      setLastSaved(new Date(data.updated_at));
      
      editor.commands.setContent(data.content || '');
      
      setStatus('ready');
      setSaveStatus('saved');
      
      // Load version count
      loadVersionCount();
      
      setTimeout(() => {
        isInitialLoad.current = false;
        lastSavedContent.current = editor.getHTML();
      }, 200);
    } catch (error) {
      console.error('Failed to load page:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load page');
      setStatus('error');
    }
  }, [slug, editor, loadVersionCount]);

  // Load page on mount
  useEffect(() => {
    loadPage();
  }, [loadPage]);

  // Auto-save - PUT uses page ID (integer)
  useEffect(() => {
    if (status !== 'ready' || isInitialLoad.current || !pageIdRef.current || !editor) return;
    if (saveStatus !== 'unsaved') return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const content = editor.getHTML();
      const currentTitle = title || 'Untitled';

      if (content === lastSavedContent.current && currentTitle === lastSavedTitle.current) {
        setSaveStatus('saved');
        return;
      }

      try {
        setSaveStatus('saving');
        
        // Check if we should create a version before saving
        if (shouldCreateVersion(content, currentTitle)) {
          await createVersionSnapshot(lastSavedContent.current, lastSavedTitle.current);
        }
        
        // PUT /pages/{page_id} - uses numeric ID, not slug!
        await api.put(`/pages/${pageIdRef.current}`, {
          title: currentTitle,
          content: content,
        });
        
        lastSavedContent.current = content;
        lastSavedTitle.current = currentTitle;
        
        setSaveStatus('saved');
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save:', error);
        setSaveStatus('unsaved');
      }
    }, AUTO_SAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, saveStatus, status, editor, shouldCreateVersion, createVersionSnapshot]);

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle);
    if (!isInitialLoad.current) {
      setSaveStatus('unsaved');
    }
  }, []);

  // Manual save - uses page ID and creates version
  const handleSave = useCallback(async () => {
    if (!pageIdRef.current || !editor || !slug) return;

    const content = editor.getHTML();
    const currentTitle = title || 'Untitled';

    try {
      setSaveStatus('saving');
      
      // Always create a version on manual save
      await createVersionSnapshot(content, currentTitle);
      
      // PUT /pages/{page_id} - uses numeric ID
      await api.put(`/pages/${pageIdRef.current}`, {
        title: currentTitle,
        content: content,
      });

      lastSavedContent.current = content;
      lastSavedTitle.current = currentTitle;
      
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('unsaved');
    }
  }, [editor, title, slug, createVersionSnapshot]);

  // Delete - uses page ID
  const handleDelete = useCallback(async () => {
    if (!pageIdRef.current) return;

    try {
      setIsDeleting(true);
      // DELETE /pages/{page_id} - uses numeric ID
      await api.delete(`/pages/${pageIdRef.current}`);
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete page:', error);
      setIsDeleting(false);
    }
  }, []);

  // Reload page (used after restore)
  const reloadPage = useCallback(async () => {
    await loadPage();
  }, [loadPage]);

  return {
    editor,
    status,
    saveStatus,
    errorMessage,
    page,
    title,
    setTitle,
    lastSaved,
    handleDelete,
    handleSave,
    isDeleting,
    versionCount,
    reloadPage,
  };
}