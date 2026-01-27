/**
 * Improved offline detection and fallback
 * 
 * Checks network status BEFORE attempting API calls to avoid
 * unnecessary CORS errors in the console.
 */

import { pageOps, tagOps } from '@/lib/offline';
import type { Page } from '@/components/editor/types';
import type { TagData } from '@/components/tags/types';

// Convert offline format to online format
function offlinePageToPage(offlinePage: any): Page {
  return {
    id: offlinePage.serverId || offlinePage.id || 0,
    slug: offlinePage.slug,
    title: offlinePage.title,
    content: offlinePage.content,
    owner_id: 0,
    parent_id: offlinePage.parentId,
    created_at: offlinePage.createdAt,
    updated_at: offlinePage.updatedAt,
    children: [],
    tags: [],
  };
}

function offlineTagToTag(offlineTag: any): TagData {
  return {
    id: offlineTag.serverId || offlineTag.id || 0,
    name: offlineTag.name,
    color: offlineTag.color,
    owner_id: 0,
    created_at: offlineTag.createdAt,
  };
}

/**
 * Check if backend is reachable (with timeout)
 */
async function isBackendReachable(): Promise<boolean> {
  if (!navigator.onLine) {
    return false; // Browser knows we're offline
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
      method: 'GET',
      mode: 'cors',
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

// Cache the online status check for a short time to avoid repeated checks
let lastOnlineCheck: { time: number; result: boolean } | null = null;
const CACHE_DURATION = 5000; // 5 seconds

async function checkIfOnline(): Promise<boolean> {
  const now = Date.now();
  
  // Use cached result if recent
  if (lastOnlineCheck && (now - lastOnlineCheck.time) < CACHE_DURATION) {
    return lastOnlineCheck.result;
  }
  
  // Check backend reachability
  const isOnline = await isBackendReachable();
  lastOnlineCheck = { time: now, result: isOnline };
  
  return isOnline;
}

/**
 * Fetch pages with automatic offline fallback
 */
export async function getPagesOfflineAware(onlineApiFn: () => Promise<Page[]>): Promise<Page[]> {
  const isOnline = await checkIfOnline();
  
  if (!isOnline) {
    console.log('📴 Offline mode: Using cached pages (backend unreachable)');
    const offlinePages = await pageOps.getAll();
    return offlinePages.map(offlinePageToPage);
  }
  
  try {
    return await onlineApiFn();
  } catch (error) {
    console.log('📴 Online API failed: Falling back to cached pages');
    const offlinePages = await pageOps.getAll();
    return offlinePages.map(offlinePageToPage);
  }
}

/**
 * Fetch tags with automatic offline fallback
 */
export async function getTagsOfflineAware(onlineApiFn: () => Promise<TagData[]>): Promise<TagData[]> {
  const isOnline = await checkIfOnline();
  
  if (!isOnline) {
    console.log('📴 Offline mode: Using cached tags (backend unreachable)');
    const offlineTags = await tagOps.getAll();
    return offlineTags.map(offlineTagToTag);
  }
  
  try {
    return await onlineApiFn();
  } catch (error) {
    console.log('📴 Online API failed: Falling back to cached tags');
    const offlineTags = await tagOps.getAll();
    return offlineTags.map(offlineTagToTag);
  }
}

/**
 * Fetch single page with automatic offline fallback
 */
export async function getPageOfflineAware(slug: string, onlineApiFn: () => Promise<Page>): Promise<Page> {
  const isOnline = await checkIfOnline();
  
  if (!isOnline) {
    console.log('📴 Offline mode: Using cached page (backend unreachable)');
    const offlinePage = await pageOps.getBySlug(slug);
    if (!offlinePage) {
      throw new Error('Page not found in offline cache');
    }
    return offlinePageToPage(offlinePage);
  }
  
  try {
    return await onlineApiFn();
  } catch (error) {
    console.log('📴 Online API failed: Falling back to cached page');
    const offlinePage = await pageOps.getBySlug(slug);
    if (!offlinePage) {
      throw new Error('Page not found in offline cache');
    }
    return offlinePageToPage(offlinePage);
  }
}

/**
 * Clear the online status cache (useful after network change events)
 */
export function clearOnlineStatusCache() {
  lastOnlineCheck = null;
}

// Listen for online/offline events to clear cache
if (typeof window !== 'undefined') {
  window.addEventListener('online', clearOnlineStatusCache);
  window.addEventListener('offline', clearOnlineStatusCache);
}