import { formatDistanceToNow } from 'date-fns';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageVersionSummary } from './types';

interface VersionItemProps {
    version: PageVersionSummary;
    isSelected: boolean;
    onClick: () => void;
}

/**
 * Format content length to human readable size
 */
function formatSize(bytes: number): string {
    if (bytes < 1000) return `${bytes} chars`;
    if (bytes < 10000) return `${(bytes / 1000).toFixed(1)}k chars`;
    return `${Math.round(bytes / 1000)}k chars`;
}

export function VersionItem({ version, isSelected, onClick }: VersionItemProps) {
    const timeAgo = formatDistanceToNow(new Date(version.created_at), { addSuffix: true });

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-4 py-3 transition-colors border-b border-border border-l-2 hover:bg-card",
                isSelected
                    ? "bg-card border-l-foreground"
                    : "border-l-transparent"
            )}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                    "flex items-center justify-center size-8 border flex-shrink-0 mt-0.5",
                    isSelected && "border-foreground"
                )}>
                    <FileText size={14} className={isSelected ? "text-foreground" : "text-muted-foreground"} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Title */}
                    <p className={cn(
                        "text-sm font-medium truncate",
                        isSelected ? "text-foreground" : "text-foreground"
                    )}>
                        {version.title || 'Untitled'}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium text-muted-foreground">
                            {timeAgo}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">
                            {formatSize(version.content_length)}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
}