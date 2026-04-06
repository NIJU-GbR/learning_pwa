# Instructions

## Kontext
Die Umsetzung basiert **ausschließlich auf der Aufgabenstellung in `Beleg_DKU.md`**.  
Alle Anforderungen, Funktionen und Rahmenbedingungen müssen daraus abgeleitet und eingehalten werden.

## Projekt
Wir entwickeln eine Progressive Web App (PWA) für ein Learning-Programm.

## Technologie-Stack
Verwende ausschließlich folgende Technologien:
- HTML
- CSS
- JavaScript
- PHP
- REST
- SQLite
- PWA (Service Worker, Manifest etc.)

## Grundregeln

### Bezug zur Aufgabenstellung
- Setze nur Funktionen um, die aus `Beleg_DKU.md` hervorgehen.
- Interpretiere Anforderungen möglichst **minimal und präzise**, ohne unnötige Erweiterungen.
- Wenn Anforderungen unklar sind, stelle Nachfragen um die Anforderung zu verstehen.

### Codequalität
- Schreibe fehlerfreien, funktionsfähigen Code.
- Halte den Code so einfach und verständlich wie möglich.
- Bevorzuge klare Struktur statt unnötiger Komplexität.

### Änderungen & Erweiterungen
- Implementiere Änderungen mit **so wenigen neuen Codezeilen wie möglich**.
- Nutze bestehenden Code, wo sinnvoll, statt neuen Code zu duplizieren.
- Verändere nur das absolut Notwendige.

### Abhängigkeiten
- Verwende **keine externen Bibliotheken oder Frameworks**, ohne vorherige Rückfrage.
- Setze ausschließlich auf native Web-Technologien.

### Stil & Lesbarkeit
- Verwende sprechende Variablennamen.
- Halte Funktionen klein und fokussiert.
- Schreibe nachvollziehbaren, wartbaren Code.

### Code-Stil für JavaScript
Für maximale Lesbarkeit und Wartbarkeit:

**Schleifen & Array-Operationen**
- Nutze klassische `for`-Schleifen statt `.map()`, `.filter()`, `.reduce()` oder `.forEach()`
- Das macht Code sofort verständlich, auch für JavaScript-Anfänger

**Variablenstruktur**
- Verwende einfache Variablen und primitive Datentypen
- Vermeiden Sie tiefe Verschachtelungen oder komplexe Objekt-Strukturen
- Benenne Variablen beschreibend: `remainingQuestionsPerCategory` statt `rQPC`

**Funktionsaufbau**
- Teile komplexe Vorgänge in mehrere kleine Funktionen auf
- Eine Funktion = eine klar abgegrenzte Aufgabe
- Nutze Zwischenschritte: speichere Ergebnisse in Variablen statt alles in einer Zeile zu verketten

**Kommentare & Dokumentation**
- Jede Funktion bekommt eine klare Überschrift (mit `// ===` Rahmen)
- Erkläre jeden größeren Schritt im Code
- Nutze "Sicherheits-Kommentare" für Überprüfungen (z.B. "Sicherheit: Existiert das Element?")
- Kommentiere die Absicht, nicht das Offensichtliche

**Code-Struktur**
- Gruppiere zusammenhängende Funktionen mit Überschriften
- Am Anfang: globale Variablen (mit Erklär-Kommentaren)
- Dann: alle Funktionen (klein, fokussiert)
- Am Ende: Event-Listener und Initialisierung

**Konkrete Beispiele vermeiden**
- Nutze String-Verkettung: `'Text: ' + variable` statt Template-Strings `` `Text: ${variable}` ``
- Explizite Bedingungen: `if (array.length === 0)` oder `if (!array.length)` aber mit Kommentar

## Ziel
Eine einfache, performante und wartbare PWA, die die Anforderungen aus `Beleg_DKU.md` exakt erfüllt — ohne unnötige Features oder Abhängigkeiten.
