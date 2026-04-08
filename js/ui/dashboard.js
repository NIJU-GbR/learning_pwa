'use strict';

(function () {
    if (!window.HighscoreApi || !window.HighscoreApi.isHighscoreAvailable()) {
        return;
    }

    async function refresh() {
        try {
            await window.HighscoreApi.loadDashboard();
        } catch (error) {
            // Das serverseitige Rendering bleibt als Fallback sichtbar.
        }
    }

    document.addEventListener('DOMContentLoaded', refresh);
}());
