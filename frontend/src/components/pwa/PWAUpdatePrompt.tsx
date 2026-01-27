import { useState, useEffect } from 'react';
import { RefreshCw, X, CheckCircle } from 'lucide-react';
import { pwaManager, type PWAState } from '@/lib/pwa/register';

/**
 * PWA Update Prompt
 * 
 * Shows a notification when a new version is available
 * and prompts the user to refresh.
 */
export function PWAUpdatePrompt() {
  const [pwaState, setPwaState] = useState<PWAState>(pwaManager.getState());

  useEffect(() => {
    return pwaManager.subscribe(setPwaState);
  }, []);

  if (!pwaState.needsRefresh && !pwaState.offlineReady) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {/* Update Available */}
      {pwaState.needsRefresh && (
        <div className="bg-card border-2 border-foreground shadow-lg p-4 mb-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 border-2 border-tag-blue flex items-center justify-center flex-shrink-0">
              <RefreshCw size={14} className="text-tag-blue" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
                Update Available
              </p>
              <p className="text-sm mb-3">
                A new version is available. Refresh to get the latest features.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => pwaState.updateServiceWorker()}
                  className="px-3 py-1.5 bg-foreground text-background text-[10px] font-semibold uppercase tracking-[0.1em] hover:bg-foreground/90 transition-colors"
                >
                  Refresh Now
                </button>
                <button
                  onClick={() => pwaManager.dismissUpdate()}
                  className="px-3 py-1.5 border-2 border-border text-[10px] font-semibold uppercase tracking-[0.1em] hover:bg-muted transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={() => pwaManager.dismissUpdate()}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Offline Ready */}
      {pwaState.offlineReady && !pwaState.needsRefresh && (
        <div className="bg-card border-2 border-tag-green shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 border-2 border-tag-green flex items-center justify-center flex-shrink-0">
              <CheckCircle size={14} className="text-tag-green" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tag-green mb-1">
                Ready for Offline
              </p>
              <p className="text-sm text-muted-foreground">
                App has been cached and can work offline.
              </p>
            </div>
            <button
              onClick={() => pwaManager.dismissOfflineReady()}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to access PWA state
 */
export function usePWA() {
  const [state, setState] = useState<PWAState>(pwaManager.getState());

  useEffect(() => {
    return pwaManager.subscribe(setState);
  }, []);

  return {
    ...state,
    dismissUpdate: () => pwaManager.dismissUpdate(),
    dismissOfflineReady: () => pwaManager.dismissOfflineReady(),
  };
}