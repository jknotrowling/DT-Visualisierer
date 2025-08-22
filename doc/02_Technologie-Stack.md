# Technologie-Stack

## Core-Sprachen
- **HTML5** - Struktur der Webanwendung
- **CSS3** - Styling und Layout
- **JavaScript (ES6+)** - Anwendungslogik und Interaktivität

## CSS-Framework & Styling
- **Tailwind CSS** - Utility-first CSS-Framework via CDN
- **KaTeX** - Mathematische Formeln und Ausdrücke
- **Font Awesome** - Icon-Library für UI-Elemente


## JavaScript-Architektur
- **Vanilla JavaScript** - Keine Framework-Abhängigkeiten
- **ES6 Module System** - Modulare Code-Organisation
- **Event-driven Architecture** - Reaktive UI-Updates

## Build-Tools & Development

### Build-System
- **build.js** - Build-Script mit ESBuild-Integration
  - Erstellt optimierte, separate Dateien für Performance
  - JavaScript-Module werden gebündelt und als `index.min.js` ausgegeben
  - CSS-Dateien werden zusammengefasst und als `index.min.css` ausgegeben
  - Assets werden in `dist/assets/` Ordner kopiert (ohne CSS-Ordner)
  - HTML wird für minifizierte Dateien angepasst


### Build-Prozess 
1. **JavaScript-Bundling**: Alle Module aus `src/` mit ESBuild gebündelt und minifiziert als `index.min.js`
2. **CSS-Aggregation**: Alle Dateien aus `assets/css/` zusammengefasst und minifiziert als `index.min.css`
3.  **Asset-Kopierung**: Rekursive Kopie des `assets/` Ordners (CSS-Ordner übersprungen)
4. **HTML-Ausgabe**: Finale `dist/index.html` mit Verweisen auf separate minifizierte Dateien

### Package Management
- **npm** - Dependency-Management
- **package.json** - Projekt-Konfiguration und Scripts
- **ESBuild** - Schneller JavaScript Bundler und Minifier
- **Einfacher Build-Command**: `npm run build` nutzt das custom `build.js` Script


## Rendering
- **KaTeX Integration** - LaTeX-Formeln in der Web-UI
- **Canvas/SVG** - Für komplexe Diagramm-Visualisierungen
- **DOM-Manipulation** - Dynamische UI-Updates

## Responsive Design
- **Mobile-First** - Optimiert für verschiedene Bildschirmgrößen
- **Touch-Support** - Tablet- und Smartphone-Interaktionen
- **Progressive Enhancement** - Schrittweise Feature-Verbesserung

## Hosting & Deployment

### Browser-Kompatibilität
- **Modern Browsers** - Chrome, Firefox, Safari, Edge
- **ES6+ Support** - Moderne JavaScript-Features
- **Progressive Enhancement** - Fallbacks für ältere Browser

