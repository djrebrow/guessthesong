//
//  InviteButton.swift
//  GuessTheSong
//
//  Created by Evgeny Bochkarev on 12.04.25.
//

import SwiftUI

struct InviteButton: View {
    let roomCode: String

    var body: some View {
        ShareLink(item: "Присоединяйся к комнате GuessTheSong! Код: \(roomCode)") {
            Label("Пригласить", systemImage: "person.crop.circle.badge.plus")
                .padding(.horizontal)
        }
    }
}
