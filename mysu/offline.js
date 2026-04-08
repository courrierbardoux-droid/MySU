/* ============================================
   MySU — File d'attente offline + synchronisation — Phase 5
   ============================================ */

const Offline = (() => {
  const QUEUE_KEY = 'mysu_offline_queue';

  function getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
  }

  function saveQueue(queue) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    updateBanner();
  }

  // Add an operation to the queue
  function enqueue(operation) {
    const queue = getQueue();
    queue.push({
      ...operation,
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString()
    });
    saveQueue(queue);
  }

  // Queue an add-row operation
  function queueAdd(values) {
    enqueue({ type: 'add', values });
    UI.showToast('Ajout en file d\'attente (offline)');
  }

  // Queue a delete-row operation
  function queueDelete(rowIndex, productName) {
    enqueue({ type: 'delete', rowIndex, productName });
    UI.showToast('Suppression en file d\'attente (offline)');
  }

  // Process the queue when back online
  async function processQueue() {
    const queue = getQueue();
    if (queue.length === 0) return;

    const sheetId = App.getSheetId();
    const token = App.getToken();
    if (!sheetId || !token) return;

    let processed = 0;
    let errors = 0;
    const remaining = [];

    for (const op of queue) {
      try {
        if (op.type === 'add') {
          await Sheets.addRow(sheetId, op.values);
          processed++;
        } else if (op.type === 'delete') {
          // Re-read data to find current row index (may have shifted)
          const rows = await Sheets.readStock(sheetId);
          const { stock } = Sheets.parseRows(rows);

          // Find the row by product name match
          let found = false;
          for (const item of stock) {
            if ((item.data[0] || '').toUpperCase() === (op.productName || '').toUpperCase()) {
              await Sheets.deleteRow(sheetId, item.rowIndex);
              processed++;
              found = true;
              break;
            }
          }

          if (!found) {
            // Could not find the row, skip
            processed++;
          }
        }
      } catch (err) {
        console.error('Queue processing error:', err);
        remaining.push(op);
        errors++;
      }
    }

    saveQueue(remaining);

    if (processed > 0) {
      UI.showToast(`${processed} opération(s) synchronisée(s)${errors > 0 ? `, ${errors} erreur(s)` : ''}`);
      await App.refresh();
    }

    // Also sync learned rules
    Rules.syncToDrive();
  }

  // Update the offline banner
  function updateBanner() {
    const banner = document.getElementById('offline-banner');
    const queue = getQueue();

    if (!navigator.onLine) {
      if (queue.length > 0) {
        banner.textContent = `⚠ Mode offline — ${queue.length} opération(s) en attente`;
      } else {
        banner.textContent = '⚠ Mode offline — données en cache';
      }
      banner.classList.add('visible');
    } else {
      banner.classList.remove('visible');
    }
  }

  // Setup listeners
  function init() {
    window.addEventListener('online', () => {
      updateBanner();
      // Auto-sync when back online
      setTimeout(() => processQueue(), 1000);
    });

    window.addEventListener('offline', () => {
      updateBanner();
    });

    updateBanner();
  }

  return { init, queueAdd, queueDelete, processQueue, getQueue, updateBanner };
})();
