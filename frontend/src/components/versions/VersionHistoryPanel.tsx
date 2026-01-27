import { useState, useEffect, useCallback } from 'react';
import { X, History, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVersions } from '@/hooks/useVersions';
import { VersionList } from './VersionList';
import { VersionPreview } from './VersionPreview';
import { DiffView } from './DiffView';
import { RestoreDialog } from './RestoreDialog';
import type { Page } from '@/components/editor/types';

interface VersionHistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    pageSlug: string;
    currentContent: string | null;
    currentTitle: string;
    onRestore: (page: Page) => void;
}

type ViewMode = 'preview' | 'compare';

export function VersionHistoryPanel({
                                        isOpen,
                                        onClose,
                                        pageSlug,
                                        currentContent,
                                        currentTitle,
                                        onRestore,
                                    }: VersionHistoryPanelProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('preview');
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const {
        groupedVersions,
        isLoading,
        error,
        hasMore,
        selectedVersion,
        isLoadingVersion,
        loadVersions,
        loadMoreVersions,
        selectVersion,
        clearSelectedVersion,
        restoreToVersion,
    } = useVersions({ pageSlug, autoLoad: false });

    // Load versions when panel opens
    useEffect(() => {
        if (isOpen) {
            loadVersions();
        }
    }, [isOpen, loadVersions]);

    // Clear selection when panel closes
    useEffect(() => {
        if (!isOpen) {
            clearSelectedVersion();
            setViewMode('preview');
        }
    }, [isOpen, clearSelectedVersion]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Handle restore
    const handleRestore = useCallback(async () => {
        if (!selectedVersion) return;

        setIsRestoring(true);
        const success = await restoreToVersion(selectedVersion.id);
        setIsRestoring(false);
        setShowRestoreDialog(false);

        if (success) {
            onRestore({
                id: selectedVersion.page_id,
                slug: pageSlug,
                title: selectedVersion.title,
                content: selectedVersion.content,
            } as Page);
            onClose();
        }
    }, [selectedVersion, restoreToVersion, pageSlug, onRestore, onClose]);

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 bg-black/20 z-40 transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <div
                className={cn(
                    "fixed top-0 right-0 h-full w-[800px] max-w-[90vw] bg-background z-50",
                    "transform transition-transform duration-300 ease-in-out",
                    "flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex items-center justify-between border-b">
                    <div className="flex items-center gap-2">
                        <div className="px-6">
                            <h2 className="text-sm font-bold">
                                Version History
                            </h2>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                    >
                        <X />
                    </Button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="w-[280px] border-r flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto">
                            <VersionList
                                groups={groupedVersions}
                                selectedVersionId={selectedVersion?.id || null}
                                onSelectVersion={selectVersion}
                                isLoading={isLoading}
                                hasMore={hasMore}
                                onLoadMore={loadMoreVersions}
                            />
                        </div>
                    </div>

                    {/* Preview/Diff Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {selectedVersion ? (
                            <>
                                {/* View Mode Toggle */}
                                <div className="flex items-center justify-between border-b">
                                    <div className="flex items-center bg-card">
                                        <Button
                                            onClick={() => setViewMode("preview")}
                                            variant={viewMode === "preview" ? "default" : "ghost"}
                                        >
                                            Preview
                                        </Button>

                                        <Button
                                            onClick={() => setViewMode("compare")}
                                            variant={viewMode === "compare" ? "default" : "ghost"}
                                        >
                                            Compare
                                        </Button>
                                    </div>

                                    <Button
                                        onClick={() => setShowRestoreDialog(true)}
                                    >
                                        Restore
                                    </Button>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 overflow-hidden">
                                    {isLoadingVersion ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 size={24} className="animate-spin text-muted-foreground" />
                                        </div>
                                    ) : viewMode === 'preview' ? (
                                        <VersionPreview version={selectedVersion} />
                                    ) : (
                                        <DiffView
                                            oldContent={selectedVersion.content}
                                            newContent={currentContent}
                                            oldTitle={selectedVersion.title}
                                            newTitle={currentTitle}
                                        />
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground text-sm space-y-2">
                                <History />
                                <p className="font-bold">Select a Version</p>
                                <p className="max-w-xs">
                                    Click on a version from the list to preview it or compare it with your current content.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="px-4 py-3 bg-tag-red/10 border-t border-tag-red">
                        <p className="text-sm text-tag-red">{error}</p>
                    </div>
                )}
            </div>

            {/* Restore Dialog */}
            <RestoreDialog
                open={showRestoreDialog}
                onOpenChange={setShowRestoreDialog}
                version={selectedVersion}
                onConfirm={handleRestore}
                isRestoring={isRestoring}
            />
        </>
    );
}