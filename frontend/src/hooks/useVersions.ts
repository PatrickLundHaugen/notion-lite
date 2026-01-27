/**
 * Hook for managing version history
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getVersions,
  getVersion,
  createVersion,
  restoreVersion,
  getVersionCount,
} from '@/lib/api/versions.ts';
import type {
  PageVersionSummary,
  PageVersion,
  PageVersionList,
  VersionGroup,
} from '@/components/versions/types.ts';

export interface UseVersionsOptions {
  pageSlug: string | undefined;
  autoLoad?: boolean;
}

export interface UseVersionsReturn {
  versions: PageVersionSummary[];
  groupedVersions: VersionGroup[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  selectedVersion: PageVersion | null;
  isLoadingVersion: boolean;
  versionCount: number;
  
  // Actions
  loadVersions: () => Promise<void>;
  loadMoreVersions: () => Promise<void>;
  selectVersion: (versionId: number) => Promise<void>;
  clearSelectedVersion: () => void;
  createVersionSnapshot: (title?: string, content?: string) => Promise<PageVersion | null>;
  restoreToVersion: (versionId: number) => Promise<boolean>;
  refreshCount: () => Promise<void>;
}

/**
 * Group versions by time period
 */
function groupVersionsByTime(versions: PageVersionSummary[]): VersionGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const groups: Record<string, PageVersionSummary[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'This Month': [],
    'Earlier': [],
  };

  for (const version of versions) {
    const date = new Date(version.created_at);

    if (date >= today) {
      groups['Today'].push(version);
    } else if (date >= yesterday) {
      groups['Yesterday'].push(version);
    } else if (date >= thisWeek) {
      groups['This Week'].push(version);
    } else if (date >= thisMonth) {
      groups['This Month'].push(version);
    } else {
      groups['Earlier'].push(version);
    }
  }

  // Filter out empty groups and return
  return Object.entries(groups)
    .filter(([_, versions]) => versions.length > 0)
    .map(([label, versions]) => ({ label, versions }));
}

export function useVersions({ pageSlug, autoLoad = false }: UseVersionsOptions): UseVersionsReturn {
  const [versions, setVersions] = useState<PageVersionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedVersion, setSelectedVersion] = useState<PageVersion | null>(null);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);
  
  const [versionCount, setVersionCount] = useState(0);
  
  const offsetRef = useRef(0);

  // Load versions list
  const loadVersions = useCallback(async () => {
    if (!pageSlug) return;

    try {
      setIsLoading(true);
      setError(null);
      offsetRef.current = 0;

      const result: PageVersionList = await getVersions(pageSlug, 50, 0);
      
      setVersions(result.versions);
      setTotal(result.total);
      setHasMore(result.has_more);
      offsetRef.current = result.versions.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions');
    } finally {
      setIsLoading(false);
    }
  }, [pageSlug]);

  // Load more versions (pagination)
  const loadMoreVersions = useCallback(async () => {
    if (!pageSlug || isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await getVersions(pageSlug, 50, offsetRef.current);
      
      setVersions(prev => [...prev, ...result.versions]);
      setHasMore(result.has_more);
      offsetRef.current += result.versions.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more versions');
    } finally {
      setIsLoading(false);
    }
  }, [pageSlug, isLoading, hasMore]);

  // Select and load a specific version
  const selectVersion = useCallback(async (versionId: number) => {
    if (!pageSlug) return;

    try {
      setIsLoadingVersion(true);
      const version = await getVersion(pageSlug, versionId);
      setSelectedVersion(version);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load version');
    } finally {
      setIsLoadingVersion(false);
    }
  }, [pageSlug]);

  // Clear selected version
  const clearSelectedVersion = useCallback(() => {
    setSelectedVersion(null);
  }, []);

  // Create a new version snapshot
  const createVersionSnapshot = useCallback(async (
    title?: string,
    content?: string
  ): Promise<PageVersion | null> => {
    if (!pageSlug) return null;

    try {
      const version = await createVersion(pageSlug, { title, content });
      
      // Add to beginning of list
      setVersions(prev => [
        {
          id: version.id,
          page_id: version.page_id,
          title: version.title,
          content_length: version.content_length,
          created_at: version.created_at,
        },
        ...prev,
      ]);
      setTotal(prev => prev + 1);
      setVersionCount(prev => prev + 1);
      
      return version;
    } catch (err) {
      console.error('Failed to create version:', err);
      return null;
    }
  }, [pageSlug]);

  // Restore to a previous version
  const restoreToVersion = useCallback(async (versionId: number): Promise<boolean> => {
    if (!pageSlug) return false;

    try {
      await restoreVersion(pageSlug, versionId);
      // Reload versions to get the new backup version
      await loadVersions();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore version');
      return false;
    }
  }, [pageSlug, loadVersions]);

  // Refresh version count
  const refreshCount = useCallback(async () => {
    if (!pageSlug) return;

    try {
      const result = await getVersionCount(pageSlug);
      setVersionCount(result.count);
    } catch (err) {
      // Silently fail - count is not critical
      console.error('Failed to get version count:', err);
    }
  }, [pageSlug]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && pageSlug) {
      loadVersions();
      refreshCount();
    }
  }, [autoLoad, pageSlug, loadVersions, refreshCount]);

  // Compute grouped versions
  const groupedVersions = groupVersionsByTime(versions);

  return {
    versions,
    groupedVersions,
    total,
    hasMore,
    isLoading,
    error,
    selectedVersion,
    isLoadingVersion,
    versionCount,
    loadVersions,
    loadMoreVersions,
    selectVersion,
    clearSelectedVersion,
    createVersionSnapshot,
    restoreToVersion,
    refreshCount,
  };
}