import SwiftUI
import UIKit

/// Tokens aligned with `BlueTasksColors.kt` / web `index.css` (dark-only product).
enum BlueTasksColor {
    /// `--canvas` #2A2634
    static let canvas = Color(red: 42 / 255, green: 38 / 255, blue: 52 / 255)

    /// `--accent` #7EB8FF (SwiftUI chrome / tint)
    static let accent = Color(red: 126 / 255, green: 184 / 255, blue: 1)

    static let canvasUIColor = UIColor(red: 42 / 255, green: 38 / 255, blue: 52 / 255, alpha: 1)
    static let accentUIColor = UIColor(red: 126 / 255, green: 184 / 255, blue: 1, alpha: 1)
}
