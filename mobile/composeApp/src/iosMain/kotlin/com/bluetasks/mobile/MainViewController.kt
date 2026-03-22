package com.bluetasks.mobile

import androidx.compose.ui.window.ComposeUIViewController
import platform.UIKit.UIViewController

public fun MainViewController(): UIViewController =
    ComposeUIViewController {
        App(fileBridge = IosFileBridge)
    }

private object IosFileBridge : FileBridge {
    override fun shareSqlite(
        bytes: ByteArray,
        filename: String,
    ) {
        // TODO: UIActivityViewController when you wire the iOS shell
    }

    override fun launchImport(onResult: (ByteArray?) -> Unit) {
        onResult(null)
    }
}
