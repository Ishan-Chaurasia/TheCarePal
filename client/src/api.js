/**
 * TheCarePal API Client
 * Supports session cookies, offline queuing, and stable error responses.
 */

const API_BASE = '/api';

// Offline queue stored in localStorage for resilience (N10)
const OFFLINE_QUEUE_KEY = 'carepal_offline_queue';

export function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function saveOfflineQueue(queue) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function addToOfflineQueue(endpoint, method, body) {
  const queue = getOfflineQueue();
  const clientId = 'offline_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  queue.push({
    id: clientId,
    endpoint,
    method,
    body: { ...body, clientId },
    queuedAt: new Date().toISOString()
  });
  saveOfflineQueue(queue);
  return clientId;
}

export async function flushOfflineQueue() {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0 };

  const remaining = [];
  let synced = 0;

  for (const item of queue) {
    try {
      const res = await fetch(`${API_BASE}${item.endpoint}`, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item.body)
      });
      if (res.ok) {
        synced++;
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

// Unified fetch wrapper
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    credentials: 'include' // Sends httpOnly cookies
  };

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
    // If network error and is an entry save, queue offline
    if (!navigator.onLine && options.method === 'POST' && endpoint.includes('/entries')) {
      const parsedBody = JSON.parse(options.body || '{}');
      const clientId = addToOfflineQueue(endpoint, options.method, parsedBody);
      return {
        success: true,
        offline: true,
        message: 'Saved to offline queue. Will sync when reconnected.',
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
