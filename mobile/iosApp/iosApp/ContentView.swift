import ComposeApp
import SwiftUI

struct ComposeView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        let compose = MainViewControllerKt.MainViewController()
        return BlueTasksRootViewController(composeViewController: compose)
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}

struct ContentView: View {
    var body: some View {
        ZStack {
            BlueTasksColor.canvas
                .ignoresSafeArea()
            ComposeView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .ignoresSafeArea()
                .ignoresSafeArea(.keyboard)
        }
        .preferredColorScheme(.dark)
        .tint(BlueTasksColor.accent)
    }
}
