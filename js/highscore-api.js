'use strict';

(function () {
    const apiUrl = 'api/highscores.php';

    async function requestJson(url, options) {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error('HTTP-Status ' + response.status);
        }

        return response.json();
    }

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
