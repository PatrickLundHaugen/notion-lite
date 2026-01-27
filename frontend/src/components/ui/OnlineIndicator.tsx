import { Wifi, WifiOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface OnlineIndicatorProps {
    className?: string;
    showLabel?: boolean;
}

export function OnlineIndicator({ className, showLabel = false }: OnlineIndicatorProps) {
    const {
        isOnline,
        isSyncing,
        hasPendingChanges,
        pendingCount,
        syncError,
        forceSync,
    } = useOnlineStatus();

    const getStatusInfo = () => {
        if (!isOnline) {
            return {
                icon: WifiOff,
                label: 'Offline',
                color: 'text-tag-orange',
                bgColor: 'bg-tag-orange/10',
                borderColor: 'border-tag-orange',
            };
        }

        if (isSyncing) {
            return {
                icon: RefreshCw,
                label: 'Syncing',
                color: 'text-tag-blue',
                bgColor: 'bg-tag-blue/10',
                borderColor: 'border-tag-blue',
                animate: true,
            };
        }

        if (syncError) {
            return {
                icon: AlertCircle,
                label: 'Sync Error',
                color: 'text-tag-red',
                bgColor: 'bg-tag-red/10',
                borderColor: 'border-tag-red',
                clickable: true,
            };
        }

        if (hasPendingChanges) {
            return {
                icon: RefreshCw,
                label: `${pendingCount} pending`,
                color: 'text-tag-yellow',
                bgColor: 'bg-tag-yellow/10',
                borderColor: 'border-tag-yellow',
            };
        }

        return {
            icon: isOnline ? Wifi : Check,
            label: 'Synced',
            color: 'text-tag-green',
            bgColor: 'bg-tag-green/10',
            borderColor: 'border-tag-green',
        };
    };

    const status = getStatusInfo();
    const Icon = status.icon;

    const handleClick = () => {
        if (status.clickable || hasPendingChanges) {
            forceSync();
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isSyncing}
            className={cn(
                "inline-flex items-center gap-1 h-10 px-6 transition-colors border",
                status.bgColor,
                status.borderColor,
                (status.clickable || hasPendingChanges) && "cursor-pointer hover:opacity-80",
                className
            )}
        >
            <Icon
                size={12}
                className={cn(
                    status.color,
                    status.animate && "animate-spin"
                )}
            />
            {showLabel && (
                <span className={cn(
                    "text-sm font-medium",
                    status.color
                )}>
              {status.label}
            </span>
            )}
        </button>
    );
}

export function OfflineBanner() {
    const { isOnline, hasPendingChanges, pendingCount, forceSync } = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-tag-orange text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
                <WifiOff size={16} />
                <span className="text-sm font-medium">
          You are offline
        </span>
                {hasPendingChanges && (
                    <span className="text-xs opacity-80">
            • {pendingCount} changes will sync when reconnected
          </span>
                )}
            </div>
            <button
                onClick={forceSync}
                className="text-[10px] font-bold px-3 py-1 bg-white/20 hover:bg-white/30 transition-colors"
            >
                Retry
            </button>
        </div>
    );
}