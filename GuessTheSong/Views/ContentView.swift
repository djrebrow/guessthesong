
import SwiftUI

struct ContentView: View {
    @StateObject var roomManager = RoomManager()
    @State private var playerName: String = ""
    @State private var roomCode: String = ""
    @State private var navigateToLobby = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text("🎵 Guess The Song")
                    .font(.largeTitle)
                    .bold()

                TextField("Ваше имя", text: $playerName)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal)

                Button("Создать комнату") {
                    roomManager.createRoom(playerName: playerName)
                    navigateToLobby = true
                }
                .disabled(playerName.isEmpty)
                .buttonStyle(.borderedProminent)

                Divider()

                TextField("Код комнаты", text: $roomCode)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal)

                Button("Присоединиться") {
                    roomManager.joinRoom(code: roomCode, playerName: playerName)
                    navigateToLobby = true
                }
                .disabled(playerName.isEmpty || roomCode.isEmpty)
                .buttonStyle(.bordered)

                NavigationLink(destination: LobbyViewWrapper()
                    .environmentObject(roomManager),
                    isActive: $navigateToLobby
                ) {
                    EmptyView()
                }
            }
            .padding()
        }
    }
}
