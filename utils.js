/**
 * Utility functions for Travel Document Generator
 */

export function showToast(message, type = 'info') {
    let toastEl = document.getElementById('toast');
    let toastMessageEl = document.getElementById('toastMessage');
    if (!toastEl) return;
    
    if (toastMessageEl) {
        toastMessageEl.textContent = message;
    } else {
        toastEl.textContent = message;
    }
    
    toastEl.className = `toast show ${type}`;
    
    if (window._toastTimeout) {
        clearTimeout(window._toastTimeout);
    }
    
    window._toastTimeout = setTimeout(() => {
        toastEl.className = toastEl.className.replace('show', '').trim();
    }, 3800);
}
