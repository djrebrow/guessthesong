//
//  MuztextScraper.swift
//  GuessTheSong
//
//  Created by Evgeny Bochkarev on 12.04.25.
//

import Foundation
import SwiftSoup

class MuztextScraper {
    static func fetchLyrics(artist: String, title: String, completion: @escaping (String?) -> Void) {
        let searchArtist = artist.replacingOccurrences(of: " ", with: "-").lowercased()
        let searchTitle = title.replacingOccurrences(of: " ", with: "-").lowercased()
        let urlString = "https://muztext.com/tekst-pesni/\(searchArtist)-\(searchTitle)/"

        guard let url = URL(string: urlString) else {
            completion(nil)
            return
        }

        URLSession.shared.dataTask(with: url) { data, _, error in
            guard let data = data, error == nil,
                  let html = String(data: data, encoding: .utf8) else {
                completion(nil)
                return
            }

            do {
                let doc = try SwiftSoup.parse(html)
                let lyricsDivs = try doc.select("div.song-text")
                let lyrics = try lyricsDivs.map { try $0.text() }.joined(separator: "\n")
                completion(lyrics.isEmpty ? nil : lyrics)
            } catch {
                print("❌ Ошибка парсинга muztext.com:", error)
                completion(nil)
            }
        }.resume()
    }
}

