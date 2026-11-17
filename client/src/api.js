/**
 * TheCarePal API Client & Offline PWA Synchronizer (N10)
 * Uses persistent storage with unique clientIds for zero-duplicate synchronization.
 */

const API_BASE = '/api';
const OFFLINE_QUEUE_KEY = 'carepal_offline_queue';

// Retrieve all queued actions
export function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

// Persist offline queue
export function saveOfflineQueue(queue) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('carepal:queue-change', { detail: { count: queue.length } }));
}

// Add an entry action to the offline queue
export function addToOfflineQueue(endpoint, method, body) {
  const queue = getOfflineQueue();
  const clientId = 'offline_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
  
  const queuedItem = {
    id: clientId,
    endpoint,
    method,
    body: {
      ...body,
      clientId
    },
    queuedAt: new Date().toISOString()
  };

  queue.push(queuedItem);
  saveOfflineQueue(queue);
  console.log(`[OFFLINE QUEUE] Action stored: ${method} ${endpoint} (Client ID: ${clientId})`);
  return clientId;
}

// Flush and synchronize all queued items with server
export async function flushOfflineQueue() {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, remainingCount: 0 };

  console.log(`[OFFLINE SYNC] Attempting to sync ${queue.length} queued care actions…`);
  const remaining = [];
  let synced = 0;
  const token = localStorage.getItem('carepal_token');
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  for (const item of queue) {
    try {
      const res = await fetch(`${API_BASE}${item.endpoint}`, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        credentials: 'include',
        body: JSON.stringify(item.body)
      });

      if (res.ok) {
        synced++;
        console.log(`[OFFLINE SYNC] Item successfully synced: ${item.id}`);
      } else {
        remaining.push(item);
      }
    } catch (err) {
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
  return { synced, remainingCount: remaining.length };
}

// Fetch wrapper with offline failover for write routes
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const isWrite = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(options.method?.toUpperCase());
  const token = localStorage.getItem('carepal_token');
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(options.headers || {})
    },
    credentials: 'include'
  };

  // If known to be offline and attempting write, queue immediately
  if (!navigator.onLine && isWrite && endpoint.includes('/entries')) {
    const parsedBody = JSON.parse(options.body || '{}');
    const clientId = addToOfflineQueue(endpoint, options.method, parsedBody);
    return {
      success: true,
      offline: true,
      message: 'Saved to local device offline queue. Will sync when back online.',
      entry: {
        ...parsedBody,
        clientId,
        _id: clientId,
        offlinePending: true
      }
    };
  }

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/pdf')) {
      return res.blob();
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.code = data.code || 'UNKNOWN_ERROR';
      error.data = data;
      throw error;
    }
    return data;
  } catch (err) {
    if (isWrite && endpoint.includes('/entries')) {
      const parsedBody = JSON.parse(options.body || '{}');
      const clientId = addToOfflineQueue(endpoint, options.method, parsedBody);
      return {
        success: true,
        offline: true,
        message: 'Saved to local device offline queue. Will sync when back online.',
        entry: {
          ...parsedBody,
          clientId,
          _id: clientId,
          offlinePending: true
        }
      };
    }
    throw err;
  }
}
