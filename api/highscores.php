<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

// Vergleicht zwei Scores und entscheidet, ob ein neuer Eintrag besser ist.
function isNewScoreBetter(array $existingRow, int $correctCount, float $accuracy, int $wrongCount): bool
{
    $existingCorrect = (int) ($existingRow['correct_count'] ?? 0);
    $existingAccuracy = (float) ($existingRow['accuracy'] ?? 0.0);
    $existingWrong = (int) ($existingRow['wrong_count'] ?? 0);

    if ($correctCount !== $existingCorrect) {
        return $correctCount > $existingCorrect;
    }

    if (abs($accuracy - $existingAccuracy) > 0.00001) {
        return $accuracy > $existingAccuracy;
    }

    return $wrongCount < $existingWrong;
}

$db = getHighscoreDatabase();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// GET liefert das Dashboard, POST speichert einen Score.
if ($method === 'GET') {
    $categoryFilter = trim((string) ($_GET['category'] ?? ''));

    sendJsonResponse([
        'categories' => fetchDashboardRows($db, $categoryFilter)
    ]);
}

if ($method !== 'POST') {
    sendJsonResponse(['error' => 'Methode nicht erlaubt.'], 405);
}

// Eingaben prüfen, bevor die Datenbank beschrieben wird.
$payload = readJsonBody();

$username = trim((string) ($payload['username'] ?? ''));
$category = trim((string) ($payload['category'] ?? ''));
$correctCount = (int) ($payload['correctCount'] ?? -1);
$wrongCount = (int) ($payload['wrongCount'] ?? -1);
$totalCount = (int) ($payload['totalCount'] ?? -1);

if ($username === '' || $category === '') {
    sendJsonResponse(['error' => 'Benutzername und Kategorie sind erforderlich.'], 422);
}

if ($correctCount < 0 || $wrongCount < 0 || $totalCount < 0) {
    sendJsonResponse(['error' => 'Ungültige Score-Werte.'], 422);
}

if ($totalCount !== ($correctCount + $wrongCount)) {
    sendJsonResponse(['error' => 'Gesamtzahl passt nicht zu richtig/falsch.'], 422);
}

$accuracy = $totalCount > 0 ? ($correctCount / $totalCount) * 100 : 0.0;

// Vorhandenen Datensatz für denselben Nutzer und dieselbe Kategorie suchen.
$existingStatement = $db->prepare(
    'SELECT id, username, category, correct_count, wrong_count, total_count, accuracy
     FROM highscores
     WHERE lower(username) = lower(:username)
       AND lower(category) = lower(:category)
     ORDER BY correct_count DESC, accuracy DESC, wrong_count ASC, created_at ASC, id ASC
     LIMIT 1'
);

$existingStatement->execute([
    ':username' => $username,
    ':category' => $category
]);

$existingRecord = $existingStatement->fetch();

if ($existingRecord !== false) {
    // Nur verbessern, wenn der neue Score besser ist als der alte.
    if (!isNewScoreBetter($existingRecord, $correctCount, $accuracy, $wrongCount)) {
        sendJsonResponse([
            'success' => true,
            'updated' => false,
            'record' => [
                'username' => (string) $existingRecord['username'],
                'category' => (string) $existingRecord['category'],
                'correctCount' => (int) $existingRecord['correct_count'],
                'wrongCount' => (int) $existingRecord['wrong_count'],
                'totalCount' => (int) $existingRecord['total_count'],
                'accuracy' => (float) $existingRecord['accuracy']
            ]
        ]);
    }

    $updateStatement = $db->prepare(
        'UPDATE highscores
         SET username = :username,
             category = :category,
             correct_count = :correct_count,
             wrong_count = :wrong_count,
             total_count = :total_count,
             accuracy = :accuracy,
             created_at = CURRENT_TIMESTAMP
         WHERE id = :id'
    );

    $updateStatement->execute([
        ':username' => $username,
        ':category' => $category,
        ':correct_count' => $correctCount,
        ':wrong_count' => $wrongCount,
        ':total_count' => $totalCount,
        ':accuracy' => $accuracy,
        ':id' => (int) $existingRecord['id']
    ]);

    sendJsonResponse([
        'success' => true,
        'updated' => true,
        'record' => [
            'username' => $username,
            'category' => $category,
            'correctCount' => $correctCount,
            'wrongCount' => $wrongCount,
            'totalCount' => $totalCount,
            'accuracy' => $accuracy
        ]
    ]);
}

// Kein Eintrag vorhanden: neuen Highscore anlegen.
$insertStatement = $db->prepare(
    'INSERT INTO highscores (username, category, correct_count, wrong_count, total_count, accuracy)
     VALUES (:username, :category, :correct_count, :wrong_count, :total_count, :accuracy)'
);

$insertStatement->execute([
    ':username' => $username,
    ':category' => $category,
    ':correct_count' => $correctCount,
    ':wrong_count' => $wrongCount,
    ':total_count' => $totalCount,
    ':accuracy' => $accuracy
]);

sendJsonResponse([
    'success' => true,
    'updated' => true,
    'record' => [
        'username' => $username,
        'category' => $category,
        'correctCount' => $correctCount,
        'wrongCount' => $wrongCount,
        'totalCount' => $totalCount,
        'accuracy' => $accuracy
    ]
], 201);
