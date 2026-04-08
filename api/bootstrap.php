<?php
declare(strict_types=1);

// Datenbankzugriff und Schema-Aufbau für die Highscore-Speicherung.
function getHighscoreDatabase(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $databaseDirectory = dirname(__DIR__) . '/data';
    if (!is_dir($databaseDirectory)) {
        mkdir($databaseDirectory, 0777, true);
    }

    $pdo = new PDO('sqlite:' . $databaseDirectory . '/highscores.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    ensureHighscoreSchema($pdo);

    return $pdo;
}

// Stellt sicher, dass die Tabelle und die erwarteten Spalten vorhanden sind.
function ensureHighscoreSchema(PDO $db): void
{
    $db->exec(
        'CREATE TABLE IF NOT EXISTS highscores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            category TEXT NOT NULL,
            correct_count INTEGER NOT NULL,
            wrong_count INTEGER NOT NULL,
            total_count INTEGER NOT NULL,
            accuracy REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )'
    );

    $columns = [];
    $tableInfo = $db->query('PRAGMA table_info(highscores)');

    foreach ($tableInfo->fetchAll() as $columnInfo) {
        $columns[] = (string) $columnInfo['name'];
    }

    $expectedColumns = ['id', 'username', 'category', 'correct_count', 'wrong_count', 'total_count', 'accuracy', 'created_at'];
    $missingColumns = array_diff($expectedColumns, $columns);

    if (count($missingColumns) > 0) {
        migrateLegacyHighscoreSchema($db, $columns);
    }

    $db->exec('CREATE INDEX IF NOT EXISTS idx_highscores_category ON highscores(category)');
}

// Alte Tabellenformate werden auf das aktuelle Highscore-Schema migriert.
function migrateLegacyHighscoreSchema(PDO $db, array $existingColumns): void
{
    $db->beginTransaction();

    try {
        $db->exec('DROP TABLE IF EXISTS highscores_new');
        $db->exec('ALTER TABLE highscores RENAME TO highscores_legacy');

        $db->exec(
            'CREATE TABLE highscores_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                category TEXT NOT NULL,
                correct_count INTEGER NOT NULL,
                wrong_count INTEGER NOT NULL,
                total_count INTEGER NOT NULL,
                accuracy REAL NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )'
        );

        if (in_array('player_name', $existingColumns, true) && in_array('category_name', $existingColumns, true)) {
            $db->exec(
                'INSERT INTO highscores_new (id, username, category, correct_count, wrong_count, total_count, accuracy, created_at)
                 SELECT
                    id,
                    player_name,
                    category_name,
                    correct_count,
                    wrong_count,
                    correct_count + wrong_count,
                    score_ratio,
                    updated_at
                 FROM highscores_legacy'
            );
        } else {
            $db->exec(
                'INSERT INTO highscores_new (id, username, category, correct_count, wrong_count, total_count, accuracy, created_at)
                 SELECT
                    id,
                    username,
                    category,
                    correct_count,
                    wrong_count,
                    correct_count + wrong_count,
                    accuracy,
                    created_at
                 FROM highscores_legacy'
            );
        }

        $db->exec('DROP TABLE highscores_legacy');
        $db->exec('ALTER TABLE highscores_new RENAME TO highscores');
        $db->commit();
    } catch (Throwable $exception) {
        $db->rollBack();
        throw $exception;
    }
}

// Einheitliche JSON-Antworten für die REST-API.
function sendJsonResponse(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Liest den JSON-Body von POST-Anfragen aus.
function readJsonBody(): array
{
    $rawBody = file_get_contents('php://input');
    if ($rawBody === false || $rawBody === '') {
        return [];
    }

    $decoded = json_decode($rawBody, true);
    if (!is_array($decoded)) {
        sendJsonResponse(['error' => 'Ungültiger JSON-Body.'], 400);
    }

    return $decoded;
}

// Liefert das Dashboard pro Kategorie, optional gefiltert.
function fetchDashboardRows(PDO $db, string $categoryFilter = ''): array
{
    $categories = [];
    $hasCategoryFilter = $categoryFilter !== '';

    if ($hasCategoryFilter) {
        $categoryQuery = $db->prepare(
            'SELECT DISTINCT category
             FROM highscores
             WHERE lower(category) = lower(:category)
             ORDER BY category ASC'
        );
        $categoryQuery->execute([':category' => $categoryFilter]);
    } else {
        $categoryQuery = $db->query('SELECT DISTINCT category FROM highscores ORDER BY category ASC');
    }

    foreach ($categoryQuery->fetchAll() as $categoryRow) {
        $categoryName = (string) $categoryRow['category'];
        $statement = $db->prepare(
            'SELECT username, correct_count, wrong_count, total_count, accuracy, created_at
                         FROM highscores AS h
                         WHERE h.category = :category
                             AND NOT EXISTS (
                                        SELECT 1
                                        FROM highscores AS h2
                                        WHERE h2.category = h.category
                                            AND lower(h2.username) = lower(h.username)
                                            AND (
                                                h2.correct_count > h.correct_count
                                                OR (h2.correct_count = h.correct_count AND h2.accuracy > h.accuracy)
                                                OR (h2.correct_count = h.correct_count AND h2.accuracy = h.accuracy AND h2.wrong_count < h.wrong_count)
                                                OR (h2.correct_count = h.correct_count AND h2.accuracy = h.accuracy AND h2.wrong_count = h.wrong_count AND h2.created_at < h.created_at)
                                                OR (h2.correct_count = h.correct_count AND h2.accuracy = h.accuracy AND h2.wrong_count = h.wrong_count AND h2.created_at = h.created_at AND h2.id < h.id)
                                            )
                             )
             ORDER BY correct_count DESC, accuracy DESC, wrong_count ASC, created_at ASC
             LIMIT 10'
        );
        $statement->execute([':category' => $categoryName]);
        $categories[$categoryName] = $statement->fetchAll();
    }

    return $categories;
}
