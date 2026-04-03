let questionsByCategory = {};
let currentCategory = '';
let currentQuestion = null;
let currentQuestionIndex = -1;
let currentAnswerOptionIndexes = [];
let correctCount = 0;
let wrongCount = 0;
let remainingQuestionIndexesByCategory = {};

const questionText = document.getElementById('Frage');
const scoreText = document.getElementById('Score');
const categoryButtons = Array.from(document.querySelectorAll('[data-category]'));
const answerButtons = [
    document.getElementById('Antwort1'),
    document.getElementById('Antwort2'),
    document.getElementById('Antwort3'),
    document.getElementById('Antwort4')
];

function updateScoreDisplay() {
    if (!scoreText) {
        return;
    }

    scoreText.textContent = `Richtig: ${correctCount} | Falsch: ${wrongCount}`;
}

function renderQuestion(question) {
    currentQuestion = question;
    questionText.textContent = question.q;

    const answerOptions = Array.isArray(question.a)
        ? question.a.map(function (text, originalIndex) {
            return { text, originalIndex };
        }).filter(function (option) {
            return Boolean(option.text);
        })
        : [];

    currentAnswerOptionIndexes = shuffleIndexes(answerOptions.map(function (option) {
        return option.originalIndex;
    }));

    answerButtons.forEach(function (button, index) {
        const originalAnswerIndex = currentAnswerOptionIndexes[index];
        const optionText = question.a && question.a[originalAnswerIndex];

        if (originalAnswerIndex !== undefined && optionText) {
            button.textContent = optionText;
            button.hidden = false;
        } else {
            button.textContent = '';
            button.hidden = true;
        }
    });
}

function getQuestionsForCategory(category) {
    return questionsByCategory[category] || [];
}

function shuffleIndexes(indexes) {
    const shuffled = indexes.slice();

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }

    return shuffled;
}

function hideAnswerButtons() {
    currentAnswerOptionIndexes = [];

    answerButtons.forEach(function (button) {
        button.textContent = '';
        button.hidden = true;
    });
}

function showFinalScore() {
    currentQuestion = null;
    currentQuestionIndex = -1;
    questionText.textContent = `Alle Fragen bearbeitet. Finaler Score: Richtig ${correctCount}, Falsch ${wrongCount}.`;
    hideAnswerButtons();
}

function areAllQuestionsProcessed() {
    return Object.keys(questionsByCategory).every(function (category) {
        const questions = getQuestionsForCategory(category);

        if (!questions.length) {
            return true;
        }

        const remainingIndexes = remainingQuestionIndexesByCategory[category] || [];
        return remainingIndexes.length === 0;
    });
}

function showCategoryCompleted() {
    currentQuestion = null;
    currentQuestionIndex = -1;
    questionText.textContent = 'Diese Kategorie ist abgeschlossen. Waehle eine andere Kategorie.';
    hideAnswerButtons();
}

function showNextQuestion(category) {
    const questions = getQuestionsForCategory(category);

    if (!questions.length) {
        currentQuestion = null;
        currentQuestionIndex = -1;
        questionText.textContent = 'Keine Fragen für diese Kategorie gefunden.';
        hideAnswerButtons();
        return;
    }

    const remainingIndexes = remainingQuestionIndexesByCategory[category];

    if (!remainingIndexes || !remainingIndexes.length) {
        if (areAllQuestionsProcessed()) {
            showFinalScore();
        } else {
            showCategoryCompleted();
        }

        return;
    }

    const nextQuestionIndex = remainingIndexes[remainingIndexes.length - 1];
    currentQuestionIndex = nextQuestionIndex;
    renderQuestion(questions[nextQuestionIndex]);
}

function setActiveCategory(category) {
    currentCategory = category;

    categoryButtons.forEach(function (button) {
        const isActive = button.dataset.category === category;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });

    showNextQuestion(category);
}

function handleAnswerClick(answerIndex) {
    if (!currentQuestion || !Array.isArray(currentQuestion.c)) {
        return;
    }

    const selectedAnswerIndex = currentAnswerOptionIndexes[answerIndex];

    if (selectedAnswerIndex === undefined) {
        return;
    }

    const remainingIndexes = remainingQuestionIndexesByCategory[currentCategory];

    if (Array.isArray(remainingIndexes) && currentQuestionIndex >= 0) {
        remainingQuestionIndexesByCategory[currentCategory] = remainingIndexes.filter(function (index) {
            return index !== currentQuestionIndex;
        });
    }

    const isCorrect = currentQuestion.c.includes(selectedAnswerIndex);

    if (isCorrect) {
        correctCount += 1;
    } else {
        wrongCount += 1;
    }

    updateScoreDisplay();
    showNextQuestion(currentCategory);
}

async function loadQuestions() {
    questionText.textContent = 'Lade Daten...';

    try {
        const response = await fetch('questions.json');

        if (!response.ok) {
            throw new Error(`HTTP-Status ${response.status}`);
        }

        questionsByCategory = await response.json();
        remainingQuestionIndexesByCategory = Object.keys(questionsByCategory).reduce(function (accumulator, category) {
            const questions = getQuestionsForCategory(category);
            const indexes = questions.map(function (_question, index) {
                return index;
            });

            accumulator[category] = shuffleIndexes(indexes);
            return accumulator;
        }, {});

        updateScoreDisplay();

        if (categoryButtons.length) {
            setActiveCategory(categoryButtons[0].dataset.category);
        } else {
            questionText.textContent = 'Keine Kategorien gefunden.';
        }
    } catch (error) {
        questionText.textContent = `Fehler beim Laden der Fragen: ${error.message}`;
    }
}

categoryButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        setActiveCategory(button.dataset.category);
    });
});

answerButtons.forEach(function (button, index) {
    button.addEventListener('click', function () {
        if (button.hidden) {
            return;
        }

        handleAnswerClick(index);
    });
});

document.addEventListener('DOMContentLoaded', loadQuestions);
