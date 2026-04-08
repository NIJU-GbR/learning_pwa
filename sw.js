'use strict';

const CACHE_NAME = 'learning-pwa-v2';
const APP_SHELL_FILES = [
    './',
    './index.php',
    './styles.css',
    './manifest.webmanifest',
    './data/questions.json',
    './js/quiz/questions_lokal.js',
    './js/quiz/questions_lokal_map.js',
    './js/quiz/questions_REST.js',
    './js/core/pwa.js',
    './js/api/highscore-api.js',
    './js/api/highscore-client.js',
    './js/ui/dashboard.js',
    './assets/app-icon.svg',
    './assets/app-icon-192.png',
    './assets/app-icon-512.png',
    './assets/favicon.svg',
    './images/deutschland.png'
];

function findOfflineAppShell() {
    return caches.match('./', { ignoreSearch: true }).then(function (cachedRootResponse) {
        if (cachedRootResponse) {
            return cachedRootResponse;
        }

        return caches.match('./index.php', { ignoreSearch: true });
    });
}

function handleNavigationRequest(event) {
    return findOfflineAppShell().then(function (cachedShellResponse) {
        if (cachedShellResponse) {
            event.waitUntil(
                fetch(event.request).then(function (networkResponse) {
                    if (!networkResponse || networkResponse.status !== 200) {
                        return;
                    }

                    const responseClone = networkResponse.clone();
                    return caches.open(CACHE_NAME).then(function (cache) {
                        return cache.put('./', responseClone);
                    });
                }).catch(function () {
                    return Promise.resolve();
                })
            );

            return cachedShellResponse;
        }

        return fetch(event.request).catch(function () {
            return findOfflineAppShell();
        });
    });
}

function handleStaticRequest(event, isSameOrigin) {
    return caches.match(event.request, { ignoreSearch: true }).then(function (cachedResponse) {
        if (cachedResponse) {
            return cachedResponse;
        }

        return fetch(event.request).then(function (networkResponse) {
            if (!isSameOrigin || !networkResponse || networkResponse.status !== 200) {
                return networkResponse;
            }

            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
                cache.put(event.request, responseClone);
            });

            return networkResponse;
        }).catch(function () {
            return Response.error();
        });
    });
}

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(APP_SHELL_FILES);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            const deletions = [];
            let i;

            for (i = 0; i < cacheNames.length; i++) {
                const cacheName = cacheNames[i];
                if (cacheName !== CACHE_NAME) {
                    deletions.push(caches.delete(cacheName));
                }
            }

            return Promise.all(deletions);
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);
    const isSameOrigin = requestUrl.origin === self.location.origin;
    const isHighscoreRequest = isSameOrigin && requestUrl.pathname.indexOf('/api/highscores.php') !== -1;
    const isExternalApiRequest = isSameOrigin === false;

    if (isHighscoreRequest || isExternalApiRequest) {
        event.respondWith(fetch(event.request));
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(event));
        return;
    }

    event.respondWith(handleStaticRequest(event, isSameOrigin));
});
