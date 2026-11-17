import React, { useState, useEffect } from 'react';
import { flushOfflineQueue, getOfflineQueue } from '../api.js';
import { Wifi, WifiOff, RefreshCw, CheckCircle, Radio } from 'lucide-react';

export default function OfflineBadge({ onSynced }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(getOfflineQueue().length);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChange = (e) => {
      setPendingCount(e.detail?.count ?? getOfflineQueue().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('carepal:queue-change', handleQueueChange);

    const interval = setInterval(() => {
      setPendingCount(getOfflineQueue().length);
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('carepal:queue-change', handleQueueChange);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    setLastSyncResult(null);
    try {
      const res = await flushOfflineQueue();
      setPendingCount(getOfflineQueue().length);
      if (res.synced > 0) {
        setLastSyncResult(`Synced ${res.synced} entry${res.synced > 1 ? 'ies' : ''} to server`);
        setTimeout(() => setLastSyncResult(null), 4000);
        if (onSynced) onSynced();
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1.5">
      {lastSyncResult && (
        <div className="bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/30 px-3 py-1.5 rounded-md text-xs font-bold shadow-md flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4" />
          <span>{lastSyncResult}</span>
        </div>
      )}

      <div className="flex items-center gap-2 bg-[#3A342D] text-[#F1F3F2] px-3.5 py-2 rounded-lg shadow-xl border border-[#D9D3CA]/30 text-xs font-medium">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-[#B3261E] animate-pulse" />
            <span className="font-semibold text-[#F1F3F2]">Offline mode</span>
            <span className="bg-[#B3261E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingCount} queued
            </span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <Radio className="w-4 h-4 text-[#46B3C6]" />
            <span>{pendingCount} offline {pendingCount === 1 ? 'entry' : 'entries'} queued</span>
            <button
              type="button"
              onClick={triggerSync}
              disabled={syncing}
              className="ml-1 px-2.5 py-1 bg-[#17707F] text-white font-bold rounded hover:bg-[#135d6a] transition-colors flex items-center gap-1 text-[11px]"
              title="Sync queued entries now"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing…' : 'Sync now'}</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-[#D9D3CA]">
            <Wifi className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>PWA Ready · Online</span>
          </div>
        )}
      </div>
    </div>
  );
}
