//
//  GuessTheSongApp.swift
//  GuessTheSong
//
//  Created by Evgeny Bochkarev on 12.04.25.
//

import SwiftUI
import FirebaseCore

@main
struct GuessTheSongApp: App {
    init() {
        FirebaseApp.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
