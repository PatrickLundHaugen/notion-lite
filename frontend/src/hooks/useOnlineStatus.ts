import { useState, useEffect, useCallback } from 'react';
import { syncService, type SyncState } from '@/lib/offline';

/**
 * Hook to track online/offline status and sync state
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState<SyncState>(syncService.getState());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to sync state changes
    const unsubscribe = syncService.subscribe(setSyncState);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const forceSync = useCallback(async () => {
    if (isOnline) {
      await syncService.forceSync();
    }
  }, [isOnline]);

  return {
    isOnline,
    syncState,
    forceSync,
    isSyncing: syncState.status === 'syncing',
    hasPendingChanges: syncState.pendingCount > 0,
    pendingCount: syncState.pendingCount,
    lastSyncTime: syncState.lastSyncTime,
    syncError: syncState.error,
  };
}

/**
 * Simple hook for just online/offline detection
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}