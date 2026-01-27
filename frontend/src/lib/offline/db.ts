/**
 * IndexedDB database using Dexie.js
 * 
 * Stores pages, tags, and sync queue for offline support.
 * Data is synced with the server when online.
 */

import Dexie, { type Table } from 'dexie';

// ============================================
// Types for offline storage
// ============================================

export interface OfflinePage {
  id?: number;           // Auto-increment local ID
  serverId: number | null; // Server ID (null for new pages)
  slug: string;
  title: string;
  content: string | null;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
  lastSyncedAt: string | null;
}

export interface OfflineTag {
  id?: number;
  serverId: number | null;
  name: string;
  color: string;
  createdAt: string;
  syncStatus: 'synced' | 'pending';
}

export interface OfflinePageTag {
  id?: number;
  pageLocalId: number;
  tagLocalId: number;
  syncStatus: 'synced' | 'pending';
}

export interface SyncQueueItem {
  id?: number;
  entityType: 'page' | 'tag' | 'pageTag';
  entityId: number;        // Local ID
  action: 'create' | 'update' | 'delete';
  payload: string;         // JSON stringified data
  createdAt: string;
  retryCount: number;
  lastError: string | null;
}

export interface SyncMetadata {
  key: string;
  value: string;
}

// ============================================
// Database class
// ============================================

export class NotesDatabase extends Dexie {
  pages!: Table<OfflinePage>;
  tags!: Table<OfflineTag>;
  pageTags!: Table<OfflinePageTag>;
  syncQueue!: Table<SyncQueueItem>;
  metadata!: Table<SyncMetadata>;

  constructor() {
    super('NotesOfflineDB');

    this.version(1).stores({
      // Indexes: id is auto-increment, other fields are indexed for queries
      pages: '++id, serverId, slug, parentId, syncStatus, updatedAt',
      tags: '++id, serverId, name, syncStatus',
      pageTags: '++id, pageLocalId, tagLocalId, [pageLocalId+tagLocalId]',
      syncQueue: '++id, entityType, entityId, action, createdAt',
      metadata: 'key',
    });
  }
}

// Singleton instance
export const db = new NotesDatabase();

// ============================================
// Helper functions
// ============================================

/**
 * Clear all local data (for logout)
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.pages, db.tags, db.pageTags, db.syncQueue, db.metadata], async () => {
    await db.pages.clear();
    await db.tags.clear();
    await db.pageTags.clear();
    await db.syncQueue.clear();
    await db.metadata.clear();
  });
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<Date | null> {
  const meta = await db.metadata.get('lastSyncTime');
  return meta ? new Date(meta.value) : null;
}

/**
 * Set last sync timestamp
 */
export async function setLastSyncTime(date: Date): Promise<void> {
  await db.metadata.put({ key: 'lastSyncTime', value: date.toISOString() });
}

/**
 * Check if there are pending changes
 */
export async function hasPendingChanges(): Promise<boolean> {
  const pendingCount = await db.syncQueue.count();
  return pendingCount > 0;
}

/**
 * Get pending changes count
 */
export async function getPendingChangesCount(): Promise<number> {
  return db.syncQueue.count();
}

// ============================================
// Page operations
// ============================================

export const pageOps = {
  /**
   * Get all pages (for sidebar)
   */
  async getAll(): Promise<OfflinePage[]> {
    return db.pages.toArray();
  },

  /**
   * Get page by slug
   */
  async getBySlug(slug: string): Promise<OfflinePage | undefined> {
    return db.pages.where('slug').equals(slug).first();
  },

  /**
   * Get page by server ID
   */
  async getByServerId(serverId: number): Promise<OfflinePage | undefined> {
    return db.pages.where('serverId').equals(serverId).first();
  },

  /**
   * Save page (create or update)
   */
  async save(page: Omit<OfflinePage, 'id'>, queueSync = true): Promise<number> {
    const now = new Date().toISOString();
    const existing = page.serverId 
      ? await this.getByServerId(page.serverId)
      : await this.getBySlug(page.slug);

    if (existing?.id) {
      // Update
      await db.pages.update(existing.id, {
        ...page,
        updatedAt: now,
        syncStatus: queueSync ? 'pending' : page.syncStatus,
      });

      if (queueSync) {
        await addToSyncQueue('page', existing.id, 'update', page);
      }

      return existing.id;
    } else {
      // Create
      const localId = await db.pages.add({
        ...page,
        createdAt: now,
        updatedAt: now,
        syncStatus: queueSync ? 'pending' : 'synced',
        lastSyncedAt: queueSync ? null : now,
      });

      if (queueSync && !page.serverId) {
        await addToSyncQueue('page', localId, 'create', page);
      }

      return localId;
    }
  },

  /**
   * Delete page
   */
  async delete(localId: number, queueSync = true): Promise<void> {
    const page = await db.pages.get(localId);
    if (!page) return;

    await db.pages.delete(localId);

    // Also delete page tags
    await db.pageTags.where('pageLocalId').equals(localId).delete();

    if (queueSync && page.serverId) {
      await addToSyncQueue('page', localId, 'delete', { serverId: page.serverId });
    }
  },

  /**
   * Mark page as synced
   */
  async markSynced(localId: number, serverId: number): Promise<void> {
    await db.pages.update(localId, {
      serverId,
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
    });
  },

  /**
   * Build page tree (nested structure)
   */
  async getTree(): Promise<OfflinePage[]> {
    const allPages = await this.getAll();
    const rootPages: OfflinePage[] = [];

    for (const page of allPages) {
      if (page.parentId === null) {
        rootPages.push(page);
      }
    }

    return rootPages.sort((a, b) => a.title.localeCompare(b.title));
  },
};

// ============================================
// Tag operations
// ============================================

export const tagOps = {
  async getAll(): Promise<OfflineTag[]> {
    return db.tags.toArray();
  },

  async getByServerId(serverId: number): Promise<OfflineTag | undefined> {
    return db.tags.where('serverId').equals(serverId).first();
  },

  async save(tag: Omit<OfflineTag, 'id'>, queueSync = true): Promise<number> {
    const now = new Date().toISOString();
    const existing = tag.serverId ? await this.getByServerId(tag.serverId) : undefined;

    if (existing?.id) {
      await db.tags.update(existing.id, {
        ...tag,
        syncStatus: queueSync ? 'pending' : tag.syncStatus,
      });

      if (queueSync) {
        await addToSyncQueue('tag', existing.id, 'update', tag);
      }

      return existing.id;
    } else {
      const localId = await db.tags.add({
        ...tag,
        createdAt: now,
        syncStatus: queueSync ? 'pending' : 'synced',
      });

      if (queueSync && !tag.serverId) {
        await addToSyncQueue('tag', localId, 'create', tag);
      }

      return localId;
    }
  },

  async delete(localId: number, queueSync = true): Promise<void> {
    const tag = await db.tags.get(localId);
    if (!tag) return;

    await db.tags.delete(localId);
    await db.pageTags.where('tagLocalId').equals(localId).delete();

    if (queueSync && tag.serverId) {
      await addToSyncQueue('tag', localId, 'delete', { serverId: tag.serverId });
    }
  },

  async markSynced(localId: number, serverId: number): Promise<void> {
    await db.tags.update(localId, {
      serverId,
      syncStatus: 'synced',
    });
  },
};

// ============================================
// Sync queue operations
// ============================================

async function addToSyncQueue(
  entityType: SyncQueueItem['entityType'],
  entityId: number,
  action: SyncQueueItem['action'],
  payload: unknown
): Promise<void> {
  // Remove any existing queue items for this entity
  await db.syncQueue
    .where('[entityType+entityId]')
    .equals([entityType, entityId])
    .delete();

  await db.syncQueue.add({
    entityType,
    entityId,
    action,
    payload: JSON.stringify(payload),
    createdAt: new Date().toISOString(),
    retryCount: 0,
    lastError: null,
  });
}

export const syncQueueOps = {
  async getAll(): Promise<SyncQueueItem[]> {
    return db.syncQueue.orderBy('createdAt').toArray();
  },

  async remove(id: number): Promise<void> {
    await db.syncQueue.delete(id);
  },

  async incrementRetry(id: number, error: string): Promise<void> {
    const item = await db.syncQueue.get(id);
    if (item) {
      await db.syncQueue.update(id, {
        retryCount: item.retryCount + 1,
        lastError: error,
      });
    }
  },

  async clear(): Promise<void> {
    await db.syncQueue.clear();
  },
};