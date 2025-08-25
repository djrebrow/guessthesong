//
//  LyricsService.swift
//  GuessTheSong
//
//  Created by Evgeny Bochkarev on 12.04.25.
//

import Foundation

class LyricsService {
    static func fetchLyrics(artist: String, title: String, completion: @escaping (String?) -> Void) {
        LyricsOVHService.fetchLyrics(artist: artist, title: title) { result in
            if let lyrics = result?.trimmingCharacters(in: .whitespacesAndNewlines), !lyrics.isEmpty {
                completion(lyrics)
            } else {
                // fallback
                MuztextScraper.fetchLyrics(artist: artist, title: title) { backupLyrics in
                    completion(backupLyrics)
                }
            }
        }
    }
}
