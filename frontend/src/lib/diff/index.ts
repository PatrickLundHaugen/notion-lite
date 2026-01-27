/**
 * Diff utilities for comparing text content
 * 
 * Uses a simple word-based diff algorithm suitable for
 * comparing document content. For production, consider
 * using diff-match-patch for better results.
 */

import type { DiffSegment, DiffResult } from '@/components/versions/types.ts';

/**
 * Strip HTML tags and normalize whitespace for comparison
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  // Replace block elements with newlines
  let text = html
    .replace(/<\/?(p|div|h[1-6]|li|br|hr)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '') // Remove remaining tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Normalize whitespace
  text = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  return text;
}

/**
 * Tokenize text into words for diffing
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  return text.split(/(\s+)/).filter(token => token.length > 0);
}

/**
 * Compute longest common subsequence length matrix
 */
function lcsMatrix(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const matrix: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  return matrix;
}

/**
 * Backtrack through LCS matrix to build diff
 */
function backtrack(
  matrix: number[][],
  a: string[],
  b: string[],
  i: number,
  j: number
): DiffSegment[] {
  if (i === 0 && j === 0) {
    return [];
  }

  if (i === 0) {
    // All remaining in b are additions
    const segments = backtrack(matrix, a, b, i, j - 1);
    segments.push({ type: 'addition', text: b[j - 1] });
    return segments;
  }

  if (j === 0) {
    // All remaining in a are deletions
    const segments = backtrack(matrix, a, b, i - 1, j);
    segments.push({ type: 'deletion', text: a[i - 1] });
    return segments;
  }

  if (a[i - 1] === b[j - 1]) {
    // Match - unchanged
    const segments = backtrack(matrix, a, b, i - 1, j - 1);
    segments.push({ type: 'unchanged', text: a[i - 1] });
    return segments;
  }

  if (matrix[i - 1][j] > matrix[i][j - 1]) {
    // Deletion
    const segments = backtrack(matrix, a, b, i - 1, j);
    segments.push({ type: 'deletion', text: a[i - 1] });
    return segments;
  } else {
    // Addition
    const segments = backtrack(matrix, a, b, i, j - 1);
    segments.push({ type: 'addition', text: b[j - 1] });
    return segments;
  }
}

/**
 * Merge consecutive segments of the same type
 */
function mergeSegments(segments: DiffSegment[]): DiffSegment[] {
  if (segments.length === 0) return [];

  const merged: DiffSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    if (segments[i].type === current.type) {
      current.text += segments[i].text;
    } else {
      merged.push(current);
      current = { ...segments[i] };
    }
  }

  merged.push(current);
  return merged;
}

/**
 * Compute diff between two text strings
 * 
 * @param oldText - The original (older) text
 * @param newText - The new (current) text
 * @returns DiffResult with segments and statistics
 */
export function computeDiff(oldText: string, newText: string): DiffResult {
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);

  if (oldTokens.length === 0 && newTokens.length === 0) {
    return { segments: [], additions: 0, deletions: 0 };
  }

  if (oldTokens.length === 0) {
    return {
      segments: [{ type: 'addition', text: newText }],
      additions: newTokens.length,
      deletions: 0,
    };
  }

  if (newTokens.length === 0) {
    return {
      segments: [{ type: 'deletion', text: oldText }],
      additions: 0,
      deletions: oldTokens.length,
    };
  }

  const matrix = lcsMatrix(oldTokens, newTokens);
  const segments = backtrack(matrix, oldTokens, newTokens, oldTokens.length, newTokens.length);
  const merged = mergeSegments(segments);

  // Count additions and deletions
  let additions = 0;
  let deletions = 0;

  for (const segment of merged) {
    const wordCount = segment.text.split(/\s+/).filter(w => w.length > 0).length;
    if (segment.type === 'addition') {
      additions += wordCount;
    } else if (segment.type === 'deletion') {
      deletions += wordCount;
    }
  }

  return { segments: merged, additions, deletions };
}

/**
 * Compute diff between HTML content (strips tags first)
 */
export function computeHtmlDiff(oldHtml: string, newHtml: string): DiffResult {
  const oldText = stripHtml(oldHtml);
  const newText = stripHtml(newHtml);
  return computeDiff(oldText, newText);
}

/**
 * Format a diff result as plain text with markers
 */
export function formatDiffAsText(diff: DiffResult): string {
  return diff.segments
    .map(segment => {
      switch (segment.type) {
        case 'addition':
          return `[+${segment.text}]`;
        case 'deletion':
          return `[-${segment.text}]`;
        default:
          return segment.text;
      }
    })
    .join('');
}