'use strict';

(function () {
    // Hält die App online/offline sauber im Blick und registriert den Service Worker.
    const serviceWorkerPath = 'sw.js';
    const offlineClassName = 'app-is-offline';
    const apiButton = document.getElementById('LoadApiQuestionsButton');

    function getConnectionNotices() {
        return Array.from(document.querySelectorAll('[data-connection-notice], #ConnectionNotice'));
    }

    // ============================================
    // ONLINE-STATUS PRUEFEN
    // ============================================

    function isOfflineMode() {
        return navigator.onLine === false;
    }

    // ============================================
    // OBERFLAECHE FUER ONLINE/OFFLINE AKTUALISIEREN
    // ============================================

    function updateConnectionUi() {
        const offline = isOfflineMode();

        if (offline) {
            document.body.classList.add(offlineClassName);
        } else {
            document.body.classList.remove(offlineClassName);
        }

        const connectionNotices = getConnectionNotices();
        let i;
        for (i = 0; i < connectionNotices.length; i++) {
            if (offline) {
                connectionNotices[i].textContent = 'Offline: Lokale Quizkategorien sind verfügbar, Highscore und API-Quiz nicht.';
            } else {
                connectionNotices[i].textContent = 'Online: Highscore und API-Quiz sind verfügbar.';
            }
        }

        if (apiButton) {
            apiButton.disabled = offline;
            apiButton.setAttribute('aria-disabled', offline ? 'true' : 'false');
        }

        window.dispatchEvent(new CustomEvent('learning-pwa-connection-change', {
            detail: {
                offline: offline
            }
        }));
    }

    // ============================================
    // SERVICE WORKER REGISTRIEREN
    // ============================================

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        window.addEventListener('load', function () {
            navigator.serviceWorker.register(serviceWorkerPath).catch(function () {
                // Die App bleibt auch ohne Registrierung normal nutzbar.
            });
        });
    }

    // ============================================
    // START
    // ============================================

    document.addEventListener('DOMContentLoaded', function () {
        updateConnectionUi();
    });

    window.addEventListener('online', updateConnectionUi);
    window.addEventListener('offline', updateConnectionUi);

    registerServiceWorker();
}());
