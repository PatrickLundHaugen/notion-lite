/**
 * Version history API functions
 */

import { api } from '@/lib/api';
import type { 
  PageVersion, 
  PageVersionList, 
  VersionCreateRequest 
} from '@/components/versions/types.ts';
import type { Page } from '@/components/editor/types';

/**
 * Get list of versions for a page
 */
export async function getVersions(
  pageSlug: string,
  limit: number = 50,
  offset: number = 0
): Promise<PageVersionList> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  return api.get(`/pages/${pageSlug}/versions?${params}`) as Promise<PageVersionList>;
}

/**
 * Get a specific version with full content
 */
export async function getVersion(
  pageSlug: string,
  versionId: number
): Promise<PageVersion> {
  return api.get(`/pages/${pageSlug}/versions/${versionId}`) as Promise<PageVersion>;
}

/**
 * Create a new version snapshot
 */
export async function createVersion(
  pageSlug: string,
  data?: VersionCreateRequest
): Promise<PageVersion> {
  return api.post(`/pages/${pageSlug}/versions`, data || {}) as Promise<PageVersion>;
}

/**
 * Restore page to a previous version
 */
export async function restoreVersion(
  pageSlug: string,
  versionId: number
): Promise<Page> {
  return api.post(`/pages/${pageSlug}/versions/${versionId}/restore`, {}) as Promise<Page>;
}

/**
 * Delete a specific version
 */
export async function deleteVersion(
  pageSlug: string,
  versionId: number
): Promise<void> {
  return api.delete(`/pages/${pageSlug}/versions/${versionId}`) as Promise<void>;
}

/**
 * Get version count for a page
 */
export async function getVersionCount(
  pageSlug: string
): Promise<{ count: number }> {
  return api.get(`/pages/${pageSlug}/versions/count`) as Promise<{ count: number }>;
}