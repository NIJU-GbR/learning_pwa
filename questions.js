let allQuestions = [];

const questionText = document.getElementById('Frage');
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

function showRandomQuestion() {
    if (!allQuestions.length) {
        questionText.textContent = 'Keine Fragen gefunden.';
        return;
    }

    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    renderQuestion(allQuestions[randomIndex]);
}

async function loadQuestions() {
    questionText.textContent = 'Lade Daten...';

    try {
        const response = await fetch('questions.json');

        if (!response.ok) {
            throw new Error(`HTTP-Status ${response.status}`);
        }

        const data = await response.json();
        allQuestions = Object.values(data).flat();
        showRandomQuestion();
    } catch (error) {
        questionText.textContent = `Fehler beim Laden der Fragen: ${error.message}`;
    }
}

document.addEventListener('DOMContentLoaded', loadQuestions);
