//
//  GuessSongView.swift
//  GuessTheSong
//
//  Created by Evgeny Bochkarev on 12.04.25.
//

import SwiftUI

struct GuessSongView: View {
    @EnvironmentObject var roomManager: RoomManager

    let correctAnswer: String
    let lyrics: String
    let language: String
    let voiceIdentifier: String?
    let playerName: String
    let roomCode: String

    @State private var guess = ""
    @State private var score = 100
    @State private var showScore = false
    @State private var timer: Timer?

    var body: some View {
        VStack(spacing: 20) {
            Text("Угадайте песню")
                .font(.title)

            TextField("Ваш ответ", text: $guess)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding(.horizontal)

            Button("Проверить") {
                checkGuess()
            }
            .buttonStyle(.borderedProminent)

            Text("Очки: \(score)")
                .font(.headline)

            NavigationLink(
                destination: ScoreboardView(roomCode: roomCode)
                    .environmentObject(roomManager),
                isActive: $showScore
            ) {
                EmptyView()
            }
        }
        .onAppear {
            SpeechManager.shared.speak(lyrics, language: language, voiceIdentifier: voiceIdentifier)
            startTimer()
        }
        .onDisappear {
            timer?.invalidate()
            SpeechManager.shared.stop()
        }
        .padding()
    }

    func checkGuess() {
        let trimmedGuess = guess.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedAnswer = correctAnswer.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)

        if trimmedGuess == trimmedAnswer {
            timer?.invalidate()
            roomManager.submitScore(toRoom: roomCode, playerName: playerName, score: score)
            roomManager.finishGame(roomCode: roomCode)
            roomManager.saveRoundToHistory(roomCode: roomCode)
            showScore = true
        }
    }

    func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { _ in
            if score > 0 {
                score -= 2
            }
        }
    }
}
