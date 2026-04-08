# Deutschlandquiz

Deutschlandquiz ist eine Progressive Web App zum Lernen und Testen von Wissen rund um deutsche Städte, Bundesländer und optionale API-Fragen. Die Anwendung läuft mit PHP, JavaScript, HTML, CSS, REST und SQLite und kann auch offline genutzt werden.

## Funktionen

- Lokale Quizfragen mit zufälliger Reihenfolge von Fragen und Antworten
- Kategorien für Berlin, Hamburg, Köln, Frankfurt und Bundesländer
- Bundesländer-Quiz mit interaktiver Karte
- Optionale Fragen vom REST-Server
- Fortschritts- und Erfolgsanzeige mit richtig/falsch-Zähler
- Highscore-Speicherung in SQLite über eine REST-API
- PWA-Support mit Manifest und Service Worker
- Offline-Nutzung für den bereits gecachten App-Stand

## Voraussetzungen

- PHP 8.x mit SQLite-Unterstützung
- Ein Webserver oder die PHP-Entwicklungsumgebung
- Internetverbindung nur für externe API-Fragen und das erste Laden der externen Ressourcen

## Starten

1. Projektordner öffnen
2. Einen lokalen PHP-Server im Projektverzeichnis starten
3. Im Browser `index.php` aufrufen

Beispiel:

```bash
php -S localhost:8000
```

Danach die App unter `http://localhost:8000` öffnen.

## Highscores

Die Highscore-Daten werden automatisch in `data/highscores.sqlite` gespeichert. Die Datei wird beim ersten Zugriff erzeugt, falls sie noch nicht existiert. Auf der Quizseite wird das Dashboard rechts neben dem Quiz angezeigt und bei Kategoriewechseln aktualisiert.

## Bedienung

- Eine Kategorie auswählen, um das Quiz zu starten
- Antworten über die vier Buttons auswählen
- Bei der Kategorie Bundesländer die Karte verwenden
- Für API-Fragen die Internetverbindung aktiviert lassen
- Bei Bedarf eine neue Quizrunde über den Reset-Button starten

## Projektstruktur

- `index.php` - Einstiegspunkt der Anwendung
- `questions.json` - lokale Quizfragen
- `manifest.webmanifest` - PWA-Manifest
- `sw.js` - Service Worker für Offline-Caching
- `api/` - REST-API und SQLite-Anbindung
- `js/` - Quizlogik, PWA-Logik und UI-Skripte
- `js/ui/dashboard.js` - Highscore-Dashboard auf der Quizseite
- `styles.css` - Layout und Design
- `assets/` - App-Icons und weitere Medien
- `data/` - lokale SQLite-Datenbank

## Hinweis

Die Umsetzung orientiert sich an der Aufgabenstellung aus `Beleg_DKU.md` und hält den technischen Stack bewusst schlank.