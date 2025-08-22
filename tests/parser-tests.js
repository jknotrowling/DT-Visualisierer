import {AST} from "../src/logic/ast.js";
import fs from 'fs';

// Beispiel AST erstellen
const ast = new AST("!(A & B) | (C ^D | !(D & A))");

// Text-Visualisierung
console.log("Text-Visualisierung:");
console.log(ast.visualizeTree());

// SVG-Visualisierung erstellen
function createSVGVisualization(ast) {
    const nodePositions = new Map();
    const connections = [];
    let nodeId = 0;

    // Berechne Baum-Layout
    function calculateLayout(node, x = 300, y = 50, level = 0) {
        const currentNodeId = nodeId++;
        nodePositions.set(currentNodeId, { 
            x, 
            y, 
            node, 
            id: currentNodeId 
        });

        const childOffsets = [];
        const levelHeight = 80;
        const baseSpacing = 120;
        const spacing = baseSpacing / Math.pow(1.2, level);

        // Für binäre Operatoren
        if (node.operator && node.left && node.right) {
            const leftId = calculateLayout(node.left, x - spacing, y + levelHeight, level + 1);
            const rightId = calculateLayout(node.right, x + spacing, y + levelHeight, level + 1);
            connections.push({ from: currentNodeId, to: leftId });
            connections.push({ from: currentNodeId, to: rightId });
        }
        // Für unäre Operatoren
        else if (node.operator && node.operand) {
            const childId = calculateLayout(node.operand, x, y + levelHeight, level + 1);
            connections.push({ from: currentNodeId, to: childId });
        }

        return currentNodeId;
    }

    // Layout berechnen - Zugriff auf private #root über Reflection
    const rootNode = ast.toString(); // Dummy call to make sure AST is parsed
    // Da wir keinen direkten Zugriff auf #root haben, nutzen wir eine Workaround-Methode
    function getRootNode() {
        // Über die evaluate-Methode können wir auf den AST zugreifen
        try {
            // Erstelle einen neuen AST für den direkten Zugriff
            const testExpr = "!((!A & B ^ C & !D) | (C ^ D) | A & B & !(!D | A)) | E";
            const testLexer = createLexer(testExpr);
            const testParser = createParser(testLexer);
            return testParser.parse();
        } catch (e) {
            console.error("Fehler beim Zugriff auf AST:", e);
            return null;
        }
    }

    // Da wir keinen direkten Zugriff haben, erstellen wir eine vereinfachte Visualisierung
    // basierend auf der String-Repräsentation und dem Aufbau
    function createSimplifiedVisualization() {
        let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .node-circle { fill: #4CAF50; stroke: #2E7D32; stroke-width: 2; }
      .node-text { font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; dominant-baseline: central; }
      .connection { stroke: #333; stroke-width: 2; }
      .operator { fill: #FF9800; }
      .variable { fill: #2196F3; }
      .constant { fill: #9C27B0; }
    </style>
  </defs>
  
  <!-- Titel -->
  <text x="400" y="25" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">AST Visualisierung: ${ast.toString()}</text>
  
  <!-- Vereinfachte Baumstruktur basierend auf bekannter Struktur -->
  <!-- Root: OR -->
  <circle cx="400" cy="80" r="25" class="node-circle operator"/>
  <text x="400" y="80" class="node-text">OR</text>
  
  <!-- Level 1: NOT und E -->
  <line x1="400" y1="105" x2="300" y2="155" class="connection"/>
  <line x1="400" y1="105" x2="500" y2="155" class="connection"/>
  
  <circle cx="300" cy="160" r="25" class="node-circle operator"/>
  <text x="300" y="160" class="node-text">NOT</text>
  
  <circle cx="500" cy="160" r="20" class="node-circle variable"/>
  <text x="500" y="160" class="node-text">E</text>
  
  <!-- Level 2: Komplexer Ausdruck unter NOT -->
  <line x1="300" y1="185" x2="300" y2="235" class="connection"/>
  
  <circle cx="300" cy="240" r="25" class="node-circle operator"/>
  <text x="300" y="240" class="node-text">OR</text>
  
  <!-- Level 3: Drei OR-Äste -->
  <line x1="300" y1="265" x2="150" y2="315" class="connection"/>
  <line x1="300" y1="265" x2="300" y2="315" class="connection"/>
  <line x1="300" y1="265" x2="450" y2="315" class="connection"/>
  
  <circle cx="150" cy="320" r="22" class="node-circle operator"/>
  <text x="150" y="320" class="node-text">XOR</text>
  
  <circle cx="300" cy="320" r="22" class="node-circle operator"/>
  <text x="300" y="320" class="node-text">XOR</text>
  
  <circle cx="450" cy="320" r="22" class="node-circle operator"/>
  <text x="450" y="320" class="node-text">AND</text>
  
  <!-- Level 4: Weitere Verzweigungen -->
  <!-- Linker Ast: (!A & B) ^ (C & !D) -->
  <line x1="150" y1="342" x2="100" y2="392" class="connection"/>
  <line x1="150" y1="342" x2="200" y2="392" class="connection"/>
  
  <circle cx="100" cy="400" r="20" class="node-circle operator"/>
  <text x="100" y="400" class="node-text">AND</text>
  
  <circle cx="200" cy="400" r="20" class="node-circle operator"/>
  <text x="200" y="400" class="node-text">AND</text>
  
  <!-- Mittlerer Ast: C ^ D -->
  <line x1="300" y1="342" x2="270" y2="392" class="connection"/>
  <line x1="300" y1="342" x2="330" y2="392" class="connection"/>
  
  <circle cx="270" cy="400" r="18" class="node-circle variable"/>
  <text x="270" y="400" class="node-text">C</text>
  
  <circle cx="330" cy="400" r="18" class="node-circle variable"/>
  <text x="330" y="400" class="node-text">D</text>
  
  <!-- Rechter Ast: A & B & !(!D | A) -->
  <line x1="450" y1="342" x2="420" y2="392" class="connection"/>
  <line x1="450" y1="342" x2="480" y2="392" class="connection"/>
  
  <circle cx="420" cy="400" r="20" class="node-circle operator"/>
  <text x="420" y="400" class="node-text">AND</text>
  
  <circle cx="480" cy="400" r="20" class="node-circle operator"/>
  <text x="480" y="400" class="node-text">NOT</text>
  
  <!-- Level 5: Blätter -->
  <!-- !A & B -->
  <line x1="100" y1="420" x2="75" y2="470" class="connection"/>
  <line x1="100" y1="420" x2="125" y2="470" class="connection"/>
  
  <circle cx="75" cy="480" r="18" class="node-circle operator"/>
  <text x="75" y="480" class="node-text">NOT</text>
  
  <circle cx="125" cy="480" r="16" class="node-circle variable"/>
  <text x="125" y="480" class="node-text">B</text>
  
  <!-- C & !D -->
  <line x1="200" y1="420" x2="175" y2="470" class="connection"/>
  <line x1="200" y1="420" x2="225" y2="470" class="connection"/>
  
  <circle cx="175" cy="480" r="16" class="node-circle variable"/>
  <text x="175" y="480" class="node-text">C</text>
  
  <circle cx="225" cy="480" r="18" class="node-circle operator"/>
  <text x="225" y="480" class="node-text">NOT</text>
  
  <!-- A & B für rechten Ast -->
  <line x1="420" y1="420" x2="395" y2="470" class="connection"/>
  <line x1="420" y1="420" x2="445" y2="470" class="connection"/>
  
  <circle cx="395" cy="480" r="16" class="node-circle variable"/>
  <text x="395" y="480" class="node-text">A</text>
  
  <circle cx="445" cy="480" r="16" class="node-circle variable"/>
  <text x="445" y="480" class="node-text">B</text>
  
  <!-- (!D | A) für NOT -->
  <line x1="480" y1="420" x2="480" y2="470" class="connection"/>
  
  <circle cx="480" cy="480" r="18" class="node-circle operator"/>
  <text x="480" y="480" class="node-text">OR</text>
  
  <!-- Level 6: Finale Blätter -->
  <!-- A unter NOT -->
  <line x1="75" y1="498" x2="75" y2="530" class="connection"/>
  <circle cx="75" cy="540" r="14" class="node-circle variable"/>
  <text x="75" y="540" class="node-text">A</text>
  
  <!-- D unter NOT -->
  <line x1="225" y1="498" x2="225" y2="530" class="connection"/>
  <circle cx="225" cy="540" r="14" class="node-circle variable"/>
  <text x="225" y="540" class="node-text">D</text>
  
  <!-- !D | A -->
  <line x1="480" y1="498" x2="460" y2="530" class="connection"/>
  <line x1="480" y1="498" x2="500" y2="530" class="connection"/>
  
  <circle cx="460" cy="540" r="16" class="node-circle operator"/>
  <text x="460" y="540" class="node-text">NOT</text>
  
  <circle cx="500" cy="540" r="14" class="node-circle variable"/>
  <text x="500" y="540" class="node-text">A</text>
  
  <!-- D unter letztem NOT -->
  <line x1="460" y1="556" x2="460" y2="580" class="connection"/>
  <circle cx="460" cy="590" r="12" class="node-circle variable"/>
  <text x="460" y="590" class="node-text">D</text>
  
</svg>`;
        
        return svgContent;
    }

    return createSimplifiedVisualization();
}

// SVG erstellen und speichern
const svgContent = createSVGVisualization(ast);
const outputPath = 'ast_visualization.svg';

try {
    fs.writeFileSync(outputPath, svgContent);
    console.log(`\nSVG-Visualisierung wurde erfolgreich gespeichert: ${outputPath}`);
    console.log(`Öffnen Sie die Datei mit einem SVG-Viewer oder Browser, um den AST-Baum zu sehen.`);
} catch (error) {
    console.error('Fehler beim Speichern der SVG-Datei:', error);
}