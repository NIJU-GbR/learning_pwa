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

// ============================================
// HTML-ELEMENTE (aus dem DOM laden)
// ============================================

const questionText = document.getElementById('Frage');
const correctCountElement = document.getElementById('CorrectCount');
const wrongCountElement = document.getElementById('WrongCount');
const correctBarElement = document.getElementById('CorrectBar');
const wrongBarElement = document.getElementById('WrongBar');
const loadApiQuestionsButton = document.getElementById('LoadApiQuestionsButton');
const resetQuizButton = document.getElementById('ResetQuizButton');
const categoryButtons = Array.from(document.querySelectorAll('[data-category]'));
const answerButtons = [
    document.getElementById('Antwort1'),
    document.getElementById('Antwort2'),
    document.getElementById('Antwort3'),
    document.getElementById('Antwort4')
];

// ============================================
// Punktestand anzeigen (mit Balken)
// ============================================

function updateScoreDisplay() {

    // Aktualisiere die Zahlenwerte
    correctCountElement.textContent = correctCount;
    wrongCountElement.textContent = wrongCount;

    // Berechne die Gesamtzahl der beantworteten Fragen
    const totalAnswered = correctCount + wrongCount;

    // Berechne die Breite für jeden Balken (in Prozent)
    let correctPercentage = 0;
    let wrongPercentage = 0;

    if (totalAnswered > 0) {
        correctPercentage = (correctCount / totalAnswered) * 100;
        wrongPercentage = (wrongCount / totalAnswered) * 100;
    }

    // Aktualisiere die Balken-Breiten
    correctBarElement.style.width = correctPercentage + '%';
    wrongBarElement.style.width = wrongPercentage + '%';
}


// ============================================
// FUNKTION: Antworten mischen
// ============================================

function shuffleArray(array) {
    // Kopie der original Liste machen (nicht verändern!)
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
// FUNKTION: Frage anzeigen
// ============================================

function renderQuestion(question) {
    // Speichere die aktuelle Frage
    currentQuestion = question;

    // Zeige die Frage oben an
    questionText.textContent = question.q;

    // Schritt 1: Liste mit Antwort-Indizes vorbereiten
    let answerIndexes = [];
    let i;
    for (i = 0; i < question.a.length; i++) {
        // Nur Antworten hinzufügen, die nicht leer sind
        if (question.a[i]) {
            answerIndexes.push(i);
        }
    }

    // Schritt 2: Diese Indizes durcheinander würfeln
    currentAnswerOptionIndexes = shuffleArray(answerIndexes);

    // Schritt 3: Jetzt die Buttons mit den gemischten Antworten füllen
    for (i = 0; i < answerButtons.length; i++) {
        const button = answerButtons[i];
        
        // Welcher Original-Index gehört zu dieser Button-Position?
        const originalIndex = currentAnswerOptionIndexes[i];

        // Existiert ein Text für diesen Index?
        if (originalIndex !== undefined && question.a[originalIndex]) {
            button.textContent = question.a[originalIndex];
            button.hidden = false;
        } else {
            // Keine Antwort? Button verstecken.
            button.textContent = '';
            button.hidden = true;
        }
    }
}


// ============================================
// FUNKTION: Antwortbuttons verstecken
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
}

// ============================================
// FUNKTION: Überprüfe, ob alle Fragen fertig sind
// ============================================

function areAllQuestionsCompleted() {
    // Gehe durch alle Kategorien
    let category;
    for (category in questionsByCategory) {
        // Prüfe: Hat diese Kategorie überhaupt Fragen?
        if (questionsByCategory[category].length > 0) {
            // Prüfe: Gibt es noch unbeantwortete Fragen?
            const remaining = remainingQuestionsPerCategory[category];
            if (remaining && remaining.length > 0) {
                // Es gibt noch Fragen! Also nicht fertig.
                return false;
            }
        }
    }

    // Alle Kategorien sind fertig
    return true;
}

// ============================================
// FUNKTION: Kategorie ist fertig (aber nicht alle)
// ============================================

function showCategoryCompleted() {
    // Aufräumen
    currentQuestion = null;
    currentQuestionIndex = -1;

    // Zeige Nachricht
    questionText.textContent = 'Diese Kategorie ist abgeschlossen. Waehle eine andere Kategorie.';

    // Buttons verstecken
    hideAnswerButtons();
}


// ============================================
// FUNKTION: Nächste Frage anzeigen
// ============================================

function showNextQuestion(category) {
    // Hole alle Fragen dieser Kategorie
    const allQuestions = questionsByCategory[category];

    // Sicherheit: Existiert die Kategorie?
    if (!allQuestions || allQuestions.length === 0) {
        // Keine Fragen gefunden
        currentQuestion = null;
        currentQuestionIndex = -1;
        questionText.textContent = 'Keine Fragen für diese Kategorie gefunden.';
        hideAnswerButtons();
        return;
    }

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
// FUNKTION: Kategorie wechseln
// ============================================

function setActiveCategory(category) {
    // Merke die ausgewählte Kategorie
    currentCategory = category;

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
// FUNKTION: Antwort prüfen (wenn Button geklickt)
// ============================================

async function handleAnswerClick(buttonIndex) {
    if (answerCheckInProgress) {
        return;
    }

    // Sicherheit: Existiert eine aktuelle Frage?
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
    }
}

// ============================================
// FUNKTION: Alle Fragen laden
// ============================================

async function loadQuestions() {
    // Zeige "Lade..."-Nachricht
    questionText.textContent = 'Lade Daten...';

    try {
        // Hole die Fragen-Datei
        const response = await fetch('questions.json');

        // War die Anfrage erfolgreich?
        if (!response.ok) {
            throw new Error('HTTP-Status ' + response.status);
        }

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

        // Schritt 2: Zeige die erste verfuegbare Kategorie
        const firstCategory = getFirstAvailableCategory();
        if (firstCategory) {
            setActiveCategory(firstCategory);
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
        resetQuizProgress('');
    });
}


// ============================================
// START: Wenn die Seite geladen wurde
// ============================================

document.addEventListener('DOMContentLoaded', loadQuestions);
