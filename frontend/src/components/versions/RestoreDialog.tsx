import { formatDistanceToNow } from 'date-fns';
import { RotateCcw } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { PageVersion } from './types';

interface RestoreDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    version: PageVersion | null;
    onConfirm: () => void;
    isRestoring: boolean;
}

export function RestoreDialog({
                                  open,
                                  onOpenChange,
                                  version,
                                  onConfirm,
                                  isRestoring,
                              }: RestoreDialogProps) {
    if (!version) return null;

    const timeAgo = formatDistanceToNow(new Date(version.created_at), { addSuffix: true });

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Restore this version?
                    </AlertDialogTitle>

                    <AlertDialogDescription asChild>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                This will replace your current content with the version from{" "}
                                <span className="font-medium text-foreground">{timeAgo}</span>.
                            </p>

                            {/* Version info */}
                            <div className="p-3 border bg-card">
                                <p className="text-xs font-bold mb-1">
                                    Restoring To
                                </p>
                                <p className="text-sm font-medium truncate">{version.title || 'Untitled'}</p>
                                <p className="text-xs text-muted-foreground">
                                    {version.content_length.toLocaleString()} characters
                                </p>
                            </div>

                            {/* Safety note */}
                            <div className="flex items-start gap-2 p-3 bg-tag-green/10 border-l-3 border-tag-green">
                                <RotateCcw size={14} className="text-tag-green mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-muted-foreground">
                                    Don't worry, your current content will be saved as a new version before restoring.
                                </p>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel
                        disabled={isRestoring}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isRestoring}
                    >
                        {isRestoring ? 'Restoring...' : 'Restore Version'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}