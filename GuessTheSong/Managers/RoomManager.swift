//
//  RoomManager.swift
//  GuessTheSong
//
//  Created by Evgeny Bochkarev on 12.04.25.
//

import Foundation
import FirebaseFirestore

final class RoomManager: ObservableObject {
    @Published var currentRoom: GameRoom?

    private let db = Firestore.firestore()

    // MARK: - Создание комнаты
    func createRoom(playerName: String, language: String = "ru-RU", voiceIdentifier: String? = nil) {
        let roomCode = String(UUID().uuidString.prefix(6)).uppercased()

        let room = GameRoom(
            code: roomCode,
            players: [playerName],
            roles: [playerName: "host"],
            status: "waiting",
            lyrics: nil,
            songTitle: nil,
            artist: nil,
            language: language,
            voiceIdentifier: voiceIdentifier,
            scores: [:],
            roundHistory: []
        )

        db.collection("rooms").document(room.code).setData(room.toDictionary()) { [weak self] error in
            if let error = error {
                print("❌ Не удалось создать комнату:", error)
                return
            }
            DispatchQueue.main.async {
                self?.currentRoom = room
            }
        }
    }

    // MARK: - Вход в комнату
    func joinRoom(code: String, playerName: String) {
        let ref = db.collection("rooms").document(code)

        ref.getDocument { [weak self] snapshot, error in
            guard let self else { return }
            guard let snapshot = snapshot, snapshot.exists, let data = snapshot.data() else {
                print("❌ Комната не найдена")
                return
            }

            guard var room = GameRoom(snapshot: data) else {
                print("❌ Ошибка преобразования snapshot → GameRoom")
                return
            }

            if !room.players.contains(playerName) {
                room.players.append(playerName)
                room.roles[playerName] = "guesser"
            }

            ref.setData(room.toDictionary()) { err in
                if let err = err {
                    print("❌ Ошибка при входе в комнату:", err)
                    return
                }
                DispatchQueue.main.async {
                    self.currentRoom = room
                }
            }
        }
    }

    // MARK: - Загрузка комнаты
    func loadRoom(code: String, completion: ((Error?) -> Void)? = nil) {
        db.collection("rooms").document(code).getDocument { [weak self] snapshot, error in
            guard let self else { return }
            guard let snapshot = snapshot, snapshot.exists, let data = snapshot.data() else {
                completion?(error ?? NSError(domain: "Firestore", code: -1, userInfo: [NSLocalizedDescriptionKey: "Комната не найдена"]))
                return
            }

            guard let room = GameRoom(snapshot: data) else {
                completion?(NSError(domain: "Room", code: 400, userInfo: [NSLocalizedDescriptionKey: "Ошибка декодирования комнаты"]))
                return
            }

            DispatchQueue.main.async {
                self.currentRoom = room
                completion?(nil)
            }
        }
    }

    // MARK: - Сохранение истории
    func saveRoundToHistory(roomCode: String) {
        let ref = db.collection("rooms").document(roomCode)

        ref.getDocument { snapshot, _ in
            guard let snapshot = snapshot, snapshot.exists, let data = snapshot.data() else {
                print("❌ Комната не найдена")
                return
            }

            guard var room = GameRoom(snapshot: data) else {
                print("❌ Ошибка преобразования snapshot → GameRoom")
                return
            }

            let round = RoundHistoryEntry(
                songTitle: room.songTitle ?? "Без названия",
                artist: room.artist ?? "Без исполнителя",
                scores: room.scores,
                timestamp: Date()
            )

            var history = room.roundHistory
            history.append(round)
            room.roundHistory = history

            ref.updateData(["roundHistory": history.map { $0.toDictionary() }]) { error in
                if let error = error {
                    print("❌ Ошибка при сохранении истории:", error)
                } else {
                    print("✅ История успешно сохранена")
                }
            }
        }
    }
}
