import AVFoundation
import Speech

// MARK: - Audio Engine
class AudioEngine: ObservableObject {
    @Published var isPlaying = false
    @Published var currentVoice = "Anna"
    @Published var currentSpeed = 1.0
    @Published var currentPitch = 1.0
    @Published var currentVolume = 1.0
    
    private var synthesizer = AVSpeechSynthesizer()
    private var audioEngine = AVAudioEngine()
    private var playerNode = AVAudioPlayerNode()
    private var audioFile: AVAudioFile?
    
    // Verfügbare Stimmen
    let availableVoices = [
        "Anna" : "de-DE",
        "Tom" : "en-US",
        "Lisa" : "en-GB",
        "Max" : "de-AT",
        "Emma" : "en-AU",
        "Pierre" : "fr-FR",
        "Maria" : "es-ES",
        "Giuseppe" : "it-IT"
    ]
    
    // Audio-Effekte
    let audioEffects = [
        "Normal" : AudioEffect.none,
        "Echo" : AudioEffect.echo,
        "Robot" : AudioEffect.robot,
        "Chipmunk" : AudioEffect.chipmunk,
        "Deep" : AudioEffect.deep,
        "Whisper" : AudioEffect.whisper
    ]
    
    @Published var selectedEffect = "Normal"
    
    init() {
        setupAudioEngine()
        synthesizer.delegate = self
    }
    
    private func setupAudioEngine() {
        audioEngine.attach(playerNode)
        
        // Audio-Format konfigurieren
        let format = audioEngine.mainMixerNode.outputFormat(forBus: 0)
        audioEngine.connect(playerNode, to: audioEngine.mainMixerNode, format: format)
        
        do {
            try audioEngine.start()
        } catch {
            print("Fehler beim Starten der Audio-Engine: \(error)")
        }
    }
    
    // MARK: - Text-to-Speech mit Effekten
    func speakWithEffects(_ text: String, voice: String, speed: Double, pitch: Double, volume: Double, effect: String) {
        let utterance = AVSpeechUtterance(string: text)
        
        // Stimme auswählen
        if let voiceCode = availableVoices[voice] {
            if let selectedVoice = AVSpeechSynthesisVoice(language: voiceCode) {
                utterance.voice = selectedVoice
            }
        }
        
        // Grundparameter setzen
        utterance.rate = Float(speed * 0.5)
        utterance.pitchMultiplier = Float(pitch)
        utterance.volume = Float(volume)
        
        // Effekte anwenden
        applyAudioEffect(utterance, effect: effect)
        
        // Sprechen
        synthesizer.speak(utterance)
        isPlaying = true
    }
    
    // MARK: - Audio-Effekte anwenden
    private func applyAudioEffect(_ utterance: AVSpeechUtterance, effect: String) {
        guard let audioEffect = audioEffects[effect] else { return }
        
        switch audioEffect {
        case .none:
            break
        case .echo:
            utterance.pitchMultiplier *= 0.8
            utterance.rate *= 0.9
        case .robot:
            utterance.pitchMultiplier *= 0.5
            utterance.rate *= 0.7
        case .chipmunk:
            utterance.pitchMultiplier *= 2.0
            utterance.rate *= 1.2
        case .deep:
            utterance.pitchMultiplier *= 0.3
            utterance.rate *= 0.8
        case .whisper:
            utterance.volume *= 0.3
            utterance.pitchMultiplier *= 0.7
        }
    }
    
    // MARK: - Erweiterte TTS-Funktionen
    func speakWithRandomEffects(_ text: String) {
        let randomVoice = availableVoices.keys.randomElement() ?? "Anna"
        let randomSpeed = Double.random(in: 0.5...2.0)
        let randomPitch = Double.random(in: 0.5...2.0)
        let randomEffect = audioEffects.keys.randomElement() ?? "Normal"
        
        speakWithEffects(text, voice: randomVoice, speed: randomSpeed, pitch: randomPitch, volume: 1.0, effect: randomEffect)
    }
    
    func speakWithDifficulty(_ text: String, difficulty: GameDifficulty) {
        var speed: Double
        var pitch: Double
        var effect: String
        
        switch difficulty {
        case .easy:
            speed = 0.8
            pitch = 1.0
            effect = "Normal"
        case .medium:
            speed = 1.2
            pitch = 0.8
            effect = "Echo"
        case .hard:
            speed = 1.8
            pitch = 0.5
            effect = "Robot"
        case .extreme:
            speed = 2.5
            pitch = 0.3
            effect = "Deep"
        }
        
        speakWithEffects(text, voice: currentVoice, speed: speed, pitch: pitch, volume: currentVolume, effect: effect)
    }
    
    // MARK: - Audio aufnehmen und abspielen
    func recordAudio() {
        // Implementierung für Audio-Aufnahme
        print("Audio-Aufnahme gestartet")
    }
    
    func stopRecording() {
        // Implementierung für Audio-Aufnahme stoppen
        print("Audio-Aufnahme gestoppt")
    }
    
    // MARK: - Audio abspielen
    func playAudioFile(_ url: URL) {
        do {
            audioFile = try AVAudioFile(forReading: url)
            let buffer = AVAudioPCMBuffer(pcmFormat: audioFile!.processingFormat, frameCapacity: AVAudioFrameCount(audioFile!.length))
            
            try audioFile!.read(into: buffer!)
            
            playerNode.scheduleBuffer(buffer!, at: nil, options: [], completionHandler: nil)
            playerNode.play()
            isPlaying = true
            
        } catch {
            print("Fehler beim Abspielen der Audiodatei: \(error)")
        }
    }
    
    func stopAudio() {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        
        if playerNode.isPlaying {
            playerNode.stop()
        }
        
        isPlaying = false
    }
    
    // MARK: - Verfügbare Stimmen abrufen
    func getAvailableVoices() -> [String] {
        return Array(availableVoices.keys)
    }
    
    // MARK: - Verfügbare Effekte abrufen
    func getAvailableEffects() -> [String] {
        return Array(audioEffects.keys)
    }
}

// MARK: - Audio Effekte
enum AudioEffect {
    case none
    case echo
    case robot
    case chipmunk
    case deep
    case whisper
}

// MARK: - Spielschwierigkeit
enum GameDifficulty: String, CaseIterable {
    case easy = "Einfach"
    case medium = "Mittel"
    case hard = "Schwer"
    case extreme = "Extrem"
    
    var description: String {
        switch self {
        case .easy:
            return "Normale Geschwindigkeit, klare Stimme"
        case .medium:
            return "Erhöhte Geschwindigkeit, leichte Verzerrung"
        case .hard:
            return "Hohe Geschwindigkeit, roboterhafte Stimme"
        case .extreme:
            return "Extreme Geschwindigkeit, starke Verzerrung"
        }
    }
    
    var points: Int {
        switch self {
        case .easy: return 10
        case .medium: return 25
        case .hard: return 50
        case .extreme: return 100
        }
    }
}

// MARK: - AVSpeechSynthesizerDelegate
extension AudioEngine: AVSpeechSynthesizerDelegate {
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        DispatchQueue.main.async {
            self.isPlaying = false
        }
    }
    
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        DispatchQueue.main.async {
            self.isPlaying = false
        }
    }
    
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didPause utterance: AVSpeechUtterance) {
        DispatchQueue.main.async {
            self.isPlaying = false
        }
    }
}