//
//  LyricsOVHService.swift
//  GuessTheSong
//
//  Created by Evgeny Bochkarev on 12.04.25.
//

import Foundation

class LyricsOVHService {
    static func fetchLyrics(artist: String, title: String, completion: @escaping (String?) -> Void) {
        let baseURL = "https://api.lyrics.ovh/v1/\(artist)/\(title)"
        guard let encodedURL = baseURL.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: encodedURL) else {
            completion(nil)
            return
        }

        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data else {
                completion(nil)
                return
            }

            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: String],
                   let lyrics = json["lyrics"] {
                    completion(lyrics)
                } else {
                    completion(nil)
                }
            } catch {
                print("❌ Ошибка парсинга lyrics.ovh:", error)
                completion(nil)
            }
        }.resume()
    }
}
