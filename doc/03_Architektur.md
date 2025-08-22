# Architektur des DT-Visualisierers

## Überblick

Der DT-Visualisierer folgt einer **modularen, ereignisgetriebenen Architektur** mit klarer Trennung von Datenlogik, UI-Komponenten und Zustandsverwaltung. Die Anwendung ist als **Single Page Application (SPA)** konzipiert und nutzt Vanilla JavaScript mit ES6-Modulen.

## Projektstruktur

```
src/
├── index.js              # Einstiegspunkt der Anwendung
├── state.js               # Zentrale Zustandsverwaltung
├── logic/                 # Geschäftslogik und Algorithmen
│   ├── ast.js             # Abstract Syntax Tree für Parser
│   ├── bool.js            # Boolean-Algebra und Ausdrücke
│   ├── parser.js          # Expression-Parser
│   ├── symmetry.js        # Symmetriediagramm-Algorithmen
│   └── truth.js           # Wahrheitstabellen-Logik
├── ui/                    # UI-Komponenten und Rendering
│   ├── ui.js              # Haupt-UI-Controller
│   ├── layout.js          # Grid-Layout-Management
│   ├── controlls.js       # Interaktive Steuerelemente
│   ├── hover.js           # Hover-Interaktionen
│   ├── touch.js           # Touch-Support
│   ├── canonForm.js       # Boolean-Expression-UI (kanonische Formen)
│   ├── currentFunctionExpression.js  # Aktuelle Funktionsanzeige und Eingabe mit KaTeX
│   ├── mux.js             # MUX-Diagramm-UI
│   ├── symmetry.js        # Symmetriediagramm-UI
│   └── truth.js           # Wahrheitstabellen-UI
└── utils/                 # Hilfsfunktionen
    └── utils.js           # Allgemeine Utilities
```

## Architektur-Prinzipien

### 1. **Trennung der Verantwortlichkeiten**
- **Logic Layer**: Reine Algorithmen ohne DOM-Abhängigkeiten
- **UI Layer**: DOM-Manipulation und Event-Handling
- **State Layer**: Zentrale Zustandsverwaltung

### 2. **Modulares System**
- ES6-Module für saubere Abhängigkeiten
- Explizite Imports/Exports
- Keine globalen Variablen (außer notwendigen DOM-Referenzen)

### 3. **Ereignisgetriebene Architektur**
- Reaktive UI-Updates basierend auf Zustandsänderungen
- Event-Handler für Benutzerinteraktionen
- Observer-Pattern für Layout-Updates


## Kern-Komponenten

### Zustandsverwaltung (`state.js`)

**Zentrale Zustandsobjekte:**

```javascript
// Globale Konfiguration
VARIABLE_NAMES = ["A", "B", "C", "D"]
DEFAULT_LAYOUT_CONFIG = { paddingX, paddingY, spacingX, spacingY }

// Haupt-Anwendungszustand
logicState = { nVars, truth[], preset }
customFunctionState = { isEditing, isValid, customFunction }
layoutState = { isLandscape, displayOptionsExpanded, viewToggleMappings }
expansionState = { spanData, spanIdCounter, groupIdCounter }
```

**Datenpersistierung:**
- LocalStorage für dauerhafte Speicherung des Zustands
- Automatisches Laden und Speichern des Anwendungszustands

### Logik-Schicht (`src/logic/`)

#### Abstract Syntax Tree (`ast.js`)
- **AST-Klassen**: Node-Typen für Parser-Baumstruktur
- **Traversierung**: Methoden zur Baum-Navigation
- **Visualisierung**: SVG-Export für AST-Darstellung

#### Boolean-Verarbeitung (`bool.js`)
- **Kernfunktionen**: `minimize()`, `expand()`, `lit()`
- **Rekursive Expansion**: `simplifiedBooleanExpansionRecursive()`
- **Baumstruktur** für Boolean-Ausdrücke
- Mehr erfahren in der Datei [doc/031_Bool-Algorythmen.md](031_Bool-Algorythmen.md).

#### Multiplexer-Engine (`mux.js`)
- **SVG-Rendering**: Dynamische Generierung von MUX-Diagrammen
- **Layout-Algorithmus**: `calculateMuxLayout()`, `generateMuxDiagramStructure()`
- **Zustandsverwaltung**: `MUX_DIAGRAM_STATE` für SVG-Referenzen
- **Interaktive Hervorhebung**: Highlighting von Elementen

#### Symmetrie-Analyse (`symmetry.js`)
- **Hauptalgorithmus**: `truthTableToSymmetryDiagram()`
- **Zahlensystem-Konvertierung**: `decimalToOctal()`
- **Raster-Berechnung**: `getNumberOfRowsAndCols()`
- Mehr erfahren in der Datei [doc/032_Symmetriediagramm-Algorythmen.md](032_Symmetriediagramm-Algorythmen.md)

#### Expression-Parser (`parser.js`)
- **Parsing-Engine**: Verarbeitung von Boolean-Ausdrücken
- **AST-Integration**: Arbeitet mit Abstract Syntax Tree
- **Minimierungsalgorithmen**: `getMinimalExpression()`
- **Syntax-Validierung**: Überprüfung der Eingabe-Syntax
- **Token-Verarbeitung**: Zerlegung komplexer Ausdrücke
- Mehr erfahren in der Datei [doc/033_Parser-und-AST-Algorythmen.md](033_Parser-und-AST-Algorythmen.md)


#### Wahrheitstabellen-Logik (`truth.js`)
- **Tabellengenerierung**: Basierend auf Anzahl der Variablen (`nVars`)
- **Preset-Verwaltung**: Vordefinierte Funktionen (AND, OR, XOR, etc.)

### Benutzeroberflächen-Schicht (`src/ui/`)

Die Benutzeroberfläche folgt einer **komponentenbasierten Architektur**, bei der jede UI-Karte ihre eigene Render-Funktion besitzt. Die zentrale `renderAll()`-Methode in `src/ui/ui.js` koordiniert alle einzelnen Komponenten-Renderer.

**Hinweis**: Beim rendern von den UI-Komponenten werden die Bits umgekehrt, sodass die niedrigsten Bits links und die höchsten Bits rechts angezeigt werden. Dies wird wegen der umgekehrten Darstellung des Symmetriediagramms so gemacht, um eine konsistente Darstellung zu gewährleisten und die Relationen zwischen Wahrheitstabelle und Symmetriediagramm korrekt darzustellen.

#### Haupt-UI-Controller (`ui.js`)
```javascript
// Haupt-Rendering-Pipeline - ruft alle Komponenten-Renderer auf
renderAll() {
  renderTruth()              // Wahrheitstabelle rendern (truth.js)
  renderCurrentFunctionExpression()  // Aktuelle Funktion anzeigen (currentFunctionExpression.js)
  renderSymmetryDiagram()    // Symmetriediagramm zeichnen (symmetry.js)
  renderExpr()               // Boolean-Ausdrücke darstellen (booleanForm.js)
  renderDev()                // MUX-Diagramme generieren (mux.js)
}

// Anwendungsinitialisierung
init() {
  setSvgMux()               // SVG-Container einrichten
  buildTruth()              // Wahrheitstabelle aufbauen
  applyPreset()             // Standard-Funktion anwenden
  setupEventHandlers()      // Event-Listener registrieren
  renderAll()               // Erste Darstellung
}
```

#### Einzelne UI-Komponenten (Render-Funktionen)

**Wahrheitstabelle (`truth.js`)**
- **`renderTruth()`**: Generiert und zeigt die Wahrheitstabelle an
- Implementiert Click-Handler für Zellbearbeitung
- Touch-Support für mobile Geräte

**Symmetriediagramm (`symmetry.js`)**
- **`renderSymmetryDiagram()`**: Zeichnet das Symmetriediagramm
- Berechnet Grid-Layout basierend auf Variablenanzahl
- Interaktive Zell-Klicks mit `setupSymmetryDiagramClickHandler()`

**Boolean-Ausdrücke (`canonForm.js`)**
- **`renderExpr()`**: Zeigt kanonische und minimierte Logik-Ausdrücke der aktiven Funktion
- **Normalformen**: Darstellung von DNF und KNF
- **Minimierung**: Anzeige der minimalen Schaltungsrealisierung


**MUX-Diagramme und Boolsche Entwicklung (`mux.js`)**

- Zuständig für die Darstellung der Boolschen Entwicklung und MUX-Diagramme
- Die Funktionen `renderDev()` und `renderMUX()` wurden zusammengelegt, da beide logisch zusammenhängen und eine sehr ähnliche Struktur sowie SVG-Rendering-Logik nutzen.
- Haupt-MUX-Rendering mit ResizeObserver für dynamische Layout-Anpassung
- Gemeinsame dynamische Layout-Berechnung und SVG-Generierung für beide Ansichten

**Aktuelle Funktionsanzeige (`currentFunctionExpression.js`)**
- **`renderCurrentFunctionExpression()`**: Zeigt die aktuelle Boolean-Funktion
- KaTeX-Integration für mathematische Darstellung
- Custom-Function-Modus mit Eingabevalidierung

#### Layout-Verwaltung (`layout.js`)
- **Responsive Grid**: Tailwind CSS Grid-System für verschiedene Bildschirmgrößen
- **Dynamische Spalten**: `updateGridCols()` angepasst an aktive Karten
- **Viewport-Anpassung**: Unterstützung für Landscape/Portrait-Modi
- **Karten-Sichtbarkeit**: Toggle-System für UI-Komponenten

#### Interaktive Steuerelemente (`controlls.js`)
- **Preset-Schaltflächen**: Vordefinierte Funktionen auswählen
- **Variablen-Kontrolle**: Anzahl der Variablen (nVars) ändern
- **Ansichts-Umschalter**: Verwaltung der Karten-Sichtbarkeit
- **Ausklapp-System**: Erweiterte Anzeigeoptionen

#### Hover- und Touch-Interaktionen (`hover.js`, `touch.js`)
- **Komponentenübergreifende Hervorhebung**: Synchronisation zwischen verschiedenen Ansichten
- **Touch-freundliche Oberfläche**: Optimierung für mobile Geräte
- **Event-Delegation**: Effiziente Verwaltung von Event-Handlern

### Hilfsfunktionen (`src/utils/`)

## Render-Funktions-Architektur

### Kernkonzept: Eine Render-Funktion pro UI-Karte
Die Anwendung folgt dem Prinzip, dass **jede UI-Karte eine eigene Render-Funktion** besitzt:

```javascript
// Zentrale Koordination in ui.js
renderAll() {
  renderTruth()                      // → truth.js
  renderCurrentFunctionExpression()  // → currentFunctionExpression.js  
  renderSymmetryDiagram()           // → symmetry.js
  renderExpr()                      // → booleanForm.js
  renderDev()                       // → mux.js (für MUX-Karte)
}
```

### Vorteile dieser Architektur:
- **Modulare Entwicklung**: Jede Karte kann unabhängig entwickelt werden
- **Einfache Wartung**: Änderungen betreffen nur die jeweilige Komponente
- **Saubere Trennung**: Logik und UI sind klar getrennt
- **Wiederverwendbarkeit**: Render-Funktionen können einzeln aufgerufen werden
- **Testbarkeit**: Jede Komponente kann isoliert getestet werden

### Render-Aufrufe bei Zustandsänderungen:
```javascript
// Bei jeder Benutzerinteraktion:
Benutzereingabe → State Update → renderAll() → Alle Karten neu rendern
```

## Datenfluss

### 1. **Anwendungsstart**
```
index.js → ui.js:init() → 
  ├── Zustand laden (localStorage)
  ├── SVG-Setup (setSvgMux)
  ├── Wahrheitstabelle aufbauen (buildTruth)
  ├── Event-Handler einrichten
  └── Erste Darstellung (renderAll)
```

### 2. **Benutzerinteraktion**
```
Benutzereingabe → Event Handler → Zustand aktualisieren → renderAll() → 
  ├── Logische Verarbeitung
  ├── UI-Updates
  └── Zustand speichern
```

### 3. **Rendering-Pipeline**
```
renderAll() →
  ├── renderTruth() → truth.js Logik → DOM-Update
  ├── renderSymmetryDiagram() → symmetry.js → DOM-Update
  ├── renderExpr() → booleanForm.js → DOM-Update
  ├── renderDev() → mux.js → SVG-Rendering
  └── Event-Handler-Setup → hover.js, touch.js
```

##  UI-Komponenten-Architektur

### Kartenbasiertes Layout
- **Modulare Karten**: Jede Funktionalität als separate Karte
- **Grid-System**: Responsive Tailwind CSS Grid
- **Umschalt-System**: Dynamische Karten-Sichtbarkeit

### SVG-Rendering
- **MUX-Diagramme**: Prozedurale SVG-Generierung
- **Interaktive Elemente**: Click/Hover-Events auf SVG-Elementen
- **Responsive Größenanpassung**: Automatische SVG-Skalierung

### Zustandssynchronisierte Benutzeroberfläche
- **Komponentenübergreifende Updates**: Änderungen werden automatisch propagiert
- **Hover-Synchronisation**: Hervorhebung zwischen Komponenten
- **Layout-Anpassung**: Automatische Grid-Justierung

