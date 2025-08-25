import SwiftUI
import AVFoundation

// MARK: - Advanced Game View
struct AdvancedGameView: View {
    @ObservedObject var gameManager: GameManager
    @ObservedObject var audioEngine: AudioEngine
    @Binding var currentView: GameView
    
    @State private var guess = ""
    @State private var timeRemaining = 60
    @State private var showingHint = false
    @State private var selectedDifficulty: GameDifficulty = .medium
    @State private var showingSettings = false
    @State private var attempts = 0
    @State private var maxAttempts = 3
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        ScrollView {
            VStack(spacing: 25) {
                // Header mit Timer und Schwierigkeit
                VStack(spacing: 15) {
                    HStack {
                        // Timer
                        HStack {
                            Image(systemName: "clock.fill")
                                .foregroundColor(.orange)
                            Text("Zeit: \(timeRemaining)s")
                                .font(.title2)
                                .fontWeight(.bold)
                        }
                        
                        Spacer()
                        
                        // Schwierigkeitsgrad
                        Button(action: {
                            showingSettings.toggle()
                        }) {
                            HStack {
                                Image(systemName: "gear")
                                Text(selectedDifficulty.rawValue)
                            }
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(difficultyColor)
                            .cornerRadius(20)
                        }
                    }
                    
                    // Versuche
                    HStack {
                        Text("Versuche: \(attempts)/\(maxAttempts)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        Text("Punkte: \(selectedDifficulty.points)")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.blue)
                    }
                }
                .padding()
                .background(Color.white.opacity(0.1))
                .cornerRadius(12)
                
                // Spielanweisung
                VStack(spacing: 15) {
                    Text("🎵 Höre genau zu! 🎵")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                    
                    Text("Der Computer liest einen Musiktitel vor. Rate den Titel!")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    
                    // Schwierigkeitsbeschreibung
                    Text(selectedDifficulty.description)
                        .font(.caption)
                        .foregroundColor(.orange)
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                        .background(Color.orange.opacity(0.2))
                        .cornerRadius(8)
                }
                
                // Audio-Controls
                VStack(spacing: 15) {
                    // Haupt-Play-Button
                    Button(action: {
                        audioEngine.speakWithDifficulty(
                            gameManager.currentSong,
                            difficulty: selectedDifficulty
                        )
                    }) {
                        HStack {
                            Image(systemName: audioEngine.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                                .font(.title)
                            Text(audioEngine.isPlaying ? "Pausieren" : "Abspielen")
                                .font(.headline)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(audioEngine.isPlaying ? Color.orange : Color.blue)
                        .cornerRadius(12)
                    }
                    
                    // Erweiterte Audio-Controls
                    HStack(spacing: 15) {
                        // Stimme ändern
                        Button(action: {
                            cycleVoice()
                        }) {
                            VStack {
                                Image(systemName: "person.circle")
                                    .font(.title2)
                                Text(audioEngine.currentVoice)
                                    .font(.caption)
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.purple)
                            .cornerRadius(12)
                        }
                        
                        // Effekt ändern
                        Button(action: {
                            cycleEffect()
                        }) {
                            VStack {
                                Image(systemName: "waveform")
                                    .font(.title2)
                                Text(audioEngine.selectedEffect)
                                    .font(.caption)
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .cornerRadius(12)
                        }
                    }
                    
                    // Zufällige Effekte
                    Button(action: {
                        audioEngine.speakWithRandomEffects(gameManager.currentSong)
                    }) {
                        HStack {
                            Image(systemName: "dice")
                            Text("Zufällige Effekte")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.indigo)
                        .cornerRadius(12)
                    }
                }
                
                // Tipp-Sektion
                VStack(spacing: 15) {
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
                    
                    if showingHint {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("💡 Tipp:")
                                .font(.headline)
                                .foregroundColor(.orange)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text("• Schwierigkeit: \(selectedDifficulty.rawValue)")
                                Text("• Stimme: \(audioEngine.currentVoice)")
                                Text("• Effekt: \(audioEngine.selectedEffect)")
                                Text("• Geschwindigkeit: \(audioEngine.currentSpeed, specifier: "%.1f")x")
                            }
                            .font(.caption)
                            .foregroundColor(.secondary)
                        }
                        .padding()
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(12)
                    }
                }
                
                // Antwort eingeben
                VStack(alignment: .leading, spacing: 8) {
                    Text("Deine Antwort")
                        .font(.headline)
                    
                    TextField("Musiktitel eingeben", text: $guess)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .font(.title3)
                        .onSubmit {
                            submitGuess()
                        }
                    
                    HStack {
                        Button("Antwort einreichen") {
                            submitGuess()
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .cornerRadius(12)
                        .disabled(guess.isEmpty || attempts >= maxAttempts)
                        
                        Button("Überspringen") {
                            skipRound()
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.gray)
                        .cornerRadius(12)
                    }
                }
                
                // Fortschrittsbalken
                VStack(spacing: 8) {
                    HStack {
                        Text("Fortschritt")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(Int((Double(attempts) / Double(maxAttempts)) * 100))%")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                    }
                    
                    ProgressView(value: Double(attempts), total: Double(maxAttempts))
                        .progressViewStyle(LinearProgressViewStyle(tint: progressColor))
                }
                
                Spacer()
            }
            .padding()
        }
        .navigationBarHidden(true)
        .onReceive(timer) { _ in
            if timeRemaining > 0 {
                timeRemaining -= 1
            } else {
                timeUp()
            }
        }
        .sheet(isPresented: $showingSettings) {
            DifficultySettingsView(
                selectedDifficulty: $selectedDifficulty,
                audioEngine: audioEngine
            )
        }
    }
    
    // MARK: - Computed Properties
    private var difficultyColor: Color {
        switch selectedDifficulty {
        case .easy: return .green
        case .medium: return .blue
        case .hard: return .orange
        case .extreme: return .red
        }
    }
    
    private var progressColor: Color {
        let progress = Double(attempts) / Double(maxAttempts)
        if progress < 0.5 { return .green }
        if progress < 0.8 { return .orange }
        return .red
    }
    
    // MARK: - Actions
    private func submitGuess() {
        guard !guess.isEmpty && attempts < maxAttempts else { return }
        
        attempts += 1
        gameManager.submitGuess(guess)
        
        if gameManager.isCorrect || attempts >= maxAttempts {
            currentView = .results
        } else {
            // Falsche Antwort - weiter versuchen
            guess = ""
            // Zeige Feedback
            withAnimation {
                // Hier könnte ein Haptic Feedback oder visueller Effekt stehen
            }
        }
    }
    
    private func skipRound() {
        attempts = maxAttempts
        gameManager.submitGuess("")
        currentView = .results
    }
    
    private func timeUp() {
        attempts = maxAttempts
        gameManager.submitGuess("")
        currentView = .results
    }
    
    private func cycleVoice() {
        let voices = audioEngine.getAvailableVoices()
        if let currentIndex = voices.firstIndex(of: audioEngine.currentVoice) {
            let nextIndex = (currentIndex + 1) % voices.count
            audioEngine.currentVoice = voices[nextIndex]
        }
    }
    
    private func cycleEffect() {
        let effects = audioEngine.getAvailableEffects()
        if let currentIndex = effects.firstIndex(of: audioEngine.selectedEffect) {
            let nextIndex = (currentIndex + 1) % effects.count
            audioEngine.selectedEffect = effects[nextIndex]
        }
    }
}

// MARK: - Difficulty Settings View
struct DifficultySettingsView: View {
    @Binding var selectedDifficulty: GameDifficulty
    @ObservedObject var audioEngine: AudioEngine
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Spieleinstellungen")
                    .font(.title)
                    .fontWeight(.bold)
                
                // Schwierigkeitsgrade
                VStack(alignment: .leading, spacing: 15) {
                    Text("Schwierigkeitsgrad")
                        .font(.headline)
                    
                    ForEach(GameDifficulty.allCases, id: \.self) { difficulty in
                        Button(action: {
                            selectedDifficulty = difficulty
                        }) {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack {
                                        Text(difficulty.rawValue)
                                            .font(.headline)
                                            .foregroundColor(.primary)
                                        
                                        Spacer()
                                        
                                        Text("\(difficulty.points) Punkte")
                                            .font(.caption)
                                            .foregroundColor(.blue)
                                            .fontWeight(.semibold)
                                    }
                                    
                                    Text(difficulty.description)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .multilineTextAlignment(.leading)
                                }
                                
                                Spacer()
                                
                                if selectedDifficulty == difficulty {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.green)
                                        .font(.title2)
                                }
                            }
                            .padding()
                            .background(selectedDifficulty == difficulty ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(selectedDifficulty == difficulty ? Color.blue : Color.clear, lineWidth: 2)
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                
                // Audio-Einstellungen
                VStack(alignment: .leading, spacing: 15) {
                    Text("Audio-Einstellungen")
                        .font(.headline)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Stimme: \(audioEngine.currentVoice)")
                        Text("Effekt: \(audioEngine.selectedEffect)")
                        Text("Geschwindigkeit: \(audioEngine.currentSpeed, specifier: "%.1f")x")
                    }
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(8)
                }
                
                Spacer()
                
                Button("Fertig") {
                    dismiss()
                }
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .cornerRadius(12)
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(trailing: Button("Abbrechen") {
                dismiss()
            })
        }
    }
}

// MARK: - Preview
struct AdvancedGameView_Previews: PreviewProvider {
    static var previews: some View {
        AdvancedGameView(
            gameManager: GameManager(),
            audioEngine: AudioEngine(),
            currentView: .constant(.game)
        )
    }
}