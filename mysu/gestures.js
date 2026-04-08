/* ============================================
   MySU — Gestes tactiles (swipe + appui long)
   ============================================ */

const Gestures = (() => {
  const SWIPE_THRESHOLD = 60; // pixels minimum for swipe
  const LONG_PRESS_MS = 600;  // ms for long press

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let longPressTimer = null;
  let currentRow = null;
  let isSwiping = false;

  function init() {
    const table = document.getElementById('stock-table');
    if (!table) return;

    table.addEventListener('touchstart', onTouchStart, { passive: true });
    table.addEventListener('touchmove', onTouchMove, { passive: false });
    table.addEventListener('touchend', onTouchEnd, { passive: true });
    table.addEventListener('touchcancel', onTouchCancel, { passive: true });
  }

  function getRow(target) {
    const tr = target.closest('tbody tr');
    return tr;
  }

  function onTouchStart(e) {
    const row = getRow(e.target);
    if (!row) return;

    // Don't interfere with checkbox taps
    if (e.target.type === 'checkbox') return;

    currentRow = row;
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
    isSwiping = false;

    // Start long press timer
    longPressTimer = setTimeout(() => {
      if (!isSwiping && currentRow) {
        onLongPress(currentRow);
        currentRow = null;
      }
    }, LONG_PRESS_MS);
  }

  function onTouchMove(e) {
    if (!currentRow) return;

    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    // If vertical movement > horizontal, it's scrolling
    if (Math.abs(dy) > Math.abs(dx) && !isSwiping) {
      clearTimeout(longPressTimer);
      currentRow.style.transform = '';
      currentRow = null;
      return;
    }

    if (Math.abs(dx) > 20) {
      isSwiping = true;
      clearTimeout(longPressTimer);
      e.preventDefault();

      // Visual feedback
      const clampedDx = Math.max(-100, Math.min(100, dx));
      currentRow.style.transform = `translateX(${clampedDx}px)`;
      currentRow.style.transition = 'none';

      if (dx > 30) {
        currentRow.classList.add('swiping-right');
        currentRow.classList.remove('swiping-left');
      } else if (dx < -30) {
        currentRow.classList.add('swiping-left');
        currentRow.classList.remove('swiping-right');
      } else {
        currentRow.classList.remove('swiping-right', 'swiping-left');
      }
    }
  }

  function onTouchEnd(e) {
    clearTimeout(longPressTimer);

    if (!currentRow) return;

    const row = currentRow;
    currentRow = null;

    // Reset visual
    row.style.transition = 'transform 0.3s ease';
    row.style.transform = '';
    row.classList.remove('swiping-right', 'swiping-left');

    if (!isSwiping) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;

    if (dx > SWIPE_THRESHOLD) {
      onSwipeRight(row);
    } else if (dx < -SWIPE_THRESHOLD) {
      onSwipeLeft(row);
    }
  }

  function onTouchCancel() {
    clearTimeout(longPressTimer);
    if (currentRow) {
      currentRow.style.transform = '';
      currentRow.classList.remove('swiping-right', 'swiping-left');
      currentRow = null;
    }
  }

  // ---- ACTIONS ----

  function onSwipeRight(row) {
    const rowIndex = parseInt(row.dataset.rowIndex);
    const product = row.dataset.product || '';
    UI.showActionSheet('sortie', rowIndex, product);
  }

  function onSwipeLeft(row) {
    const rowIndex = parseInt(row.dataset.rowIndex);
    const product = row.dataset.product || '';
    UI.showActionSheet('retour', rowIndex, product);
  }

  function onLongPress(row) {
    // Vibrate for feedback if available
    if (navigator.vibrate) navigator.vibrate(50);

    const sheetId = App.getSheetId();
    if (sheetId) {
      window.open(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`, '_blank');
      UI.showToast('Google Sheet ouvert');
    }
  }

  return { init };
})();
