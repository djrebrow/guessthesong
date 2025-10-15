# Dienstplan SPA

Diese Anwendung stellt einen farbcodierten Dienstplan für die Kalenderwochen 42–47/2025 bereit. Sie wurde mit React, TypeScript, Vite und Tailwind CSS entwickelt und speichert Änderungen lokal im Browser.

## Features

- Interaktive Tabellen mit Dropdown-Auswahl, Tastaturkürzeln, Copy & Paste sowie Kontextmenü.
- Undo/Redo (50 Schritte), lokale Persistenz per `localStorage`.
- Export nach CSV, Excel (XLSX) und PDF; Import von CSV/XLSX.
- Statistik je Mitarbeiter und Woche, Legende und Hinweistext.
- Filter nach Mitarbeitername und Schichttyp, High-Contrast-Modus, skalierbare Schrift, alternatives Datumsformat.
- Druckoptimierte Ansicht (A3 quer) mit CMYK-freundlichen Farben.
- Responsive Layout (einspaltig auf Mobilgeräten, Sticky-Header).
- Internationalisierung vorbereitet (Deutsch aktiv).
- Bearbeitbare Mitarbeiterliste mit Hinzufügen, Entfernen und Sortieren direkt im Dialog.
- Kalenderbasis-Dialog zur dynamischen Neuberechnung der Wochen inklusive optionaler Übernahme bestehender Einträge.
- Automatische Feiertagslogik für Niedersachsen mit gesperrten, gelb markierten Spalten.
- Tests für Parser, Exporter und Validierung via Vitest.

## Installation & Entwicklung

```bash
npm install
npm run dev
```

Vite startet anschließend unter <http://localhost:5173>.

### Tests

```bash
npm run test
```

### Produktion

```bash
npm run build
npm run preview
```

## Projektstruktur

```
src/
  components/   # UI-Bausteine (Layout, Tabellen, Steuerung)
  pages/        # Seiten
  state/        # Zustand mit Zustand + Persistenz
  utils/        # Hilfsfunktionen (Export, Import, Statistik, Validierung)
  i18n/         # Übersetzungen
  styles/       # Tailwind Einstieg
```

## Hinweis

Die Anwendung erzeugt beim ersten Start Beispielbelegungen. Änderungen bleiben lokal gespeichert, bis der Browser-Speicher geleert wird oder ein Import durchgeführt wird.
