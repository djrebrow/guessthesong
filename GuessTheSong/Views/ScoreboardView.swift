//
//  ScoreboardView.swift
//  GuessTheSong
//
//  Created by Evgeny Bochkarev on 12.04.25.
//

import SwiftUI

struct ScoreboardView: View {
    @EnvironmentObject var roomManager: RoomManager
    let roomCode: String

    @State private var navigateToNextRound = false
    @State private var navigateToStart = false

    var body: some View {
        VStack(spacing: 20) {
            Text("🏆 Таблица очков")
                .font(.largeTitle)

            if let scores = roomManager.currentRoom?.scores {
                ForEach(scores.sorted(by: { $0.value > $1.value }), id: \.key) { player, score in
                    Text("\(player): \(score) очков")
                        .font(.headline)
                }
            } else {
                Text("Нет данных")
            }

            Button("Следующий раунд") {
                navigateToNextRound = true
            }
            .buttonStyle(.borderedProminent)

            Button("Новая игра") {
                roomManager.resetRoomCompletely(forRoom: roomCode)
                navigateToStart = true
            }

            NavigationLink(destination: SelectSongView().environmentObject(roomManager), isActive: $navigateToNextRound) {
                EmptyView()
            }

            NavigationLink(destination: ContentView(), isActive: $navigateToStart) {
                EmptyView()
            }
        }
        .padding()
    }
}
