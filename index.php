<?php declare(strict_types=1); ?>
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Learning PWA Quiz</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="hero">
      <div class="hero__inner">
        <p class="eyebrow">Quiz</p>
        <h1>Learning PWA</h1>
        <p class="hero__text">Ein einfaches Quiz mit Kategorien, Punktestand und optionalen Fragen aus der API.</p>
      </div>
    </header>

    <main class="page-shell">
      <section class="quiz-card">
        <div class="section-heading">
          <p class="section-heading__kicker">Fragen</p>
          <h2>Wähle eine Kategorie</h2>
          <p class="section-heading__text">Wähle ein Thema und beantworte die Fragen nacheinander.</p>
        </div>

        <div class="category-buttons" aria-label="Quiz-Kategorien">
          <button type="button" data-category="Berlin">Berlin</button>
          <button type="button" data-category="Hamburg">Hamburg</button>
          <button type="button" data-category="Personen(API)" id="LoadApiQuestionsButton">Personen(API)</button>
        </div>

        <div class="question-panel">
          <p class="question-label">Aktuelle Frage</p>
          <p id="Frage">Wähle eine Kategorie, um dein Quiz zu starten.</p>
        </div>

        <div id="ScoreContainer" aria-live="polite" class="score-card score-summary">
          <div class="score-summary__labels">
            <span class="score-summary__label score-summary__label--correct">Richtig <strong id="CorrectCount">0</strong></span>
            <span class="score-summary__label score-summary__label--wrong">Falsch <strong id="WrongCount">0</strong></span>
          </div>
          <div class="score-bar" aria-label="Fortschritt der Antworten">
          </div>
        </div>

        <div class="answers-grid">
          <button id="Antwort1" class="answer-button"></button>
          <button id="Antwort2" class="answer-button"></button>
          <button id="Antwort3" class="answer-button"></button>
          <button id="Antwort4" class="answer-button"></button>
        </div>

        <div class="quiz-actions">
          <button id="ResetQuizButton" type="button">Neue Quizrunde starten</button>
        </div>
      </section>
    </main>
    <script src="js/highscore-api.js"></script>
    <script src="js/highscore-client.js"></script>
    <script src="questions_lokal.js"></script>
    <script src="questions_REST.js"></script>
  </body>
</html>
