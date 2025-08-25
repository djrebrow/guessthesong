//
//  SelectSongView.swift
//  GuessTheSong
//
//  Created by Evgeny Bochkarev on 12.04.25.
//

import SwiftUI
import FirebaseFirestore

struct SelectSongView: View {
    @EnvironmentObject var roomManager: RoomManager
    @State private var artist: String = ""
    @State private var title: String = ""
    @State private var selectedLanguage = "ru-RU"
    @State private var selectedVoice: String?
    @State private var navigateToGame = false
    @State private var isLoading = false
    @State private var error: String?

    var body: some View {
        VStack(spacing: 20) {
            Text("Выберите песню")
                .font(.title2)

            TextField("Исполнитель", text: $artist)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding(.horizontal)

            TextField("Название песни", text: $title)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding(.horizontal)

            Picker("Язык", selection: $selectedLanguage) {
                Text("🇷🇺 Русский").tag("ru-RU")
                Text("🇬🇧 Английский").tag("en-US")
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding(.horizontal)

            Picker("Голос", selection: $selectedVoice) {
                ForEach(SpeechManager.shared.availableVoices(for: selectedLanguage), id: \.identifier) { voice in
                    Text(voice.name).tag(voice.identifier)
                }
            }
            .pickerStyle(WheelPickerStyle())
            .frame(height: 100)

            if isLoading {
                ProgressView()
            }

            if let error {
                Text("❌ \(error)").foregroundColor(.red)
            }

            Button("Загрузить и начать") {
                isLoading = true
                error = nil

                LyricsService.fetchLyrics(artist: artist, title: title) { lyrics in
                    DispatchQueue.main.async {
                        isLoading = false

                        guard let lyrics else {
                            error = "Текст не найден"
                            return
                        }

                        if let room = roomManager.currentRoom {
                            let ref = Firestore.firestore().collection("rooms").document(room.code)
                            ref.updateData([
                                "lyrics": lyrics,
                                "songTitle": title,
                                "artist": artist,
                                "language": selectedLanguage,
                                "voiceIdentifier": selectedVoice ?? "",
                                "status": "inProgress"
                            ])
                            navigateToGame = true
                        }
                    }
                }
            }
            .disabled(artist.isEmpty || title.isEmpty)
            .buttonStyle(.borderedProminent)

            NavigationLink(
                destination: GuessSongView(
                    correctAnswer: title,
                    lyrics: "", // текст не должен отображаться на экране
                    language: selectedLanguage,
                    voiceIdentifier: selectedVoice,
                    playerName: roomManager.currentRoom?.players.first ?? "",
                    roomCode: roomManager.currentRoom?.code ?? ""
                )
                .environmentObject(roomManager),
                isActive: $navigateToGame
            ) {
                EmptyView()
            }
        }
        .padding()
    }
}
