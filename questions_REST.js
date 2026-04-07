// ============================================
// API GET (Fragen laden)
// ============================================

function getXhr() {
    // API fuer asynchrone Aufrufe
    if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
    }

    return false;
}

function sendXhrRequest(method, url, payload) {
    return new Promise(function (resolve, reject) {
        const xhr = getXhr();
        const username = 'test@gmail.com';
        const password = 'secret';
        const authHeaderValue = 'Basic ' + btoa(username + ':' + password);

        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) {
                return;
            }

            // Erfolgreiche Antwort
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const text = xhr.responseText || '{}';
                    const data = JSON.parse(text);
                    resolve(data);
                } catch (error) {
                    reject(new Error('API Antwort ist kein gueltiges JSON.'));
                }
                return;
            }

            // Fehlerhafte Antwort
            reject(new Error('API Anfrage fehlgeschlagen: HTTP-Status ' + xhr.status));
        };

        xhr.open(method, url, true);
        xhr.setRequestHeader('Authorization', authHeaderValue);

        if (method === 'POST') {
            xhr.setRequestHeader('Content-Type', 'application/json');
            if (payload === undefined || payload === null) {
                xhr.send(null);
            } else {
                xhr.send(JSON.stringify(payload));
            }
            return;
        }

        xhr.send(null);
    });
}

async function getQuestionsByApiGet() {
    const apiUrl = 'https://vogtserver.de:8888/api/quizzes?pages=0';
    const data = await sendXhrRequest('GET', apiUrl, null);
    return data;
}

// ============================================
// BLUEPRINT: API POST (Beispiel)
// ============================================

async function sendQuestionsRequestByApiPost(categoryName) {
    const apiUrl = '/api/questions';

    const payload = {
        category: categoryName
    };

    const data = await sendXhrRequest('POST', apiUrl, payload);
    return data;
}

// ============================================
// BLUEPRINT: API POST (Antwort pruefen)
// ============================================

async function solveApiQuestionByPost(questionId, selectedAnswerIndex) {
    const apiUrl = 'https://vogtserver.de:8888/api/quizzes/' + questionId + '/solve';

    // API erwartet ein Raw-Array mit 0-basierter Antwortposition.
    const payload = [selectedAnswerIndex];

    const data = await sendXhrRequest('POST', apiUrl, payload);
    return data;
}

function getIsCorrectFromSolveResponse(responseData) {
    if (typeof responseData === 'boolean') {
        return responseData;
    }

    if (typeof responseData === 'string') {
        const value = responseData.toLowerCase();
        if (value === 'true' || value === 'correct' || value === 'richtig') {
            return true;
        }
        if (value === 'false' || value === 'wrong' || value === 'falsch') {
            return false;
        }
    }

    if (responseData && typeof responseData === 'object') {
        if (typeof responseData.success === 'boolean') {
            return responseData.success;
        }
        if (typeof responseData.correct === 'boolean') {
            return responseData.correct;
        }
        if (typeof responseData.isCorrect === 'boolean') {
            return responseData.isCorrect;
        }
        if (typeof responseData.result === 'boolean') {
            return responseData.result;
        }
    }

    return null;
}

// ============================================
// FUNKTION: API-Daten ins Quiz-Format bringen
// ============================================

function normalizeApiQuestionsData(apiData) {
    // Fall 1: API liefert Spring-Page-Format mit "content"
    // Beispiel: { content: [ { title, text, options } ] }
    if (apiData && Array.isArray(apiData.content)) {
        const resultByCategory = {};

        let i;
        for (i = 0; i < apiData.content.length; i++) {
            const item = apiData.content[i] || {};
            const categoryName = item.title || 'api';

            if (!resultByCategory[categoryName]) {
                resultByCategory[categoryName] = [];
            }

            const question = {
                id: item.id,
                q: item.text || '',
                a: Array.isArray(item.options) ? item.options : [],
                // Hinweis: Wenn API keine richtige Antwort liefert,
                // bleibt c leer und es ist nur eine Anzeige-/Navigationsrunde.
                c: Array.isArray(item.c) ? item.c : []
            };

            resultByCategory[categoryName].push(question);
        }

        return resultByCategory;
    }

    // Fall 2: API liefert schon das gewuenschte Objekt-Format
    // Beispiel: { "berlin": [ { q, a, c } ] }
    if (apiData && !Array.isArray(apiData)) {
        return apiData;
    }

    // Fall 3: API liefert eine einfache Liste
    // Beispiel: [ { q, a, c } ] -> wir legen alles in eine Kategorie "api"
    const result = {};
    result.api = [];

    if (Array.isArray(apiData)) {
        let i;
        for (i = 0; i < apiData.length; i++) {
            result.api.push(apiData[i]);
        }
    }

    return result;
}

// ============================================
// FUNKTION: Fragen von API laden und anzeigen
// ============================================

async function loadQuestionsFromApiAndStartQuiz() {
    questionText.textContent = 'Lade Fragen von API...';

    try {
        const apiData = await getQuestionsByApiGet();
        const normalizedData = normalizeApiQuestionsData(apiData);

        // API-Fragen in bestehende lokale Kategorien integrieren,
        // damit z.B. Berlin/Hamburg weiter funktionieren.
        const mergedQuestions = {};
        let category;

        for (category in questionsByCategory) {
            mergedQuestions[category] = questionsByCategory[category];
        }

        for (category in normalizedData) {
            mergedQuestions[category] = normalizedData[category];
        }

        questionsByCategory = mergedQuestions;

        let firstApiCategory = '';
        for (category in normalizedData) {
            firstApiCategory = category;
            break;
        }

        resetQuizProgress(firstApiCategory);
    } catch (error) {
        questionText.textContent = 'Fehler beim Laden von API-Fragen: ' + error.message;
    }
}

// ============================================
// EVENT-LISTENER: API-Laden-Button
// ============================================

if (loadApiQuestionsButton) {
    loadApiQuestionsButton.addEventListener('click', function () {
        loadQuestionsFromApiAndStartQuiz();
    });
}