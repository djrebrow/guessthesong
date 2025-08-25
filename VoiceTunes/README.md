# 🎵 VoiceTunes - Das revolutionäre Audio-Ratespiel

## Über das Spiel

**VoiceTunes** ist ein einzigartiges iOS-Spiel, bei dem Spieler Musiktitel durch Computerstimmen erraten müssen. Ein Spieler gibt einen Musiktitel ein, und eine Computerstimme liest ihn mit verschiedenen Effekten vor. Die anderen Spieler müssen den Titel erraten!

## 🎮 Spielprinzip

1. **Spieler treten einem Raum bei** oder erstellen einen neuen
2. **Der Host gibt einen Musiktitel ein** (z.B. "Bohemian Rhapsody")
3. **Der Computer liest den Titel vor** mit verschiedenen Stimmen und Effekten
4. **Die anderen Spieler raten** den Titel basierend auf der Computerstimme
5. **Punkte werden vergeben** basierend auf der Schwierigkeit und der Richtigkeit

## ✨ Einzigartige Features

### 🎤 Verschiedene Stimmen
- **Anna** (Deutsch)
- **Tom** (Amerikanisch)
- **Lisa** (Britisches Englisch)
- **Max** (Österreichisch)
- **Emma** (Australisch)
- **Pierre** (Französisch)
- **Maria** (Spanisch)
- **Giuseppe** (Italienisch)

### 🎭 Audio-Effekte
- **Normal** - Klare, verständliche Stimme
- **Echo** - Mit Echo-Effekt
- **Robot** - Roboterhafte Stimme
- **Chipmunk** - Hohe, schnelle Stimme
- **Deep** - Tiefe, langsame Stimme
- **Whisper** - Flüsternde Stimme

### 🎯 Schwierigkeitsgrade
- **Einfach** - Normale Geschwindigkeit, klare Stimme (10 Punkte)
- **Mittel** - Erhöhte Geschwindigkeit, leichte Verzerrung (25 Punkte)
- **Schwer** - Hohe Geschwindigkeit, roboterhafte Stimme (50 Punkte)
- **Extrem** - Extreme Geschwindigkeit, starke Verzerrung (100 Punkte)

## 🚀 Installation

### Voraussetzungen
- iOS 17.0 oder höher
- Xcode 15.0 oder höher
- Ein iOS-Gerät oder Simulator

### Schritte
1. **Projekt öffnen**
   ```bash
   cd VoiceTunes
   open VoiceTunes.xcodeproj
   ```

2. **Team auswählen**
   - Öffne das Projekt in Xcode
   - Wähle dein Entwickler-Team aus
   - Ändere die Bundle-ID falls nötig

3. **Auf Gerät installieren**
   - Verbinde dein iOS-Gerät
   - Wähle es als Ziel aus
   - Drücke ▶️ zum Bauen und Installieren

## 🎯 Verwendung

### Spiel starten
1. **App öffnen** und deinen Namen eingeben
2. **Neues Spiel erstellen** oder einem bestehenden beitreten
3. **Warten bis andere Spieler beitreten** (mindestens 2 Spieler)

### Als Host
1. **Musiktitel eingeben** (z.B. "Hotel California")
2. **Stimme auswählen** (z.B. "Tom")
3. **Geschwindigkeit einstellen** (0.5x bis 2.0x)
4. **"Song vorlesen lassen"** drücken
5. **"Spiel starten"** wenn alle bereit sind

### Als Spieler
1. **Dem Raum beitreten** mit dem Raumcode
2. **Dem Titel zuhören** wenn er vorgelesen wird
3. **Tipp anzeigen** falls nötig
4. **Antwort eingeben** und einreichen
5. **Ergebnis ansehen** und Punkte sammeln

## 🔧 Technische Details

### Architektur
- **SwiftUI** für die Benutzeroberfläche
- **AVFoundation** für Audio-Verarbeitung
- **Combine** für reaktive Programmierung
- **MVVM** Design Pattern

### Audio-Engine
- **Text-to-Speech** mit AVSpeechSynthesizer
- **Real-time Audio-Verarbeitung** mit AVAudioEngine
- **Verschiedene Stimmen** und Sprachen
- **Audio-Effekte** und Filter

### Multiplayer (Demo)
- **Raum-basierte Spielsessions**
- **Echtzeit-Synchronisation** (Demo-Implementierung)
- **Spieler-Verwaltung** und Host-System
- **Punktesystem** und Ranglisten

## 🎨 Benutzeroberfläche

### Design-Prinzipien
- **Modern und intuitiv** mit SwiftUI
- **Barrierefrei** für alle Spieler
- **Responsive Design** für alle iOS-Geräte
- **Dunkler Modus** Unterstützung

### Farben
- **Primär**: Blau (#007AFF)
- **Sekundär**: Lila (#5856D6)
- **Erfolg**: Grün (#34C759)
- **Warnung**: Orange (#FF9500)
- **Fehler**: Rot (#FF3B30)

## 🚧 Bekannte Einschränkungen

### Demo-Version
- **Multiplayer ist simuliert** (keine echte Netzwerk-Verbindung)
- **Audio-Effekte sind vereinfacht** (keine echten DSP-Filter)
- **Spielerdaten sind lokal** (keine Cloud-Synchronisation)

### Geplante Verbesserungen
- **Firebase Integration** für echten Multiplayer
- **Erweiterte Audio-Effekte** mit Core Audio
- **Cloud-Speicherung** für Spielerdaten
- **Push-Benachrichtigungen** für Spieler

## 🤝 Beitragen

### Entwicklung
1. **Fork das Repository**
2. **Erstelle einen Feature-Branch**
3. **Implementiere deine Änderungen**
4. **Erstelle einen Pull Request**

### Ideen
- **Neue Audio-Effekte**
- **Zusätzliche Sprachen**
- **Spielmodi**
- **UI-Verbesserungen**

## 📱 Screenshots

Das Spiel hat vier Hauptansichten:
1. **Welcome** - Spielername und Raumcode
2. **Lobby** - Spielerliste und Song-Eingabe
3. **Game** - Titel hören und raten
4. **Results** - Ergebnis und Punkte

## 🎵 Beispiel-Songs

### Pop/Rock
- Bohemian Rhapsody
- Hotel California
- Stairway to Heaven
- Imagine
- Hey Jude

### Deutsch
- 99 Luftballons
- Major Tom
- Du hast den Farbfilm vergessen
- Über den Wolken
- Ein bisschen Frieden

### International
- La Bamba
- Volare
- O sole mio
- Frère Jacques
- Happy Birthday

## 📞 Support

Bei Fragen oder Problemen:
- **GitHub Issues** für Bug-Reports
- **Discussions** für Fragen und Ideen
- **Pull Requests** für Verbesserungen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Siehe [LICENSE](LICENSE) für Details.

---

**Viel Spaß beim Spielen! 🎵🎮**