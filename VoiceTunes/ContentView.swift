import SwiftUI
import AVFoundation

struct ContentView: View {
    @StateObject private var gameManager = GameManager()
    @State private var currentView: GameView = .welcome
    
    var body: some View {
        NavigationView {
            ZStack {
                // Hintergrund
                LinearGradient(
                    gradient: Gradient(colors: [Color.blue.opacity(0.3), Color.purple.opacity(0.3)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                // Hauptinhalt
                switch currentView {
                case .welcome:
                    WelcomeView(currentView: $currentView)
                case .lobby:
                    LobbyView(gameManager: gameManager, currentView: $currentView)
                case .game:
                    GameView(gameManager: gameManager, currentView: $currentView)
                case .results:
                    ResultsView(gameManager: gameManager, currentView: $currentView)
                }
            }
        }
        .environmentObject(gameManager)
    }
}

// MARK: - Game Views
enum GameView {
    case welcome, lobby, game, results
}

// MARK: - Welcome View
struct WelcomeView: View {
    @Binding var currentView: GameView
    @State private var playerName = ""
    @State private var roomCode = ""
    @State private var isHost = false
    
    var body: some View {
        VStack(spacing: 30) {
            // Titel
            VStack(spacing: 10) {
                Image(systemName: "music.note.list")
                    .font(.system(size: 80))
                    .foregroundColor(.blue)
                
                Text("VoiceTunes")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Text("Rate Musiktitel durch Computerstimmen!")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            // Spieler-Name
            VStack(alignment: .leading, spacing: 8) {
                Text("Dein Name")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                TextField("Spielername eingeben", text: $playerName)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .font(.title3)
            }
            
            // Spielmodus
            VStack(spacing: 20) {
                Button(action: {
                    isHost = true
                    if !playerName.isEmpty {
                        currentView = .lobby
                    }
                }) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                        Text("Neues Spiel erstellen")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
                }
                .disabled(playerName.isEmpty)
                
                VStack(spacing: 10) {
                    Text("oder")
                        .foregroundColor(.secondary)
                    
                    HStack {
                        TextField("Raumcode eingeben", text: $roomCode)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .font(.title3)
                        
                        Button(action: {
                            if !playerName.isEmpty && !roomCode.isEmpty {
                                currentView = .lobby
                            }
                        }) {
                            Text("Beitreten")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 12)
                                .background(Color.green)
                                .cornerRadius(8)
                        }
                        .disabled(playerName.isEmpty || roomCode.isEmpty)
                    }
                }
            }
            
            Spacer()
        }
        .padding()
        .navigationBarHidden(true)
    }
}

// MARK: - Lobby View
struct LobbyView: View {
    @ObservedObject var gameManager: GameManager
    @Binding var currentView: GameView
    @State private var songTitle = ""
    @State private var selectedVoice = 0
    @State private var selectedSpeed = 1.0
    
    let voices = ["Anna", "Tom", "Lisa", "Max", "Emma"]
    
    var body: some View {
        VStack(spacing: 20) {
            // Header
            HStack {
                VStack(alignment: .leading) {
                    Text("Raum: \(gameManager.roomCode)")
                        .font(.headline)
                    Text("Spieler: \(gameManager.players.count)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button("Spiel verlassen") {
                    currentView = .welcome
                }
                .foregroundColor(.red)
            }
            .padding()
            .background(Color.white.opacity(0.1))
            .cornerRadius(12)
            
            // Spielerliste
            VStack(alignment: .leading, spacing: 10) {
                Text("Spieler im Raum")
                    .font(.headline)
                
                ForEach(gameManager.players, id: \.id) { player in
                    HStack {
                        Image(systemName: "person.circle.fill")
                            .foregroundColor(.blue)
                        Text(player.name)
                        if player.isHost {
                            Text("(Host)")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                        Spacer()
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.1))
                    .cornerRadius(8)
                }
            }
            
            // Song-Eingabe (nur für Host)
            if gameManager.isHost {
                VStack(spacing: 15) {
                    Text("Musiktitel eingeben")
                        .font(.headline)
                    
                    TextField("z.B. Bohemian Rhapsody", text: $songTitle)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .font(.title3)
                    
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Stimme")
                            Picker("Stimme", selection: $selectedVoice) {
                                ForEach(0..<voices.count, id: \.self) { index in
                                    Text(voices[index]).tag(index)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .leading) {
                            Text("Geschwindigkeit")
                            Slider(value: $selectedSpeed, in: 0.5...2.0, step: 0.1)
                            Text("\(selectedSpeed, specifier: "%.1f")x")
                                .font(.caption)
                        }
                    }
                    
                    Button("Song vorlesen lassen") {
                        gameManager.speakSong(songTitle, voice: voices[selectedVoice], speed: selectedSpeed)
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .cornerRadius(12)
                    .disabled(songTitle.isEmpty)
                }
                .padding()
                .background(Color.white.opacity(0.1))
                .cornerRadius(12)
            }
            
            // Spiel starten
            if gameManager.isHost && gameManager.players.count >= 2 {
                Button("Spiel starten") {
                    currentView = .game
                }
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .cornerRadius(12)
            }
            
            Spacer()
        }
        .padding()
        .navigationBarHidden(true)
    }
}

// MARK: - Game View
struct GameView: View {
    @ObservedObject var gameManager: GameManager
    @Binding var currentView: GameView
    @State private var guess = ""
    @State private var timeRemaining = 60
    @State private var showingHint = false
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        VStack(spacing: 25) {
            // Timer
            HStack {
                Image(systemName: "clock.fill")
                    .foregroundColor(.orange)
                Text("Zeit: \(timeRemaining)s")
                    .font(.title2)
                    .fontWeight(.bold)
            }
            .padding()
            .background(Color.white.opacity(0.1))
            .cornerRadius(12)
            
            // Anweisung
            VStack(spacing: 15) {
                Text("🎵 Höre genau zu! 🎵")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
                
                Text("Der Computer liest einen Musiktitel vor. Rate den Titel!")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            // Audio-Controls
            VStack(spacing: 15) {
                Button(action: {
                    gameManager.speakSong(gameManager.currentSong, voice: gameManager.currentVoice, speed: gameManager.currentSpeed)
                }) {
                    HStack {
                        Image(systemName: "play.circle.fill")
                        Text("Nochmal abspielen")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
                }
                
                Button(action: {
                    showingHint.toggle()
                }) {
                    HStack {
                        Image(systemName: "lightbulb.fill")
                        Text("Tipp anzeigen")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange)
                    .cornerRadius(12)
                }
            }
            
            // Tipp
            if showingHint {
                VStack(alignment: .leading, spacing: 8) {
                    Text("💡 Tipp:")
                        .font(.headline)
                        .foregroundColor(.orange)
                    Text("Der Titel wurde \(gameManager.currentSpeed, specifier: "%.1f")x so schnell vorgelesen")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color.white.opacity(0.1))
                .cornerRadius(12)
            }
            
            // Antwort eingeben
            VStack(alignment: .leading, spacing: 8) {
                Text("Deine Antwort")
                    .font(.headline)
                
                TextField("Musiktitel eingeben", text: $guess)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .font(.title3)
                
                Button("Antwort einreichen") {
                    gameManager.submitGuess(guess)
                    currentView = .results
                }
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.green)
                .cornerRadius(12)
                .disabled(guess.isEmpty)
            }
            
            Spacer()
        }
        .padding()
        .navigationBarHidden(true)
        .onReceive(timer) { _ in
            if timeRemaining > 0 {
                timeRemaining -= 1
            } else {
                gameManager.submitGuess("")
                currentView = .results
            }
        }
    }
}

// MARK: - Results View
struct ResultsView: View {
    @ObservedObject var gameManager: GameManager
    @Binding var currentView: GameView
    
    var body: some View {
        VStack(spacing: 25) {
            // Ergebnis
            VStack(spacing: 15) {
                Image(systemName: gameManager.isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(gameManager.isCorrect ? .green : .red)
                
                Text(gameManager.isCorrect ? "Richtig! 🎉" : "Leider falsch 😔")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(gameManager.isCorrect ? .green : .red)
                
                Text("Der Titel war: \(gameManager.currentSong)")
                    .font(.title2)
                    .foregroundColor(.primary)
            }
            
            // Punkte
            VStack(spacing: 10) {
                Text("Deine Punkte")
                    .font(.headline)
                
                Text("\(gameManager.playerScore)")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.blue)
            }
            
            // Rangliste
            VStack(alignment: .leading, spacing: 10) {
                Text("Rangliste")
                    .font(.headline)
                
                ForEach(gameManager.leaderboard.sorted(by: { $0.value > $1.value }), id: \.key) { player in
                    HStack {
                        Text(player.key)
                        Spacer()
                        Text("\(player.value) Punkte")
                            .fontWeight(.semibold)
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.1))
                    .cornerRadius(8)
                }
            }
            
            // Weiterspielen
            VStack(spacing: 15) {
                Button("Nächste Runde") {
                    currentView = .lobby
                }
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .cornerRadius(12)
                
                Button("Neues Spiel") {
                    currentView = .welcome
                }
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.gray)
                .cornerRadius(12)
            }
            
            Spacer()
        }
        .padding()
        .navigationBarHidden(true)
    }
}

// MARK: - Game Manager
class GameManager: ObservableObject {
    @Published var players: [Player] = []
    @Published var roomCode = "ABC123"
    @Published var isHost = false
    @Published var currentSong = "Bohemian Rhapsody"
    @Published var currentVoice = "Anna"
    @Published var currentSpeed = 1.0
    @Published var isCorrect = false
    @Published var playerScore = 0
    @Published var leaderboard: [String: Int] = [:]
    
    private var synthesizer = AVSpeechSynthesizer()
    
    init() {
        // Demo-Daten
        players = [
            Player(id: "1", name: "Max", isHost: true),
            Player(id: "2", name: "Lisa", isHost: false)
        ]
        isHost = true
        leaderboard = ["Max": 150, "Lisa": 120]
        playerScore = 150
    }
    
    func speakSong(_ title: String, voice: String, speed: Double) {
        let utterance = AVSpeechUtterance(string: title)
        
        // Stimme auswählen
        let voices = AVSpeechSynthesisVoice.speechVoices()
        if let selectedVoice = voices.first(where: { $0.name.contains(voice) }) {
            utterance.voice = selectedVoice
        }
        
        utterance.rate = Float(speed * 0.5) // Geschwindigkeit anpassen
        utterance.pitchMultiplier = 1.0
        utterance.volume = 1.0
        
        synthesizer.speak(utterance)
    }
    
    func submitGuess(_ guess: String) {
        // Einfache Überprüfung (in der echten App würde hier eine KI-basierte Überprüfung stehen)
        let normalizedGuess = guess.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedSong = currentSong.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        
        isCorrect = normalizedGuess.contains(normalizedSong) || normalizedSong.contains(normalizedGuess)
        
        if isCorrect {
            playerScore += 50
        }
    }
}

// MARK: - Player Model
struct Player: Identifiable {
    let id: String
    let name: String
    let isHost: Bool
}

// MARK: - Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}