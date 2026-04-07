// ============================================
// GLOBALE VARIABLEN
// ============================================

let questionsByCategory = {};              // Alle Fragen, sortiert nach Kategorie
let currentCategory = '';                  // Aktuelle Kategorie (z.B. "berlin")
let currentQuestion = null;                // Die aktuelle Frage, die der Nutzer sieht
let currentQuestionIndex = -1;             // Position der aktuellen Frage in der Liste
let currentAnswerOptionIndexes = [];       // Gemischte Reihenfolge der Antworten
let correctCount = 0;                      // Wie viele Fragen richtig beantwortet wurden
let wrongCount = 0;                        // Wie viele Fragen falsch beantwortet wurden
let remainingQuestionsPerCategory = {};    // Noch zu beantwortende Fragen pro Kategorie
let answerCheckInProgress = false;         // Verhindert Mehrfachklick waehrend API-Pruefung

// Exponiert die laufende Kategorie fuer andere Skripte (z.B. Highscore-Client).
window.currentCategory = '';

// ============================================
// HTML-ELEMENTE (aus dem DOM laden)
// ============================================

const questionText = document.getElementById('Frage');
const correctCountElement = document.getElementById('CorrectCount');
const wrongCountElement = document.getElementById('WrongCount');
const scoreBarElement = document.querySelector('.score-bar');
const loadApiQuestionsButton = document.getElementById('LoadApiQuestionsButton');
const resetQuizButton = document.getElementById('ResetQuizButton');
const categoryButtons = Array.from(document.querySelectorAll('[data-category]'));
const answerButtons = [
    document.getElementById('Antwort1'),
    document.getElementById('Antwort2'),
    document.getElementById('Antwort3'),
    document.getElementById('Antwort4')
];
const bundeslaenderMapPanel = document.getElementById('BundeslaenderMapPanel');
const bundeslaenderMapElement = document.getElementById('BundeslaenderMap');
const bundeslaenderMapFeedback = document.getElementById('BundeslaenderMapFeedback');

let bundeslaenderGeoJsonData = null;
let bundeslaenderMap = null;
let bundeslaenderLayer = null;

const bundeslaenderMapStyle = {
    color: '#b7791f',
    weight: 1,
    fillColor: '#d4a017',
    fillOpacity: 0.24
};

// ============================================
// Punktestand anzeigen (mit Balken)
// ============================================

function updateScoreDisplay() {
    // Sicherheit: Existieren die Anzeigeelemente?
    if (!correctCountElement || !wrongCountElement || !scoreBarElement) {
        return;
    }

    // Aktualisiere die Zahlenwerte
    correctCountElement.textContent = correctCount;
    wrongCountElement.textContent = wrongCount;

    // Berechne die Gesamtzahl der beantworteten Fragen
    const totalAnswered = correctCount + wrongCount;

    // Berechne die Breite für jeden Anteil (in Prozent)
    let correctPercentage = 0;
    let blendStart = 0;
    let blendEnd = 0;

    if (totalAnswered > 0) {
        correctPercentage = (correctCount / totalAnswered) * 100;
        blendStart = Math.max(0, correctPercentage - 4);
        blendEnd = Math.min(100, correctPercentage + 4);

        // Ein Balken mit weichem Farbübergang zwischen grün und rot.
        scoreBarElement.style.background = 'linear-gradient(90deg, '
            + '#15803d 0%, '
            + '#22c55e ' + Math.max(0, blendStart - 10) + '%, '
            + '#86efac ' + blendStart + '%, '
            + '#fca5a5 ' + blendEnd + '%, '
            + '#ef4444 ' + Math.min(100, blendEnd + 10) + '%, '
            + '#b91c1c 100%)';
        return;
    }

    scoreBarElement.style.background = '';
}


// ============================================
// Antworten mischen
// ============================================

function shuffleArray(array) {
    // Kopie der original Liste machen
    const result = [];
    let i;
    for (i = 0; i < array.length; i++) {
        result[i] = array[i];
    }

    // Fisher-Yates Shuffle: gehe von hinten durch und schappe Elemente
    let j;
    for (i = result.length - 1; i > 0; i--) {
        // Zufallsposition wählen
        j = Math.floor(Math.random() * (i + 1));

        // Elemente tauschen
        const temp = result[i];
        result[i] = result[j];
        result[j] = temp;
    }

    return result;
}

// ============================================
// Frage anzeigen
// ============================================

function renderQuestion(question) {
    // Speichere die aktuelle Frage
    currentQuestion = question;

    if (isBundeslaenderMapQuestion(question)) {
        renderBundeslaenderMapQuestion(question);
        return;
    }

    hideBundeslaenderMapQuestion();

    // Zeige die Frage oben an
    questionText.textContent = question.q;

    // Schritt 1: Liste mit Antwort-Indizes vorbereiten
    let answerIndexes = [];
    let i;
    for (i = 0; i < question.a.length; i++) {
        answerIndexes.push(i);
    }

    // Schritt 2: Diese Indizes durcheinander würfeln
    currentAnswerOptionIndexes = shuffleArray(answerIndexes);

    // Schritt 3: Buttons mit den gemischten Antworten füllen
    for (i = 0; i < answerButtons.length; i++) {
        const button = answerButtons[i];

        // Welcher Original-Index gehört zu dieser Button-Position?
        const originalIndex = currentAnswerOptionIndexes[i];
        button.textContent = question.a[originalIndex];
        button.hidden = false;
    }
}

function isBundeslaenderMapQuestion(question) {
    return !!(question && question.type === 'map-click');
}

function normalizeStateName(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

async function ensureBundeslaenderGeoJsonLoaded() {
    if (bundeslaenderGeoJsonData) {
        return bundeslaenderGeoJsonData;
    }

    const response = await fetch('data/bundeslaender.geojson');
    if (!response.ok) {
        throw new Error('Bundeslaender-Karte konnte nicht geladen werden.');
    }

    bundeslaenderGeoJsonData = await response.json();
    return bundeslaenderGeoJsonData;
}

function resetBundeslaenderStyles() {
    if (!bundeslaenderLayer) {
        return;
    }

    bundeslaenderLayer.eachLayer(function (layer) {
        layer.setStyle(bundeslaenderMapStyle);
    });
}

function hideBundeslaenderMapQuestion() {
    if (bundeslaenderMapPanel) {
        bundeslaenderMapPanel.hidden = true;
    }

    if (bundeslaenderMapFeedback) {
        bundeslaenderMapFeedback.textContent = '';
    }
}

function evaluateBundeslandSelection(clickedName, layer) {
    if (answerCheckInProgress || !currentQuestion || !isBundeslaenderMapQuestion(currentQuestion)) {
        return;
    }

    answerCheckInProgress = true;

    const clicked = normalizeStateName(clickedName);
    const expected = normalizeStateName(currentQuestion.targetName);
    const isCorrect = clicked === expected;

    if (isCorrect) {
        correctCount += 1;
    } else {
        wrongCount += 1;
    }

    updateScoreDisplay();

    if (layer) {
        layer.setStyle({
            fillColor: isCorrect ? '#22c55e' : '#ef4444',
            fillOpacity: 0.85
        });
    }

    if (bundeslaenderMapFeedback) {
        if (isCorrect) {
            bundeslaenderMapFeedback.textContent = 'Richtig: ' + clickedName;
        } else {
            bundeslaenderMapFeedback.textContent = 'Falsch';
        }
    }

    window.setTimeout(function () {
        removeCurrentQuestionFromRemaining();
        showNextQuestion(currentCategory);
        answerCheckInProgress = false;
    }, 550);
}

async function renderBundeslaenderMapQuestion(question) {
    hideAnswerButtons();

    questionText.textContent = question.q;

    if (!bundeslaenderMapPanel || !bundeslaenderMapElement) {
        questionText.textContent = 'Die Kartenansicht ist nicht verfügbar.';
        return;
    }

    if (!window.L || typeof window.L.map !== 'function') {
        questionText.textContent = 'Kartenbibliothek konnte nicht geladen werden.';
        return;
    }

    try {
        const geoJson = await ensureBundeslaenderGeoJsonLoaded();

        bundeslaenderMapPanel.hidden = false;
        if (bundeslaenderMapFeedback) {
            bundeslaenderMapFeedback.textContent = 'Klicke auf: ' + (question.targetName || 'ein Bundesland');
        }

        if (!bundeslaenderMap) {
            bundeslaenderMap = L.map(bundeslaenderMapElement, {
                attributionControl: false,
                zoomControl: true,
                scrollWheelZoom: false,
                dragging: true
            });
        }

        if (bundeslaenderLayer) {
            bundeslaenderMap.removeLayer(bundeslaenderLayer);
        }

        bundeslaenderLayer = L.geoJSON(geoJson, {
            style: bundeslaenderMapStyle,
            onEachFeature: function (feature, layer) {
                layer.on('mouseover', function () {
                    layer.setStyle({ fillOpacity: 0.34 });
                });

                layer.on('mouseout', function () {
                    resetBundeslaenderStyles();
                });

                layer.on('click', function () {
                    const props = feature && feature.properties ? feature.properties : {};
                    const clickedName = props.name || '';
                    evaluateBundeslandSelection(clickedName, layer);
                });
            }
        }).addTo(bundeslaenderMap);

        bundeslaenderMap.fitBounds(bundeslaenderLayer.getBounds(), {
            padding: [10, 10]
        });

        window.setTimeout(function () {
            bundeslaenderMap.invalidateSize();
        }, 0);
    } catch (error) {
        questionText.textContent = 'Fehler beim Laden der Karte: ' + error.message;
        hideBundeslaenderMapQuestion();
    }
}


// ============================================
// Antwortbuttons verstecken
// ============================================

function hideAnswerButtons() {
    // Alle Buttons zurücksetzen
    currentAnswerOptionIndexes = [];

    let i;
    for (i = 0; i < answerButtons.length; i++) {
        answerButtons[i].textContent = '';
        answerButtons[i].hidden = true;
    }
}

// ============================================
// FUNKTION: Finale Punktzahl anzeigen
// ============================================

function showFinalScore() {
    // Aufräumen
    currentQuestion = null;
    currentQuestionIndex = -1;

    // Zeige finale Nachricht
    questionText.textContent = 'Alle Fragen bearbeitet. Finaler Score: Richtig ' + correctCount + ', Falsch ' + wrongCount + '.';

    // Buttons verstecken
    hideAnswerButtons();
    hideBundeslaenderMapQuestion();
}

// ============================================
// FUNKTION: Überprüfe, ob alle Fragen fertig sind
// ============================================

function areAllQuestionsCompleted() {
    // Gehe durch alle Kategorien
    let category;
    for (category in questionsByCategory) {
        // Prüfe: Gibt es noch unbeantwortete Fragen?
        const remaining = remainingQuestionsPerCategory[category];
        if (remaining && remaining.length > 0) {
            // Es gibt noch Fragen! Also nicht fertig.
            return false;
        }
    }

    // Alle Kategorien sind fertig
    return true;
}

// ============================================
// Kategorie ist fertig (aber nicht alle)
// ============================================

function showCategoryCompleted() {
    // Aufräumen
    currentQuestion = null;
    currentQuestionIndex = -1;

    // Zeige Nachricht
    questionText.textContent = 'Diese Kategorie ist abgeschlossen. Wähle eine andere Kategorie.';

    // Buttons verstecken
    hideAnswerButtons();
    hideBundeslaenderMapQuestion();
}


// ============================================
// FUNKTION: Nächste Frage anzeigen
// ============================================

function showNextQuestion(category) {
    // Hole alle Fragen dieser Kategorie
    const allQuestions = questionsByCategory[category];

    // Hole die noch zu beantwortenden Fragen
    const remaining = remainingQuestionsPerCategory[category];

    // Sicherheit: Existiert die Liste der verbleibenden Fragen?
    if (!remaining || remaining.length === 0) {
        // Alle Fragen dieser Kategorie sind beantwortet!

        // Prüfe: Sind die Fragen aller Kategorien beantwortet?
        if (areAllQuestionsCompleted()) {
            showFinalScore();
        } else {
            showCategoryCompleted();
        }
        return;
    }

    // Hole die nächste Frage (die letzte in der Liste)
    const nextQuestionIndex = remaining[remaining.length - 1];

    // Merke diese Fragen-Position
    currentQuestionIndex = nextQuestionIndex;

    // Zeige die Frage an
    const nextQuestion = allQuestions[nextQuestionIndex];
    renderQuestion(nextQuestion);
}


// ============================================
// Kategorie wechseln
// ============================================

function setActiveCategory(category) {
    const previousCategory = currentCategory;

    if (previousCategory && previousCategory !== category) {
        // Beim Kategorienwechsel beginnt der Fortschritt wieder bei 0.
        correctCount = 0;
        wrongCount = 0;
        updateScoreDisplay();
    }
    // Merke die ausgewählte Kategorie
    currentCategory = category;
    window.currentCategory = category;

    // Markiere den aktiven Button
    let i;
    for (i = 0; i < categoryButtons.length; i++) {
        const button = categoryButtons[i];
        const isActive = button.dataset.category === category;

        if (isActive) {
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');
        } else {
            button.classList.remove('active');
            button.setAttribute('aria-pressed', 'false');
        }
    }

    // Zeige die nächste Frage aus dieser Kategorie
    showNextQuestion(category);
}

function removeCurrentQuestionFromRemaining() {
    const remaining = remainingQuestionsPerCategory[currentCategory];

    if (remaining && currentQuestionIndex >= 0) {
        const newRemaining = [];
        let i;
        for (i = 0; i < remaining.length; i++) {
            if (remaining[i] !== currentQuestionIndex) {
                newRemaining.push(remaining[i]);
            }
        }
        remainingQuestionsPerCategory[currentCategory] = newRemaining;
    }
}


// ============================================
// Antwort prüfen (wenn Button geklickt)
// ============================================

async function handleAnswerClick(buttonIndex) {
    if (answerCheckInProgress) {
        return;
    }

    // Existiert eine aktuelle Frage?
    if (!currentQuestion) {
        return;
    }

    // Welcher ursprüngliche Antwort-Index wurde geklickt?
    const selectedAnswerIndex = currentAnswerOptionIndexes[buttonIndex];

    // Sicherheit: Ist dieser Index gültig?
    if (selectedAnswerIndex === undefined) {
        return;
    }

    answerCheckInProgress = true;

    let wasEvaluated = false;

    // Schritt 2: Optional lokal bewerten, nur wenn korrekte Antwortdaten vorhanden sind
    if (currentQuestion.c && currentQuestion.c.length > 0) {
        let isCorrect = false;
        let i;
        for (i = 0; i < currentQuestion.c.length; i++) {
            if (currentQuestion.c[i] === selectedAnswerIndex) {
                isCorrect = true;
                break;
            }
        }

        // Schritt 3: Zähler erhöhen
        if (isCorrect) {
            correctCount += 1;
        } else {
            wrongCount += 1;
        }

        // Schritt 4: Punktestand aktualisieren
        updateScoreDisplay();
        wasEvaluated = true;
    } else if (currentQuestion.id !== undefined && currentQuestion.id !== null) {
        // Schritt 2b: API-basiert bewerten ueber /solve, wenn Frage-ID vorhanden ist
        try {
            const solveResponse = await solveApiQuestionByPost(currentQuestion.id, selectedAnswerIndex);
            const isCorrectFromApi = getIsCorrectFromSolveResponse(solveResponse);

            if (isCorrectFromApi === true) {
                correctCount += 1;
                updateScoreDisplay();
                wasEvaluated = true;
            } else if (isCorrectFromApi === false) {
                wrongCount += 1;
                updateScoreDisplay();
                wasEvaluated = true;
            } else {
                if (solveResponse && solveResponse.feedback) {
                    questionText.textContent = solveResponse.feedback;
                } else {
                    questionText.textContent = 'Antwort konnte nicht ausgewertet werden (unerwartete API-Antwort).';
                }
            }
        } catch (error) {
            questionText.textContent = 'Fehler beim Pruefen der Antwort: ' + error.message;
        }
    } else {
        // Kein Bewertungsweg vorhanden: nur durch die Fragen navigieren.
        wasEvaluated = true;
    }

    // Schritt 5: Nur bei erfolgreichem Durchlauf fortfahren
    if (wasEvaluated) {
        removeCurrentQuestionFromRemaining();
        showNextQuestion(currentCategory);
    }

    answerCheckInProgress = false;
}


// ============================================
// FUNKTION: Fragen zur Anzeige initialisieren
// ============================================

function createShuffledQuestionList(category) {
    // Hole alle Fragen dieser Kategorie
    const questions = questionsByCategory[category];

    if (!questions) {
        return [];
    }

    // Erstelle Liste mit den Indizes (0, 1, 2, 3, ...)
    const indexes = [];
    let i;
    for (i = 0; i < questions.length; i++) {
        indexes.push(i);
    }

    // Mische die Liste durcheinander
    const shuffled = shuffleArray(indexes);

    return shuffled;
}

// ============================================
// FUNKTION: Erste verfuegbare Kategorie finden
// ============================================

function getFirstAvailableCategory() {
    // 1) Bevorzugt: erster Kategorie-Button, der auch Daten hat
    let i;
    for (i = 0; i < categoryButtons.length; i++) {
        const buttonCategory = categoryButtons[i].dataset.category;
        if (questionsByCategory[buttonCategory] && questionsByCategory[buttonCategory].length > 0) {
            return buttonCategory;
        }
    }

    // 2) Fallback: erste Kategorie aus den API/JSON-Daten
    let category;
    for (category in questionsByCategory) {
        if (questionsByCategory[category] && questionsByCategory[category].length > 0) {
            return category;
        }
    }

    return '';
}


// ============================================
// FUNKTION: Quiz zurücksetzen und neu starten
// ============================================

function resetQuizProgress(preferredCategory) {
    // Zähler zurücksetzen
    correctCount = 0;
    wrongCount = 0;

    // Aktuelle Frage zurücksetzen
    currentQuestion = null;
    currentQuestionIndex = -1;
    currentAnswerOptionIndexes = [];

    // Für jede Kategorie neue gemischte Fragenliste anlegen
    remainingQuestionsPerCategory = {};
    let category;
    for (category in questionsByCategory) {
        const shuffled = createShuffledQuestionList(category);
        remainingQuestionsPerCategory[category] = shuffled;
    }

    // Anzeige aktualisieren und Quiz neu starten
    updateScoreDisplay();

    const firstCategory = preferredCategory || getFirstAvailableCategory();

    if (firstCategory) {
        setActiveCategory(firstCategory);
    } else {
        questionText.textContent = 'Keine Kategorien gefunden.';
        hideAnswerButtons();
        hideBundeslaenderMapQuestion();
    }
}

// ============================================
// FUNKTION: Alle Fragen laden
// ============================================

async function loadQuestions() {
    const inlineQuestions = window.learningPwaQuestions;

    if (inlineQuestions && typeof inlineQuestions === 'object') {
        questionsByCategory = inlineQuestions;

        // Schritt 1: Für jede Kategorie die Fragen durcheinander mischen
        let inlineCategory;
        for (inlineCategory in questionsByCategory) {
            const inlineShuffled = createShuffledQuestionList(inlineCategory);
            remainingQuestionsPerCategory[inlineCategory] = inlineShuffled;
        }

        // Aktualisiere die Anzeige
        updateScoreDisplay();

        // Beim ersten Laden keine Kategorie automatisch auswaehlen.
        currentCategory = '';
        window.currentCategory = '';
        currentQuestion = null;
        currentQuestionIndex = -1;

        let inlineButtonIndex;
        for (inlineButtonIndex = 0; inlineButtonIndex < categoryButtons.length; inlineButtonIndex++) {
            categoryButtons[inlineButtonIndex].classList.remove('active');
            categoryButtons[inlineButtonIndex].setAttribute('aria-pressed', 'false');
        }

        hideAnswerButtons();

        if (getFirstAvailableCategory()) {
            questionText.textContent = 'Wähle eine Kategorie, um dein Quiz zu starten.';
        } else {
            questionText.textContent = 'Keine Kategorien gefunden.';
        }

        return;
    }

    try {
        // Hole die Fragen-Datei
        const response = await fetch('questions.json');

        // Wandle die Datei in Daten um
        questionsByCategory = await response.json();

        // Schritt 1: Für jede Kategorie die Fragen durcheinander mischen
        let category;
        for (category in questionsByCategory) {
            const shuffled = createShuffledQuestionList(category);
            remainingQuestionsPerCategory[category] = shuffled;
        }

        // Aktualisiere die Anzeige
        updateScoreDisplay();

        // Beim ersten Laden keine Kategorie automatisch auswaehlen.
        currentCategory = '';
        window.currentCategory = '';
        currentQuestion = null;
        currentQuestionIndex = -1;

        let i;
        for (i = 0; i < categoryButtons.length; i++) {
            categoryButtons[i].classList.remove('active');
            categoryButtons[i].setAttribute('aria-pressed', 'false');
        }

        hideAnswerButtons();
        hideBundeslaenderMapQuestion();

        if (getFirstAvailableCategory()) {
            questionText.textContent = 'Wähle eine Kategorie, um dein Quiz zu starten.';
        } else {
            questionText.textContent = 'Keine Kategorien gefunden.';
        }

    } catch (error) {
        // Fehler? Zeige Fehlermeldung
        questionText.textContent = 'Fehler beim Laden der Fragen: ' + error.message;
    }
}


// ============================================
// EVENT-LISTENER: Kategorie-Buttons
// ============================================

let i;
for (i = 0; i < categoryButtons.length; i++) {
    const button = categoryButtons[i];

    button.addEventListener('click', function () {
        const category = this.dataset.category;
        setActiveCategory(category);
    });
}

// ============================================
// EVENT-LISTENER: Antwort-Buttons
// ============================================

for (i = 0; i < answerButtons.length; i++) {
    const answerButton = answerButtons[i];
    const buttonIndex = i;

    answerButton.addEventListener('click', function () {
        // Sicherheit: Button muss sichtbar sein
        if (this.hidden) {
            return;
        }

        handleAnswerClick(buttonIndex);
    });
}

// ============================================
// EVENT-LISTENER: Reset-Button
// ============================================

if (resetQuizButton) {
    resetQuizButton.addEventListener('click', function () {
        resetQuizProgress(currentCategory);
    });
}


// ============================================
// START: Wenn die Seite geladen wurde
// ============================================

document.addEventListener('DOMContentLoaded', loadQuestions);
