
import SwiftUI

struct LobbyView: View {
    @EnvironmentObject var roomManager: RoomManager
    @State private var navigationTag: String?
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                if let room = roomManager.currentRoom {
                    Text("Комната: \(room.code)")
                        .font(.title2)

                    Text("Игроки:")
                        .font(.headline)

                    ForEach(room.players, id: \.self) { player in
                        Text(player)
                    }

                    InviteButton(roomCode: room.code)

                    Button("Начать игру") {
                        navigationTag = "guess"
                    }
                    .padding()
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(8)

                    NavigationLink(tag: "guess", selection: $navigationTag) {
                        GuessSongView(
                            correctAnswer: room.songTitle ?? "",
                            lyrics: room.lyrics ?? "",
                            language: room.language ?? "ru-RU",
                            voiceIdentifier: room.voiceIdentifier,
                            playerName: room.players.first ?? "",
                            roomCode: room.code
                        )
                        .environmentObject(roomManager)
                    } label: {
                        EmptyView()
                    }
                } else {
                    VStack {
                        Text("⏳ Загрузка комнаты...")
                            .font(.headline)
                            .onAppear {
                                roomManager.loadRoom(code: "ABC123") { error in
                                    self.errorMessage = error?.localizedDescription
                                }
                            }

                        if let error = errorMessage {
                            Text("❌ \(error)")
                                .foregroundColor(.red)
                        }
                    }
                }
            }
            .padding()
        }
    }
}
