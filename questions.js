let questionsByCategory = {};
let currentCategory = '';

const questionText = document.getElementById('Frage');
const categoryButtons = Array.from(document.querySelectorAll('[data-category]'));
const answerButtons = [
    document.getElementById('Antwort1'),
    document.getElementById('Antwort2'),
    document.getElementById('Antwort3'),
    document.getElementById('Antwort4')
];

function renderQuestion(question) {
    questionText.textContent = question.a;

    answerButtons.forEach(function (button, index) {
        const optionText = question.l && question.l[index];

        if (optionText) {
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

function showRandomQuestion(category) {
    const questions = getQuestionsForCategory(category);

    if (!questions.length) {
        questionText.textContent = 'Keine Fragen für diese Kategorie gefunden.';
        answerButtons.forEach(function (button) {
            button.textContent = '';
            button.hidden = true;
        });
        return;
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    renderQuestion(questions[randomIndex]);
}

function setActiveCategory(category) {
    currentCategory = category;

    categoryButtons.forEach(function (button) {
        const isActive = button.dataset.category === category;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });

    showRandomQuestion(category);
}

async function loadQuestions() {
    questionText.textContent = 'Lade Daten...';

    try {
        const response = await fetch('questions.json');

        if (!response.ok) {
            throw new Error(`HTTP-Status ${response.status}`);
        }

        questionsByCategory = await response.json();

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

document.addEventListener('DOMContentLoaded', loadQuestions);
