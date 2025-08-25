import Foundation
import Combine

// MARK: - Multiplayer Manager
class MultiplayerManager: ObservableObject {
    @Published var isConnected = false
    @Published var connectedPlayers: [Player] = []
    @Published var gameState: GameState = .waiting
    @Published var currentRound: Round?
    
    private var cancellables = Set<AnyCancellable>()
    
    // Demo-Implementierung - in der echten App würde hier Firebase/GameKit stehen
    func connectToRoom(code: String) {
        // Simuliere Verbindung
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.isConnected = true
            self.connectedPlayers = [
                Player(id: "1", name: "Max", isHost: true),
                Player(id: "2", name: "Lisa", isHost: false),
                Player(id: "3", name: "Tom", isHost: false)
            ]
        }
    }
    
    func createRoom() -> String {
        let roomCode = String((0..<6).map { _ in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".randomElement()! })
        
        // Simuliere Raum-Erstellung
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.isConnected = true
            self.connectedPlayers = [
                Player(id: "1", name: "Du", isHost: true)
            ]
        }
        
        return roomCode
    }
    
    func startGame() {
        gameState = .playing
        currentRound = Round(
            id: UUID().uuidString,
            songTitle: "Bohemian Rhapsody",
            voice: "Anna",
            speed: 1.0,
            timeLimit: 60
        )
    }
    
    func submitGuess(_ guess: String, playerId: String) {
        // Simuliere Antwort-Einreichung
        print("Spieler \(playerId) hat geraten: \(guess)")
    }
    
    func disconnect() {
        isConnected = false
        connectedPlayers = []
        gameState = .waiting
        currentRound = nil
    }
}

// MARK: - Game State
enum GameState {
    case waiting
    case playing
    case voting
    case results
}

// MARK: - Round Model
struct Round: Identifiable {
    let id: String
    let songTitle: String
    let voice: String
    let speed: Double
    let timeLimit: Int
    var startTime: Date = Date()
    var guesses: [String: String] = [:] // playerId: guess
    var scores: [String: Int] = [:] // playerId: score
}

// MARK: - Game Events
enum GameEvent {
    case playerJoined(Player)
    case playerLeft(String) // playerId
    case gameStarted(Round)
    case guessSubmitted(String, String) // playerId, guess
    case roundEnded
    case gameEnded
}

// MARK: - Network Message
struct NetworkMessage: Codable {
    let type: String
    let data: [String: Any]
    
    enum CodingKeys: String, CodingKey {
        case type
        case data
    }
    
    init(type: String, data: [String: Any]) {
        self.type = type
        self.data = data
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        type = try container.decode(String.self, forKey: .type)
        data = [:] // Vereinfachte Implementierung
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(type, forKey: .type)
        // Vereinfachte Implementierung
    }
}