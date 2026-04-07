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
          <button type="button" data-category="berlin">Berlin</button>
          <button type="button" data-category="hamburg">Hamburg</button>
          <button type="button" id="LoadApiQuestionsButton">Personen(API)</button>
        </div>

        <div class="question-panel">
          <p class="question-label">Aktuelle Frage</p>
          <p id="Frage">Wähle eine Kategorie, um dein Quiz zu starten.</p>
        </div>

        <div id="ScoreContainer" aria-live="polite" class="score-grid">
          <div class="score-bar-group score-card">
            <label>Richtig <span id="CorrectCount">0</span></label>
            <div class="score-bar">
              <div id="CorrectBar" class="score-bar-fill correct-fill"></div>
            </div>
          </div>
          <div class="score-bar-group score-card">
            <label>Falsch <span id="WrongCount">0</span></label>
            <div class="score-bar">
              <div id="WrongBar" class="score-bar-fill wrong-fill"></div>
            </div>
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
