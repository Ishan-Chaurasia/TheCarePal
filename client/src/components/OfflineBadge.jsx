import React, { useState, useEffect } from 'react';
import { flushOfflineQueue, getOfflineQueue } from '../api.js';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineBadge({ onSynced }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(getOfflineQueue().length);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setPendingCount(getOfflineQueue().length);
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const res = await flushOfflineQueue();
      setPendingCount(getOfflineQueue().length);
      if (res.synced > 0 && onSynced) {
        onSynced();
      }
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-[#3A342D] text-[#F1F3F2] px-3.5 py-2 rounded-lg shadow-lg border border-[#D9D3CA]/30 text-xs font-medium">
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 text-[#B3261E]" />
          <span>Offline mode · {pendingCount} queued</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4 text-[#46B3C6]" />
          <span>{pendingCount} offline entries pending sync</span>
          <button
            type="button"
            onClick={triggerSync}
            disabled={syncing}
            className="ml-1 p-1 bg-[#17707F] rounded text-white hover:bg-[#135d6a] transition-colors"
            title="Sync now"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </>
      )}
    </div>
  );
}
