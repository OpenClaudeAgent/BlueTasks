import SwiftUI
import UIKit

@main
struct BlueTasksIOSApp: App {
    init() {
        configureIosChrome()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }

    /// System UI that still surfaces outside Compose (scroll indicators, refresh, etc.).
    private func configureIosChrome() {
        UIScrollView.appearance().indicatorStyle = .white
    }
}
