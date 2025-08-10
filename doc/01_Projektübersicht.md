# DT-Visualisierer - Projektübersicht

## Kurzbeschreibung
Webbasiertes Tool zur Visualisierung und Analyse digitaler Schaltfunktionen für die Digitaltechnik-Lehre am KIT. Es ermöglicht die Darstellung, Untersuchung und Konstruktion Boolescher Funktionen in verschiedenen Formen.

---

## Zielgruppe
- **Studierende der Informatik und Elektrotechnik**: Primäre Nutzergruppe für das Verständnis digitaler Schaltungsdesigns, Boolesche Algebra und Minimierungsverfahren im Rahmen von Grundlagenkursen
- **Lehrpersonal im Bereich Digitaltechnik**: Dozenten und Tutoren zur Demonstration komplexer Zusammenhänge in Vorlesungen und Übungen, sowie zur Vorbereitung interaktiver Lehrmaterialien


---

## Kernfunktionen

### Darstellungsformen
- **Wahrheitstabellen**: Vollständige tabellarische Auflistung aller Eingabe-Ausgabe-Kombinationen mit konfigurierbarer Variablenanordnung und Sortierung
- **Symmetriediagramme**: Grafische Repräsentation funktionaler Symmetrien basierend auf Permutationsgruppen zur Visualisierung von Invarianzen in der Funktionsstruktur
- **Normalformen**: Automatische Generierung disjunktiver (DNF) und konjunktiver (KNF) Normalformen mit Hervorhebung der Primterme
- **Minimalformen**: Implementierung des Quine-McCluskey-Algorithmus zur Bestimmung minimaler Schaltungsrealisierungen
- **Multiplexer-Implementierungen**: Hardware-orientierte Darstellung mit Steuer- und Dateneingängen
- **BoolBoolesche entwicklung**: Darstellung der Booleschen Entwicklung von Funktionen mit Hervorhebung der logischen Beziehungen

### Eingabe und Manipulation
- **Vordefinierte Funktionen**: Bibliothek grundlegender n-stelliger Boolescher Funktionen (AND, OR, XOR, NAND, NOR, Majority, Parity)
- **Ausdrucksparser**: Syntaxvalidierung und Interpretation benutzerdefinierter logischer Ausdrücke mit Unterstützung für Operatorpräzedenz und Klammerung
- **Interaktive Bearbeitung**: Direkte Manipulation von Wahrheitswerten durch Klick-Interface mit automatischer Propagation in alle Darstellungsformen
- **Cross-Referenzierung**: Hovering-basierte Hervorhebung korrespondierender Elemente zwischen verschiedenen Visualisierungen


---



## Projektdaten

| Parameter              | Wert                      |
|------------------------|---------------------------|
| **Version**            | 1.0.0                     |
| **Entwicklungsbeginn** | 14.07.2025                |
| **Stand**              | 10.08.2025                |
| **Autoren**            | Jan Repp, Henri Schulz    |
| **Institution**        | ITIV, KIT                 |
| **Lizenz**             | MIT                       |

## Screenshots

**Screenshot des Konfiguratiosbereichs**
![Screenshot des des Konfiguratiosbereichs](./img/controlls.png)
**Screenshot der Darstellungsformen**
![Screenshot der Darstellungsformen](./img/app-main-view.png)