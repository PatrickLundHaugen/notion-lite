/**
 * Offline support module
 * 
 * Provides IndexedDB storage and sync functionality
 * for offline-first PWA experience.
 */

export {
  db,
  clearAllData,
  getLastSyncTime,
  setLastSyncTime,
  hasPendingChanges,
  getPendingChangesCount,
  pageOps,
  tagOps,
  syncQueueOps,
  type OfflinePage,
  type OfflineTag,
  type SyncQueueItem,
} from './db';

export {
  syncService,
  type SyncStatus,
  type SyncState,
} from './sync';