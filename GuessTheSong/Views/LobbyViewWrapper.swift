//
//  LobbyViewWrapper.swift
//  GuessTheSong
//
//  Created by Evgeny Bochkarev on 12.04.25.
//

import SwiftUI

struct LobbyViewWrapper: View {
    @EnvironmentObject var roomManager: RoomManager

    var body: some View {
        if roomManager.currentRoom != nil {
            LobbyView()
                .environmentObject(roomManager)
        } else {
            VStack {
                ProgressView("Загрузка комнаты...")
                    .padding()
            }
        }
    }
}
