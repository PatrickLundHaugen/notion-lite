import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { SaveStatus } from '@/components/editor/types';

interface EditorHeaderProps {
    saveStatus: SaveStatus;
    lastSaved: Date | null;
    isDeleting: boolean;
    onDelete: () => void;
    onSave: () => void;
    onOpenHistory: () => void;
    versionCount?: number;
}

export function EditorHeader({
                                 saveStatus,
                                 lastSaved,
                                 isDeleting,
                                 onDelete,
                                 onSave,
                                 onOpenHistory,
                                 versionCount = 0,
                             }: EditorHeaderProps) {
    const lastSavedText = lastSaved
        ? formatDistanceToNow(lastSaved, { addSuffix: true })
        : '';

    return (
        <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {saveStatus === 'unsaved' && (
                    <>
                        <div className="size-2 bg-tag-orange" />
                        <span className="hidden sm:inline text-sm font-medium text-tag-orange">
                            Unsaved
                        </span>
                    </>
                )}

                {saveStatus === 'saving' && (
                    <>
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        <span className="hidden sm:inline text-sm font-medium text-muted-foreground">
                            Saving...
                        </span>
                    </>
                )}

                {saveStatus === 'saved' && (
                    <>
                        <div className="size-2 bg-tag-green" />
                        <span className="hidden sm:inline text-sm font-medium text-muted-foreground">
                            {lastSavedText ? `Saved ${lastSavedText}` : 'Saved'}
                        </span>
                    </>
                )}
            </div>

            <div className="flex">
                <Button
                    variant="ghost"
                    onClick={onOpenHistory}
                >
                    History
                    {versionCount > 0 && (
                        <span className="px-1 py-0.5 bg-muted text-muted-foreground text-xs">
                            {versionCount}
                        </span>
                    )}
                </Button>

                <Button
                    variant="ghost"
                    onClick={onSave}
                    disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                >
                    Save
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            disabled={isDeleting}
                            className="hover:text-destructive hover:bg-destructive/5 transition-colors"
                        >
                            Delete
                        </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete this page?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action is permanent and cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={onDelete}
                                disabled={isDeleting}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </header>
    );
}