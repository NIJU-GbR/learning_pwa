<?php
declare(strict_types=1);

$questionsJsonPath = __DIR__ . '/questions.json';
$inlineQuestionsJson = '{}';

if (is_file($questionsJsonPath)) {
    $loadedQuestionsJson = file_get_contents($questionsJsonPath);
    if ($loadedQuestionsJson !== false && $loadedQuestionsJson !== '') {
        $inlineQuestionsJson = $loadedQuestionsJson;
    }
}
?>
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Deutschlandquiz</title>
    <meta name="theme-color" content="#0f4c81" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Deutschlandquiz" />
    <link rel="manifest" href="manifest.webmanifest" />
    <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="assets/app-icon-192.png" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="hero">
      <div class="hero__inner">
        <p class="eyebrow">Deutschlandquiz</p>
        <h1>Deutschlandquiz</h1>
        <p class="hero__text">Ein Quiz rund um deutsche Städte, Bundesländer, Punktestand und optionale Fragen aus der API.</p>
      </div>
    </header>

    <main class="page-shell">
      <section class="quiz-card">
        <div class="section-heading">
          <p class="section-heading__kicker">Fragen</p>
          <h2>Wähle ein Thema</h2>
          <p class="section-heading__text">Wähle ein Thema und beantworte die Fragen nacheinander.</p>
        </div>

        <div class="category-buttons" aria-label="Quiz-Kategorien">
          <button type="button" data-category="Berlin">Berlin</button>
          <button type="button" data-category="Hamburg">Hamburg</button>
          <button type="button" data-category="Köln">Köln</button>
          <button type="button" data-category="Frankfurt">Frankfurt</button>
          <button type="button" data-category="Bundesländer">Bundesländer</button>
          <button type="button" data-category="Personen" id="LoadApiQuestionsButton">Personen(API)</button>
        </div>

        <div class="question-panel">
          <p class="question-label">Aktuelle Frage</p>
          <p id="Frage">Wähle eine Kategorie, um dein Quiz zu starten.</p>
          <div id="BundeslaenderMapPanel" class="bundeslaender-map-panel" hidden>
            <p id="BundeslaenderMapFeedback" class="bundeslaender-map-feedback">Klicke auf ein Bundesland in der Karte.</p>
            <div id="BundeslaenderMap" class="bundeslaender-map" aria-label="Interaktive Deutschlandkarte"></div>
          </div>
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
    <script>
      window.learningPwaQuestions = <?php echo $inlineQuestionsJson; ?>;
    </script>
    <script src="js/pwa.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="js/highscore-api.js"></script>
    <script src="js/highscore-client.js"></script>
    <script src="questions_lokal.js"></script>
    <script src="questions_REST.js"></script>
  </body>
</html>
