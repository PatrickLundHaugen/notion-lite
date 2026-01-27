import { useMemo } from 'react';
import { Plus, Minus } from 'lucide-react';
import { computeHtmlDiff, stripHtml } from '@/lib/diff';
import type { DiffSegment } from './types';

interface DiffViewProps {
  oldContent: string | null;
  newContent: string | null;
  oldTitle?: string;
  newTitle?: string;
}

/**
 * Render a single diff segment with appropriate styling
 */
function DiffSegmentView({ segment }: { segment: DiffSegment }) {
  switch (segment.type) {
    case 'addition':
      return (
        <span className="bg-tag-green/20 text-tag-green px-0.5">
          {segment.text}
        </span>
      );
    case 'deletion':
      return (
        <span className="bg-tag-red/20 text-tag-red line-through px-0.5">
          {segment.text}
        </span>
      );
    default:
      return <span>{segment.text}</span>;
  }
}

export function DiffView({ oldContent, newContent, oldTitle, newTitle }: DiffViewProps) {
  const diff = useMemo(() => {
    return computeHtmlDiff(oldContent || '', newContent || '');
  }, [oldContent, newContent]);

  const hasChanges = diff.additions > 0 || diff.deletions > 0;

  // Check if titles are different
  const titleChanged = oldTitle !== newTitle && oldTitle && newTitle;

  return (
    <div className="h-full flex flex-col">
      {/* Stats Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b-2 border-border bg-card">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Changes
        </span>
        
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-tag-green">
            <Plus size={12} />
            {diff.additions} added
          </span>
          <span className="flex items-center gap-1 text-[11px] text-tag-red">
            <Minus size={12} />
            {diff.deletions} removed
          </span>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Title change */}
        {titleChanged && (
          <div className="mb-6 pb-4 border-b border-border">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Title Changed
            </p>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="bg-tag-red/20 text-tag-red line-through px-1">{oldTitle}</span>
              </p>
              <p className="text-sm">
                <span className="bg-tag-green/20 text-tag-green px-1">{newTitle}</span>
              </p>
            </div>
          </div>
        )}

        {/* Content diff */}
        {hasChanges ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-[inherit]">
            {diff.segments.map((segment, index) => (
              <DiffSegmentView key={index} segment={segment} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 border-2 border-border flex items-center justify-center mb-3">
              <span className="text-lg text-muted-foreground">=</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
              No Content Changes
            </p>
            <p className="text-sm text-muted-foreground">
              The content is identical.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Side-by-side diff view (alternative layout)
 */
export function DiffViewSideBySide({ oldContent, newContent }: DiffViewProps) {
  const oldText = stripHtml(oldContent || '');
  const newText = stripHtml(newContent || '');

  return (
    <div className="h-full flex">
      {/* Old version */}
      <div className="flex-1 flex flex-col border-r border-border">
        <div className="px-4 py-2 border-b border-border bg-tag-red/10">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-tag-red">
            Previous Version
          </span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{oldText}</p>
        </div>
      </div>

      {/* New version */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-2 border-b border-border bg-tag-green/10">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-tag-green">
            Current Version
          </span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{newText}</p>
        </div>
      </div>
    </div>
  );
}