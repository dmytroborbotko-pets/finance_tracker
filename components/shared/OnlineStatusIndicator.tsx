'use client';

import { WifiOff, Wifi } from 'lucide-react';
import { useGlobalContext } from '@/lib/store/GlobalContext';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { useEffect, useState } from 'react';

export function OnlineStatusIndicator() {
  const { isOnline } = useGlobalContext();
  const networkStatus = useNetworkStatus();
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  // Show offline banner when offline
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineBanner(true);
      setJustCameOnline(false);
    } else {
      // Show "back online" message briefly
      if (showOfflineBanner) {
        setJustCameOnline(true);
        setTimeout(() => {
          setShowOfflineBanner(false);
          setJustCameOnline(false);
        }, 3000); // Hide after 3 seconds
      }
    }
  }, [isOnline, showOfflineBanner]);

  if (!showOfflineBanner && !justCameOnline) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-2 px-4 text-sm font-medium transition-all ${
        isOnline
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You are offline</span>
            {networkStatus.effectiveType && (
              <span className="ml-2 text-xs opacity-80">
                Last connection: {networkStatus.effectiveType}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Small status indicator dot for showing in navigation or header
 */
export function OnlineStatusDot() {
  const { isOnline } = useGlobalContext();

  return (
    <div
      className="relative inline-flex items-center justify-center"
      title={isOnline ? 'Online' : 'Offline'}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      {isOnline && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
      )}
    </div>
  );
}
