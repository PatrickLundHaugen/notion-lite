import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { EditorContent } from '@tiptap/react';
import { createPortal } from 'react-dom';
import tippy, { type Instance as TippyInstance } from 'tippy.js';

import { useNoteEditor } from '@/components/editor/hooks/useNoteEditor';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { MenuBar } from '@/components/editor/MenuBar';
import { SlashCommandMenu, type SlashCommandMenuRef } from '@/components/editor/SlashCommand';
import { VersionHistoryPanel } from '@/components/versions';
import { NoteTags } from '@/components/tags/NoteTags';
import { type TagData } from '@/components/tags/types';
import { usePages } from '@/components/layouts/usePages';
import type { SuggestionProps, SlashCommandRenderProps } from '@/components/editor/types';
import type { Page } from '@/components/editor/types';

import '@/components/editor/editor.css';

export default function Editor() {
    const { slug } = useParams<{ slug: string }>();
    const { refreshSidebar } = usePages();

    const [slashCommandProps, setSlashCommandProps] = useState<{
        editor: SuggestionProps['editor'];
        range: SuggestionProps['range'];
    } | null>(null);
    const slashMenuRef = useRef<SlashCommandMenuRef>(null);
    const tippyRef = useRef<TippyInstance | null>(null);
    const popupContainerRef = useRef<HTMLDivElement | null>(null);

    // Version history panel state
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const slashCommandRenderer: SlashCommandRenderProps = {
        onStart: (props: SuggestionProps) => {
            setSlashCommandProps({
                editor: props.editor,
                range: props.range,
            });

            if (!popupContainerRef.current) {
                popupContainerRef.current = document.createElement('div');
                document.body.appendChild(popupContainerRef.current);
            }

            tippyRef.current = tippy(document.body, {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: popupContainerRef.current,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                animation: false,
                offset: [0, 8],
            });
        },
        onUpdate: (props: SuggestionProps) => {
            setSlashCommandProps({
                editor: props.editor,
                range: props.range,
            });

            if (tippyRef.current && props.clientRect) {
                tippyRef.current.setProps({
                    getReferenceClientRect: props.clientRect as () => DOMRect,
                });
            }
        },
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'Escape') {
                tippyRef.current?.hide();
                return true;
            }
            return slashMenuRef.current?.onKeyDown(event) ?? false;
        },
        onExit: () => {
            tippyRef.current?.destroy();
            tippyRef.current = null;
            setSlashCommandProps(null);
        },
    };

    const {
        editor,
        status,
        saveStatus,
        title,
        setTitle,
        lastSaved,
        errorMessage,
        isDeleting,
        handleDelete,
        handleSave,
        page,
        versionCount,
        reloadPage,
    } = useNoteEditor({
        slug,
        onSlashCommand: slashCommandRenderer,
    });

    const [tags, setTags] = useState<TagData[]>([]);

    useEffect(() => {
        if (page?.tags) {
            setTags(page.tags);
        }
    }, [page]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    const handleCloseSlashMenu = useCallback(() => {
        tippyRef.current?.hide();
        setSlashCommandProps(null);
    }, []);

    // Handle version restore
    const handleVersionRestore = useCallback(async (_restoredPage: Page) => {
        // Reload the page to get the restored content
        await reloadPage();
        refreshSidebar();
    }, [reloadPage, refreshSidebar]);

    if (status === 'loading') {
        return (
            <main className="flex items-center justify-center min-h-[60vh]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Loading...
                </p>
            </main>
        );
    }

    if (status === 'error') {
        return (
            <main className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-destructive">
                    Failed to load page
                </p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen">
            {/* Editor Header — sticky top bar */}
            <div className="sticky top-0 z-20 bg-background border-b border-border">
                <div className="max-w-3xl mx-auto px-6">
                    <EditorHeader
                        saveStatus={saveStatus}
                        lastSaved={lastSaved}
                        isDeleting={isDeleting}
                        onDelete={handleDelete}
                        onSave={handleSave}
                        onOpenHistory={() => setIsHistoryOpen(true)}
                        versionCount={versionCount}
                    />
                </div>
            </div>

            {/* Editor Content */}
            <article className="max-w-3xl mx-auto px-6 py-12">
                {/* Tags */}
                {page && (
                    <div className="mb-6">
                        <NoteTags
                            pageId={page.id}
                            tags={tags}
                            onTagsChange={setTags}
                        />
                    </div>
                )}

                {/* Title — massive, with underline */}
                <div className="mb-12 pb-6 border-b-2 border-foreground">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Untitled"
                        className="w-full bg-transparent border-none outline-none text-4xl md:text-5xl font-bold leading-tight text-foreground placeholder:text-muted-foreground/40"
                    />
                </div>

                {/* Formatting Toolbar */}
                {editor && (
                    <div className="sticky top-16 z-10 mb-8 -mx-2">
                        <MenuBar editor={editor} />
                    </div>
                )}

                {/* Editor */}
                {editor && (
                    <div className="relative">
                        <EditorContent editor={editor} />
                    </div>
                )}

                {/* Slash Command Menu */}
                {slashCommandProps && popupContainerRef.current && createPortal(
                    <SlashCommandMenu
                        ref={slashMenuRef}
                        editor={slashCommandProps.editor}
                        range={slashCommandProps.range}
                        onClose={handleCloseSlashMenu}
                    />,
                    popupContainerRef.current
                )}
            </article>

            {/* Version History Panel */}
            {slug && (
                <VersionHistoryPanel
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                    pageSlug={slug}
                    currentContent={editor?.getHTML() || null}
                    currentTitle={title}
                    onRestore={handleVersionRestore}
                />
            )}
        </main>
    );
}