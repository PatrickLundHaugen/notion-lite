/**
 * Service Worker Registration
 * 
 * Handles PWA installation and update notifications.
 * Note: This file requires vite-plugin-pwa to be installed.
 * The virtual:pwa-register module is provided by the plugin.
 */

export interface PWAState {
  needsRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: () => void;
}

type PWAStateListener = (state: PWAState) => void;

class PWAManager {
  private listeners = new Set<PWAStateListener>();
  private state: PWAState = {
    needsRefresh: false,
    offlineReady: false,
    updateServiceWorker: () => {},
  };

  constructor() {
    this.init();
  }

  private async init() {
    // Only register in production
    if (import.meta.env.PROD) {
      try {
        // Dynamic import to avoid build errors when plugin isn't configured
        // @ts-expect-error - virtual module provided by vite-plugin-pwa
        const { registerSW } = await import('virtual:pwa-register');
        
        const updateSW = registerSW({
          onNeedRefresh: () => {
            this.updateState({ needsRefresh: true });
          },
          onOfflineReady: () => {
            this.updateState({ offlineReady: true });
          },
          onRegistered: (registration: ServiceWorkerRegistration | undefined) => {
            console.log('SW registered:', registration);
          },
          onRegisterError: (error: Error) => {
            console.error('SW registration error:', error);
          },
        });

        this.state.updateServiceWorker = () => updateSW(true);
      } catch (error) {
        console.warn('PWA registration not available:', error);
      }
    }
  }

  private updateState(partial: Partial<PWAState>) {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: PWAStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): PWAState {
    return this.state;
  }

  dismissUpdate() {
    this.updateState({ needsRefresh: false });
  }

  dismissOfflineReady() {
    this.updateState({ offlineReady: false });
  }
}

export const pwaManager = new PWAManager();