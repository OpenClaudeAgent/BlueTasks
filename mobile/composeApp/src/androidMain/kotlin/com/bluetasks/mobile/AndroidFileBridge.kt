package com.bluetasks.mobile

import android.content.Intent
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import java.io.File

public class AndroidFileBridge(
    private val activity: ComponentActivity,
) : FileBridge {
    private var importCallback: ((ByteArray?) -> Unit)? = null

    private val importLauncher =
        activity.registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
            val cb = importCallback
            importCallback = null
            if (uri == null || cb == null) {
                cb?.invoke(null)
                return@registerForActivityResult
            }
            val bytes =
                activity.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            cb(bytes)
        }

    override fun shareSqlite(bytes: ByteArray, filename: String) {
        val cacheFile = File(activity.cacheDir, filename)
        cacheFile.writeBytes(bytes)
        val uri =
            FileProvider.getUriForFile(
                activity,
                "${activity.packageName}.fileprovider",
                cacheFile,
            )
        val intent =
            Intent(Intent.ACTION_SEND).apply {
                type = "application/vnd.sqlite3"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                putExtra(Intent.EXTRA_SUBJECT, filename)
            }
        activity.startActivity(Intent.createChooser(intent, "Export database"))
    }

    override fun launchImport(onResult: (ByteArray?) -> Unit) {
        importCallback = onResult
        importLauncher.launch("*/*")
    }
}
