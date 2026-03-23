import UIKit

/// Wraps the Compose `UIViewController` so the shell matches BlueTasks (canvas) and iOS status bar (light icons on dark).
final class BlueTasksRootViewController: UIViewController {
    private let composeViewController: UIViewController

    init(composeViewController: UIViewController) {
        self.composeViewController = composeViewController
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = BlueTasksColor.canvasUIColor
        overrideUserInterfaceStyle = .dark

        addChild(composeViewController)
        composeViewController.view.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(composeViewController.view)
        NSLayoutConstraint.activate([
            composeViewController.view.topAnchor.constraint(equalTo: view.topAnchor),
            composeViewController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            composeViewController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            composeViewController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
        composeViewController.didMove(toParent: self)
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    override var childForStatusBarStyle: UIViewController? { nil }
}
