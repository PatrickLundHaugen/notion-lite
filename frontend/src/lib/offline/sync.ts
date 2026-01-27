/**
 * Sync service for online/offline synchronization
 * 
 * Handles:
 * - Initial data sync from server to IndexedDB
 * - Processing sync queue when online
 * - Conflict resolution (last-write-wins)
 */

import { api } from '@/lib/api';
import {
  db,
  pageOps,
  tagOps,
  syncQueueOps,
  setLastSyncTime,
  type OfflinePage,
  type OfflineTag,
  type SyncQueueItem,
} from './db';
import type { Page } from '@/components/editor/types';
import type { TagData } from '@/components/tags/types';

// ============================================
// Types
// ============================================

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncTime: Date | null;
  pendingCount: number;
  error: string | null;
}

type SyncListener = (state: SyncState) => void;

// ============================================
// Sync Service
// ============================================

class SyncService {
  private listeners: Set<SyncListener> = new Set();
  private state: SyncState = {
    status: 'idle',
    lastSyncTime: null,
    pendingCount: 0,
    error: null,
  };
  private syncInProgress = false;
  private isOnline = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  // ============================================
  // State management
  // ============================================

  private updateState(partial: Partial<SyncState>) {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state); // Immediate callback with current state
    return () => this.listeners.delete(listener);
  }

  getState(): SyncState {
    return this.state;
  }

  // ============================================
  // Online/Offline handlers
  // ============================================

  private handleOnline = async () => {
    this.isOnline = true;
    this.updateState({ status: 'idle' });
    // Auto-sync when coming back online
    await this.processQueue();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.updateState({ status: 'offline' });
  };

  // ============================================
  // Initial sync (server -> local)
  // ============================================

  /**
   * Full sync from server to local database
   * Called on app load when online
   */
  async initialSync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    this.updateState({ status: 'syncing', error: null });

    try {
      // Fetch all data from server
      const [serverPages, serverTags] = await Promise.all([
        api.get('/pages') as Promise<Page[]>,
        api.get('/tags') as Promise<TagData[]>,
      ]);

      // Sync tags first (pages reference tags)
      await this.syncTagsFromServer(serverTags);

      // Sync pages
      await this.syncPagesFromServer(serverPages);

      // Update sync time
      const now = new Date();
      await setLastSyncTime(now);
      
      this.updateState({ 
        status: 'idle', 
        lastSyncTime: now,
        pendingCount: await db.syncQueue.count(),
      });
    } catch (error) {
      console.error('Initial sync failed:', error);
      this.updateState({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Sync failed',
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncTagsFromServer(serverTags: TagData[]): Promise<void> {
    const localTags = await tagOps.getAll();
    const localTagsByServerId = new Map(
      localTags.filter(t => t.serverId).map(t => [t.serverId, t])
    );

    for (const serverTag of serverTags) {
      const localTag = localTagsByServerId.get(serverTag.id);
      
      if (!localTag) {
        // New tag from server
        await tagOps.save({
          serverId: serverTag.id,
          name: serverTag.name,
          color: serverTag.color,
          createdAt: serverTag.created_at,
          syncStatus: 'synced',
        }, false);
      } else if (localTag.syncStatus === 'synced') {
        // Update local with server data (server wins for synced items)
        await db.tags.update(localTag.id!, {
          name: serverTag.name,
          color: serverTag.color,
          syncStatus: 'synced',
        });
      }
      // If localTag.syncStatus === 'pending', keep local changes
    }

    // Delete local tags that don't exist on server (and aren't pending)
    for (const localTag of localTags) {
      if (localTag.serverId && localTag.syncStatus === 'synced') {
        const existsOnServer = serverTags.some(st => st.id === localTag.serverId);
        if (!existsOnServer) {
          await db.tags.delete(localTag.id!);
        }
      }
    }
  }

  private async syncPagesFromServer(serverPages: Page[]): Promise<void> {
    // Flatten server pages (they come as a tree)
    const flatServerPages = this.flattenPages(serverPages);
    
    const localPages = await pageOps.getAll();
    const localPagesByServerId = new Map(
      localPages.filter(p => p.serverId).map(p => [p.serverId, p])
    );

    for (const serverPage of flatServerPages) {
      const localPage = localPagesByServerId.get(serverPage.id);
      
      if (!localPage) {
        // New page from server
        await pageOps.save({
          serverId: serverPage.id,
          slug: serverPage.slug,
          title: serverPage.title,
          content: serverPage.content,
          parentId: serverPage.parent_id,
          createdAt: serverPage.created_at,
          updatedAt: serverPage.updated_at,
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString(),
        }, false);
      } else if (localPage.syncStatus === 'synced') {
        // Update local with server data
        await db.pages.update(localPage.id!, {
          title: serverPage.title,
          content: serverPage.content,
          parentId: serverPage.parent_id,
          updatedAt: serverPage.updated_at,
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString(),
        });
      }
      // If localPage.syncStatus === 'pending', keep local changes
    }

    // Delete local pages that don't exist on server (and aren't pending)
    for (const localPage of localPages) {
      if (localPage.serverId && localPage.syncStatus === 'synced') {
        const existsOnServer = flatServerPages.some(sp => sp.id === localPage.serverId);
        if (!existsOnServer) {
          await db.pages.delete(localPage.id!);
        }
      }
    }
  }

  private flattenPages(pages: Page[]): Page[] {
    const result: Page[] = [];
    
    const flatten = (pageList: Page[]) => {
      for (const page of pageList) {
        result.push(page);
        if (page.children?.length) {
          flatten(page.children);
        }
      }
    };
    
    flatten(pages);
    return result;
  }

  // ============================================
  // Process sync queue (local -> server)
  // ============================================

  /**
   * Process pending changes in the queue
   */
  async processQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    const queue = await syncQueueOps.getAll();
    if (queue.length === 0) return;

    this.syncInProgress = true;
    this.updateState({ status: 'syncing', error: null });

    let processedCount = 0;
    const maxRetries = 3;

    for (const item of queue) {
      if (item.retryCount >= maxRetries) {
        console.warn(`Skipping item ${item.id} after ${maxRetries} retries`);
        continue;
      }

      try {
        await this.processSyncItem(item);
        await syncQueueOps.remove(item.id!);
        processedCount++;
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        await syncQueueOps.incrementRetry(
          item.id!,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    const remainingCount = await db.syncQueue.count();
    
    this.updateState({ 
      status: remainingCount > 0 ? 'error' : 'idle',
      pendingCount: remainingCount,
      error: remainingCount > 0 ? `${remainingCount} items failed to sync` : null,
    });

    this.syncInProgress = false;
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const payload = JSON.parse(item.payload);

    switch (item.entityType) {
      case 'page':
        await this.syncPage(item, payload);
        break;
      case 'tag':
        await this.syncTag(item, payload);
        break;
      default:
        console.warn(`Unknown entity type: ${item.entityType}`);
    }
  }

  private async syncPage(item: SyncQueueItem, payload: Partial<OfflinePage>): Promise<void> {
    switch (item.action) {
      case 'create': {
        const response = await api.post('/pages', {
          title: payload.title,
          content: payload.content,
          parent_id: payload.parentId,
        }) as Page;
        await pageOps.markSynced(item.entityId, response.id);
        // Update slug from server
        await db.pages.update(item.entityId, { slug: response.slug });
        break;
      }
      case 'update': {
        const localPage = await db.pages.get(item.entityId);
        if (localPage?.serverId) {
          await api.put(`/pages/${localPage.serverId}`, {
            title: payload.title,
            content: payload.content,
          });
          await pageOps.markSynced(item.entityId, localPage.serverId);
        }
        break;
      }
      case 'delete': {
        if (payload.serverId) {
          try {
            await api.delete(`/pages/${payload.serverId}`);
          } catch (error) {
            // Ignore 404 errors (already deleted on server)
            if (!(error instanceof Error && error.message.includes('404'))) {
              throw error;
            }
          }
        }
        break;
      }
    }
  }

  private async syncTag(item: SyncQueueItem, payload: Partial<OfflineTag>): Promise<void> {
    switch (item.action) {
      case 'create': {
        const response = await api.post('/tags', {
          name: payload.name,
          color: payload.color,
        }) as TagData;
        await tagOps.markSynced(item.entityId, response.id);
        break;
      }
      case 'update': {
        const localTag = await db.tags.get(item.entityId);
        if (localTag?.serverId) {
          await api.put(`/tags/${localTag.serverId}`, {
            name: payload.name,
            color: payload.color,
          });
          await tagOps.markSynced(item.entityId, localTag.serverId);
        }
        break;
      }
      case 'delete': {
        if (payload.serverId) {
          try {
            await api.delete(`/tags/${payload.serverId}`);
          } catch (error) {
            if (!(error instanceof Error && error.message.includes('404'))) {
              throw error;
            }
          }
        }
        break;
      }
    }
  }

  // ============================================
  // Manual sync trigger
  // ============================================

  async forceSync(): Promise<void> {
    await this.processQueue();
    await this.initialSync();
  }

  // ============================================
  // Cleanup
  // ============================================

  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
  }
}

// Singleton export
export const syncService = new SyncService();