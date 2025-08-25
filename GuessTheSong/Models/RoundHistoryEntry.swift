//
//  RoundHistoryEntry.swift
//  GuessTheSong
//
//  Created by Evgeny Bochkarev on 12.04.25.
//

import Foundation
import FirebaseFirestore

struct RoundHistoryEntry {
    let songTitle: String
    let artist: String
    let scores: [String: Int]
    let timestamp: Date

    func toDictionary() -> [String: Any] {
        return [
            "songTitle": songTitle,
            "artist": artist,
            "scores": scores,
            "timestamp": Timestamp(date: timestamp)
        ]
    }
}
