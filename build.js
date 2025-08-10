const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  const rootDir = process.cwd(); // Projekt-Root
  const jsEntry = path.join(rootDir, 'src', 'index.js');
  const cssDir = path.join(rootDir, 'assets', 'css');
  const htmlFile = path.join(rootDir, 'index.html');
  const outDir = path.join(rootDir, 'dist');

  fs.mkdirSync(outDir, { recursive: true });

  // 1. JS bündeln & minifizieren und als separate Datei speichern
  await esbuild.build({
    entryPoints: [jsEntry],
    bundle: true,
    minify: true,
    outdir: outDir,
    entryNames: 'index.min', // Explizit den Namen festlegen
    sourcemap: false,
    format: 'iife', // Immediately Invoked Function Expression für bessere Kompatibilität
    target: 'es2020', // Kompatibilität mit modernen Browsern
    platform: 'browser', // Explizit für Browser
    globalName: 'DTVisualizer', // Globaler Name für das Bundle
  });

  // 2. CSS aus allen Dateien im assets/css lesen, zusammenfügen und minifizieren
  let cssCode = '';
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    for (const file of cssFiles) {
      cssCode += fs.readFileSync(path.join(cssDir, file), 'utf8') + '\n';
    }
  }

  // CSS minifizieren (einfache Minifizierung)
  const minifiedCSS = minifyCSS(cssCode);
  fs.writeFileSync(path.join(outDir, 'index.min.css'), minifiedCSS, 'utf8');

  // 3. HTML einlesen und für separate Dateien modifizieren
  let html = fs.readFileSync(htmlFile, 'utf8');

  // 4. NUR lokale JS <script src="src/..."> Tags durch minifizierte Version ersetzen
  html = html.replace(`<script src="src/index.js" defer type="module">`, '');

  // 5. NUR lokale CSS <link rel="stylesheet" href="assets/css/..."> Tags durch minifizierte Version ersetzen
  html = html.replace(/<link\s+rel=["']stylesheet["']\s+href=["']assets\/css\/[^"']+["']\s*\/?>\s*/g, '');

  // 6. Asset-Pfade für favicon korrigieren (entferne führenden Slash)
  html = html.replace(/href="\/assets\//g, 'href="assets/');
  html = html.replace(/src="\/assets\//g, 'src="assets/');

  // 7. Minifizierte CSS-Datei im <head> vor </head> einfügen
  html = html.replace(
    /<\/head>/,
    `  <link rel="stylesheet" href="index.min.css">\n</head>`
  );

  // 8. Minifizierte JS-Datei vor </body> einfügen
  html = html.replace(
    /<\/body>/,
    `  <script src="index.min.js"></script>\n</body>`
  );

  // 9. Assets-Ordner kopieren (ohne CSS-Ordner)
  const assetsSource = path.join(rootDir, 'assets');
  const assetsTarget = path.join(outDir, 'assets');
  
  if (fs.existsSync(assetsSource)) {
    copyDir(assetsSource, assetsTarget, true); // true = CSS-Ordner überspringen
  }

  // 10. Ergebnis speichern
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

  console.log('Build fertig!');
  console.log('Dateien erstellt:');
  console.log('  - dist/index.html');
  console.log('  - dist/index.min.js');
  console.log('  - dist/index.min.css');
  console.log('  - dist/assets/ (ohne css/ Ordner - CSS ist in index.min.css)');
}

// Einfache CSS-Minifizierung
function minifyCSS(css) {
  return css
    // Entferne Kommentare
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Entferne unnötige Leerzeichen und Zeilenumbrüche
    .replace(/\s+/g, ' ')
    // Entferne Leerzeichen um bestimmte Zeichen
    .replace(/\s*{\s*/g, '{')
    .replace(/;\s*/g, ';')
    .replace(/:\s*/g, ':')
    .replace(/}\s*/g, '}')
    .replace(/,\s*/g, ',')
    // Entferne führende und nachfolgende Leerzeichen
    .trim();
}

// Hilfsfunktion zum rekursiven Kopieren von Verzeichnissen (ohne CSS-Ordner)
function copyDir(src, dest, skipCssDir = false) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    // CSS-Ordner überspringen, da wir eine minifizierte CSS-Datei haben
    if (skipCssDir && entry.name === 'css' && entry.isDirectory()) {
      continue;
    }
    
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, false); // Nur im Top-Level CSS überspringen
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
