import { getOfflineDB, PendingFeedback } from './db';

/**
 * Queue a feedback submission to IndexedDB
 */
export async function queueFeedback(feedback: Omit<PendingFeedback, 'createdAt' | 'syncAttempts' | 'id'>) {
    const db = await getOfflineDB();
    await db.put('pendingFeedback', {
        ...feedback,
        createdAt: new Date().toISOString(),
        syncAttempts: 0
    });
    console.log('[Offline] Feedback queued for sync');
}

/**
 * Attempt to sync all pending feedback
 */
export async function syncPendingFeedback() {
    if (typeof window === 'undefined') return;
    
    // Check network
    if (!navigator.onLine) return;

    try {
      const db = await getOfflineDB();
      const pending = await db.getAll('pendingFeedback');

      if (pending.length === 0) return;

      console.log(`[Sync] Found ${pending.length} pending feedback items.`);

      for (const item of pending) {
          try {
              // Attempt submission to API
              // Payload is now exactly what the API expects
               
              const { id: _, syncAttempts: __, createdAt: ___, ...payload } = item;
              
              const response = await fetch('/api/v1/feedback', { 
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
              });

              if (response.ok) {
                 // Cleanup on success
                 if (item.id !== undefined) await db.delete('pendingFeedback', item.id);
              } else {
                 // Increment attempts if retryable
                 if (item.id !== undefined) {
                     const updated = { ...item, syncAttempts: (item.syncAttempts || 0) + 1 };
                     if (updated.syncAttempts > 5) {
                         // Give up after 5 tries
                         await db.delete('pendingFeedback', item.id);
                     } else {
                         await db.put('pendingFeedback', updated);
                     }
                 }
              }
          } catch (err) {
              console.error('[Sync] Failed to sync feedback item', err);
          }
      }
    } catch (error) {
       console.error('[Sync] Error accessing offline DB for feedback', error);
    }
}
