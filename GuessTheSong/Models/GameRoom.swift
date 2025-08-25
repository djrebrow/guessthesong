//
//  GameRoom.swift
//  GuessTheSong
//
//  Created by Evgeny Bochkarev on 12.04.25.
//

import Foundation
import FirebaseFirestore


struct GameRoom {
    let code: String
    var players: [String]
    var roles: [String: String]
    var status: String
    var lyrics: String?
    var songTitle: String?
    var artist: String?
    var language: String
    var voiceIdentifier: String?
    var scores: [String: Int]
    var roundHistory: [RoundHistoryEntry]
    
    init(
        code: String,
        players: [String],
        roles: [String: String],
        status: String,
        lyrics: String? = nil,
        songTitle: String? = nil,
        artist: String? = nil,
        language: String,
        voiceIdentifier: String? = nil,
        scores: [String: Int] = [:],
        roundHistory: [RoundHistoryEntry] = []
    ) {
        self.code = code
        self.players = players
        self.roles = roles
        self.status = status
        self.lyrics = lyrics
        self.songTitle = songTitle
        self.artist = artist
        self.language = language
        self.voiceIdentifier = voiceIdentifier
        self.scores = scores
        self.roundHistory = roundHistory
    }

    init?(snapshot: [String: Any]?) {
        guard
            let snapshot = snapshot,
            let code = snapshot["code"] as? String,
            let players = snapshot["players"] as? [String],
            let status = snapshot["status"] as? String
        else { return nil }

        self.code = code
        self.players = players
        self.roles = snapshot["roles"] as? [String: String] ?? [:]
        self.status = status
        self.lyrics = snapshot["lyrics"] as? String
        self.songTitle = snapshot["songTitle"] as? String
        self.artist = snapshot["artist"] as? String
        self.language = snapshot["language"] as? String ?? "ru-RU"
        self.voiceIdentifier = snapshot["voiceIdentifier"] as? String
        self.scores = snapshot["scores"] as? [String: Int] ?? [:]

        if let rawHistory = snapshot["roundHistory"] as? [[String: Any]] {
            self.roundHistory = rawHistory.compactMap { dict in
                guard
                    let songTitle = dict["songTitle"] as? String,
                    let artist = dict["artist"] as? String,
                    let scores = dict["scores"] as? [String: Int],
                    let timestamp = (dict["timestamp"] as? Timestamp)?.dateValue()
                else {
                    return nil
                }

                return RoundHistoryEntry(songTitle: songTitle, artist: artist, scores: scores, timestamp: timestamp)
            }
        } else {
            self.roundHistory = []
        }
    }

    func toDictionary() -> [String: Any] {
        return [
            "code": code,
            "players": players,
            "roles": roles,
            "status": status,
            "lyrics": lyrics ?? "",
            "songTitle": songTitle ?? "",
            "artist": artist ?? "",
            "language": language,
            "voiceIdentifier": voiceIdentifier ?? "",
            "scores": scores,
            "roundHistory": roundHistory.map { $0.toDictionary() }
        ]
    }
}
