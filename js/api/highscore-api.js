'use strict';

(function () {
    const apiUrl = 'api/highscores.php';

    // Kleine Fetch-Hilfsfunktion für die Highscore-REST-API.
    async function requestJson(url, options) {
        const response = await fetch(url, options);
        const responseData = await response.json().catch(function () {
            return null;
        });

        if (!response.ok) {
            if (responseData && responseData.error) {
                throw new Error(String(responseData.error));
            }

            throw new Error('HTTP-Status ' + response.status);
        }

        return responseData;
    }

    // Öffentliche API für Lesen, Speichern und Verfügbarkeit prüfen.
    window.HighscoreApi = {
        isHighscoreAvailable: function () {
            return window.location.protocol !== 'file:' && navigator.onLine;
        },
        getUserStatus: function (username) {
            const query = '?action=user-status&username=' + encodeURIComponent(username);

            return requestJson(apiUrl + query, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
        },
        registerUser: function (payload) {
            return requestJson(apiUrl + '?action=register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        },
        loginUser: function (payload) {
            return requestJson(apiUrl + '?action=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        },
        logoutUser: function () {
            return requestJson(apiUrl + '?action=logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: '{}'
            });
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
