/**
 * Types for version history feature
 */

export interface PageVersionSummary {
  id: number;
  page_id: number;
  title: string;
  content_length: number;
  created_at: string;
}

export interface PageVersion extends PageVersionSummary {
  content: string | null;
}

export interface PageVersionList {
  versions: PageVersionSummary[];
  total: number;
  has_more: boolean;
}

export interface VersionCreateRequest {
  title?: string;
  content?: string;
}

/**
 * Grouped versions for display
 */
export interface VersionGroup {
  label: string;
  versions: PageVersionSummary[];
}

/**
 * Diff types for comparing versions
 */
export type DiffType = 'addition' | 'deletion' | 'unchanged';

export interface DiffSegment {
  type: DiffType;
  text: string;
}

export interface DiffResult {
  segments: DiffSegment[];
  additions: number;
  deletions: number;
}