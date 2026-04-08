'use strict';

(function () {
    const apiUrl = 'api/highscores.php';

    // Kleine Fetch-Hilfsfunktion für die Highscore-REST-API.
    async function requestJson(url, options) {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error('HTTP-Status ' + response.status);
        }

        return response.json();
    }

    // Öffentliche API für Lesen, Speichern und Verfügbarkeit prüfen.
    window.HighscoreApi = {
        isHighscoreAvailable: function () {
            return window.location.protocol !== 'file:' && navigator.onLine;
        },
        saveScore: function (payload) {
            return requestJson(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        },
        loadDashboard: function (category) {
            const query = category ? ('?category=' + encodeURIComponent(category)) : '';

            return requestJson(apiUrl + query, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
        }
    };
}());
