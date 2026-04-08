'use strict';

(function () {
    // Verknüpft Benutzername, Fortschritt und das Highscore-Dashboard.
    const questionTextElement = document.getElementById('Frage');
    const correctCountElement = document.getElementById('CorrectCount');
    const wrongCountElement = document.getElementById('WrongCount');
    const resetButton = document.getElementById('ResetQuizButton');
    const categoryButtons = Array.from(document.querySelectorAll('[data-category]'));
    const answerButtons = Array.from(document.querySelectorAll('#Antwort1, #Antwort2, #Antwort3, #Antwort4'));
    const usernameCookieName = 'learning_pwa_username';
    const lastCategoryStorageKey = 'learning_pwa_last_category';

    const scoreByCategory = {};
    const submittedCategories = new Set();
    let currentUsername = '';
    let pendingAnswerCategory = '';
    let lastCorrectCount = 0;
    let lastWrongCount = 0;
    let dashboardRequestToken = 0;
    let highscoreUiInitialized = false;

    function readCookie(name) {
        const cookiePrefix = name + '=';
        const allCookies = document.cookie ? document.cookie.split(';') : [];
        let i;

        for (i = 0; i < allCookies.length; i++) {
            const cookie = allCookies[i].trim();
            if (cookie.indexOf(cookiePrefix) === 0) {
                return decodeURIComponent(cookie.substring(cookiePrefix.length));
            }
        }

        return '';
    }

    function saveCookie(name, value, days) {
        const expiresAt = new Date();
        expiresAt.setTime(expiresAt.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expiresAt.toUTCString() + '; path=/; SameSite=Lax';
    }

    function deleteCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
    }

    function getActiveCategory() {
        const activeButton = document.querySelector('.category-buttons button.active');
        if (activeButton) {
            return activeButton.dataset.category || '';
        }

        if (typeof window.currentCategory === 'string') {
            return window.currentCategory;
        }

        return '';
    }

    function readLastCategory() {
        try {
            return window.localStorage.getItem(lastCategoryStorageKey) || '';
        } catch (error) {
            return '';
        }
    }

    function saveLastCategory(category) {
        if (!category) {
            return;
        }

        try {
            window.localStorage.setItem(lastCategoryStorageKey, category);
        } catch (error) {
            // Ignorieren, falls localStorage blockiert ist.
        }
    }

    function getDashboardCategory() {
        const activeCategory = getActiveCategory().trim();
        if (activeCategory) {
            return activeCategory;
        }

        return '';
    }

    function ensureCategoryScore(category) {
        if (!scoreByCategory[category]) {
            scoreByCategory[category] = {
                correctCount: 0,
                wrongCount: 0
            };
        }

        return scoreByCategory[category];
    }

    function readCount(element) {
        const value = parseInt(element ? element.textContent || '0' : '0', 10);
        return Number.isNaN(value) ? 0 : value;
    }

    function resetRoundTracking() {
        pendingAnswerCategory = '';
        lastCorrectCount = readCount(correctCountElement);
        lastWrongCount = readCount(wrongCountElement);

        Object.keys(scoreByCategory).forEach(function (category) {
            delete scoreByCategory[category];
        });

        submittedCategories.clear();
    }

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.setAttribute('data-highscore-overlay', 'true');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(15, 23, 42, 0.55)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '1rem';
        overlay.style.zIndex = '1000';

        const panel = document.createElement('div');
        panel.style.width = 'min(100%, 420px)';
        panel.style.background = '#ffffff';
        panel.style.borderRadius = '16px';
        panel.style.padding = '1.25rem';
        panel.style.boxShadow = '0 20px 50px rgba(15, 23, 42, 0.2)';

        const title = document.createElement('h2');
        title.textContent = 'Benutzername';
        title.style.marginBottom = '0.5rem';

        const text = document.createElement('p');
        text.textContent = 'Gib deinen Namen ein, damit Highscores pro Kategorie gespeichert werden können.';
        text.style.marginBottom = '1rem';

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 30;
        input.placeholder = 'Dein Name';
        input.className = 'username-input';
        input.style.width = '100%';
        input.style.padding = '0.8rem';
        input.style.borderRadius = '12px';
        input.style.marginBottom = '0.75rem';

        const error = document.createElement('p');
        error.style.color = '#dc2626';
        error.style.minHeight = '1.25rem';
        error.style.fontSize = '0.95rem';

        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Weiter';
        button.className = 'username-continue-button';
        button.style.padding = '0.8rem 1rem';
        button.style.borderRadius = '12px';
        button.style.cursor = 'pointer';

        panel.appendChild(title);
        panel.appendChild(text);
        panel.appendChild(input);
        panel.appendChild(error);
        panel.appendChild(button);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function confirm() {
            const username = (input.value || '').trim();

            if (username.length < 2) {
                error.textContent = 'Bitte mindestens 2 Zeichen eingeben.';
                input.focus();
                return;
            }

            currentUsername = username;
            saveCookie(usernameCookieName, username, 180);
            overlay.remove();
        }

        button.addEventListener('click', confirm);
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                confirm();
            }
        });

        window.setTimeout(function () {
            input.focus();
        }, 0);
    }

    function initUsername() {
        const savedUsername = readCookie(usernameCookieName).trim();

        if (savedUsername.length >= 2) {
            currentUsername = savedUsername;
            return;
        }

        createOverlay();
    }

    function ensureHighscoreUi() {
        if (highscoreUiInitialized) {
            return;
        }

        injectDashboardPanel();
        highscoreUiInitialized = true;
    }

    function injectDashboardPanel() {
        const quizCard = document.querySelector('.quiz-card');
        const pageShell = document.querySelector('.page-shell');

        if (!quizCard || !pageShell) {
            return;
        }

        pageShell.classList.add('page-shell--with-sidebar');

        const dashboardCard = document.createElement('section');
        dashboardCard.className = 'quiz-card highscore-sidebar';
        dashboardCard.innerHTML = [
            '<div class="section-heading">',
            '<p class="section-heading__kicker">Highscores</p>',
            '<h2>Dashboard</h2>',
            '<p class="section-heading__text">Beste Ergebnisse pro Kategorie.</p>',
            '</div>',
            '<div id="InlineHighscoreDashboard">Lade Highscores...</div>'
        ].join('');

        pageShell.appendChild(dashboardCard);

        const logoutButton = document.createElement('button');
        logoutButton.type = 'button';
        logoutButton.className = 'highscore-logout-button';
        logoutButton.setAttribute('aria-label', 'Benutzer ausloggen');
        logoutButton.title = 'Logout';
        logoutButton.innerHTML = '<iconify-icon icon="mdi:logout" aria-hidden="true"></iconify-icon>';
        dashboardCard.appendChild(logoutButton);

        const connectionNotice = document.createElement('p');
        connectionNotice.className = 'connection-notice connection-notice--sidebar';
        connectionNotice.setAttribute('data-connection-notice', 'true');
        connectionNotice.setAttribute('aria-live', 'polite');
        connectionNotice.textContent = 'Online: Highscore und API-Quiz sind verfügbar.';
        pageShell.appendChild(connectionNotice);

        logoutButton.addEventListener('click', function () {
            deleteCookie(usernameCookieName);
            currentUsername = '';
            pendingAnswerCategory = '';
            submittedCategories.clear();
            resetRoundTracking();
            refreshDashboard();
            initUsername();
        });
    }

    function findRowsForCategory(categories, activeCategory) {
        const availableCategories = categories || {};
        const wanted = (activeCategory || '').toLowerCase();

        if (wanted === '') {
            return {
                title: 'Kategorie auswählen',
                rows: []
            };
        }

        let categoryName;
        for (categoryName in availableCategories) {
            if (categoryName.toLowerCase() === wanted) {
                return {
                    title: categoryName,
                    rows: availableCategories[categoryName] || []
                };
            }
        }

        return {
            title: activeCategory,
            rows: []
        };
    }

    function renderInlineDashboard(categories, activeCategory) {
        const container = document.getElementById('InlineHighscoreDashboard');

        if (!container) {
            return;
        }

        const categoryMatch = findRowsForCategory(categories, activeCategory);
        const normalizedCategory = (activeCategory || '').trim();

        if (!normalizedCategory) {
            container.textContent = 'Wähle eine Kategorie, um die passenden Highscores zu sehen.';
            return;
        }

        if ((categoryMatch.rows || []).length === 0) {
            container.innerHTML = [
                '<section>',
                '<h3 style="margin-bottom:0.5rem;">' + escapeHtml(categoryMatch.title) + '</h3>',
                '<p>Für diese Kategorie gibt es noch keine Highscores.</p>',
                '</section>'
            ].join('');
            return;
        }

        const fragments = [
            '<section>',
            '<h3 style="margin-bottom:0.65rem;">' + escapeHtml(categoryMatch.title) + '</h3>',
            '<div class="highscore-sidebar__rows">'
        ];

        categoryMatch.rows.forEach(function (row, index) {
            fragments.push(
                '<div class="highscore-row">' +
                '<span class="highscore-row__rank">#' + String(index + 1) + '</span>' +
                '<span class="highscore-row__user">' + escapeHtml(row.username) + '</span>' +
                '<span class="highscore-row__meta">' +
                String(row.correct_count) + '/' + String(row.total_count) +
                ' (' + Number(row.accuracy).toFixed(1).replace('.', ',') + '%)' +
                '</span>' +
                '</div>'
            );
        });

        fragments.push('</div>');
        fragments.push('</section>');
        container.innerHTML = fragments.join('');
    }

    async function refreshDashboard() {
        const container = document.getElementById('InlineHighscoreDashboard');

        if (!window.HighscoreApi || !window.HighscoreApi.isHighscoreAvailable()) {
            if (container) {
                container.textContent = 'Highscores sind derzeit nicht verfügbar.';
            }
            return;
        }

        const activeCategory = getDashboardCategory();
        const requestToken = dashboardRequestToken + 1;
        dashboardRequestToken = requestToken;

        if (activeCategory) {
            saveLastCategory(activeCategory);
        }

        try {
            const result = await window.HighscoreApi.loadDashboard(activeCategory);
            if (dashboardRequestToken !== requestToken) {
                return;
            }

            renderInlineDashboard(result.categories || {}, activeCategory);
        } catch (error) {
            if (container) {
                container.textContent = 'Highscores konnten nicht geladen werden.';
            }
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    async function submitCategoryScore(category) {
        if (!window.HighscoreApi || !window.HighscoreApi.isHighscoreAvailable()) {
            return;
        }

        if (!currentUsername || !category || submittedCategories.has(category)) {
            return;
        }

        const categoryScore = ensureCategoryScore(category);
        const totalCount = categoryScore.correctCount + categoryScore.wrongCount;

        if (totalCount <= 0) {
            return;
        }

        submittedCategories.add(category);

        try {
            await window.HighscoreApi.saveScore({
                username: currentUsername,
                category: category,
                correctCount: categoryScore.correctCount,
                wrongCount: categoryScore.wrongCount,
                totalCount: totalCount
            });

            saveLastCategory(category);

            refreshDashboard();
        } catch (error) {
            submittedCategories.delete(category);
        }
    }

    function handleScoreMutation() {
        const currentCorrectCount = readCount(correctCountElement);
        const currentWrongCount = readCount(wrongCountElement);
        const correctDelta = currentCorrectCount - lastCorrectCount;
        const wrongDelta = currentWrongCount - lastWrongCount;

        if (correctDelta === 0 && wrongDelta === 0) {
            return;
        }

        const category = pendingAnswerCategory || getActiveCategory();
        if (category) {
            const categoryScore = ensureCategoryScore(category);
            if (correctDelta > 0) {
                categoryScore.correctCount += correctDelta;
            }
            if (wrongDelta > 0) {
                categoryScore.wrongCount += wrongDelta;
            }
        }

        lastCorrectCount = currentCorrectCount;
        lastWrongCount = currentWrongCount;
        pendingAnswerCategory = '';
    }

    function handleQuestionMutation() {
        const text = questionTextElement ? questionTextElement.textContent || '' : '';
        const activeCategory = getActiveCategory();

        if (!activeCategory) {
            return;
        }

        if (text.indexOf('Diese Kategorie ist abgeschlossen') !== -1 || text.indexOf('Alle Fragen bearbeitet') !== -1) {
            submitCategoryScore(activeCategory);
        }
    }

    function init() {
        if (!window.HighscoreApi) {
            return;
        }

        ensureHighscoreUi();

        if (window.HighscoreApi.isHighscoreAvailable()) {
            initUsername();
        }

        refreshDashboard();
        resetRoundTracking();

        answerButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                if (!button.hidden) {
                    pendingAnswerCategory = getActiveCategory();
                }
            }, true);
        });

        categoryButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                pendingAnswerCategory = '';
                refreshDashboard();
            });
        });

        if (resetButton) {
            resetButton.addEventListener('click', function () {
                resetRoundTracking();
            });
        }

        const scoreObserver = new MutationObserver(handleScoreMutation);
        if (correctCountElement) {
            scoreObserver.observe(correctCountElement, { childList: true, characterData: true, subtree: true });
        }
        if (wrongCountElement) {
            scoreObserver.observe(wrongCountElement, { childList: true, characterData: true, subtree: true });
        }

        if (questionTextElement) {
            const questionObserver = new MutationObserver(handleQuestionMutation);
            questionObserver.observe(questionTextElement, { childList: true, characterData: true, subtree: true });
        }

        window.addEventListener('online', function () {
            if (!currentUsername) {
                initUsername();
            }

            refreshDashboard();
        });

        window.addEventListener('learning-pwa-connection-change', refreshDashboard);
    }

    document.addEventListener('DOMContentLoaded', init);
}());
