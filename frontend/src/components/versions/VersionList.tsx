import { Loader2 } from 'lucide-react';
import { VersionItem } from './VersionItem';
import type { VersionGroup } from './types';

interface VersionListProps {
  groups: VersionGroup[];
  selectedVersionId: number | null;
  onSelectVersion: (versionId: number) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function VersionList({
  groups,
  selectedVersionId,
  onSelectVersion,
  isLoading,
  hasMore,
  onLoadMore,
}: VersionListProps) {
  if (groups.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 border flex items-center justify-center mb-4">
          <span className="text-2xl text-muted-foreground">∅</span>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground mb-2">
          No Versions Yet
        </p>
        <p className="text-sm text-muted-foreground max-w-[200px]">
          Versions are created automatically as you edit.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {groups.map((group) => (
        <div key={group.label}>
          {/* Group Header */}
          <div className="sticky top-0 z-10 px-4 py-2 bg-card">
            <span className="text-sm font-medium">
              {group.label}
            </span>
          </div>
          
          {/* Versions in group */}
          <div>
            {group.versions.map((version) => (
              <VersionItem
                key={version.id}
                version={version}
                isSelected={selectedVersionId === version.id}
                onClick={() => onSelectVersion(version.id)}
              />
            ))}
          </div>
        </div>
      ))}
      
      {/* Load More */}
      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="w-full py-4 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-card transition-colors border-t"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={12} className="animate-spin" />
              Loading...
            </span>
          ) : (
            'Load More'
          )}
        </button>
      )}
      
      {/* Loading indicator */}
      {isLoading && groups.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}