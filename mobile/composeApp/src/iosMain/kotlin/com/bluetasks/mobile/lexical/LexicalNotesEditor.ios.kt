package com.bluetasks.mobile.lexical

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.interop.UIKitView
import com.bluetasks.mobile.generated.Res
import com.bluetasks.mobile.shared.lexical.LexicalNativePayload
import com.bluetasks.mobile.ui.theme.BlueTasksColors
import kotlinx.cinterop.BetaInteropApi
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.usePinned
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.jetbrains.compose.resources.ExperimentalResourceApi
import platform.CoreGraphics.CGRectMake
import platform.Foundation.NSCachesDirectory
import platform.Foundation.NSFileManager
import platform.Foundation.NSURL
import platform.Foundation.NSUserDomainMask
import platform.UIKit.UIColor
import platform.WebKit.WKScriptMessage
import platform.WebKit.WKScriptMessageHandlerProtocol
import platform.WebKit.WKUserContentController
import platform.WebKit.WKWebView
import platform.WebKit.WKWebViewConfiguration
import platform.darwin.NSObject
import platform.posix.fclose
import platform.posix.fopen
import platform.posix.fwrite

/**
 * WKWebView cannot reliably load ES-module Lexical from [Res.getUri] (non-file / sandbox). We mirror
 * Android's asset folder into Caches and open real `file://` URLs with a broad read-access sandbox.
 */
@OptIn(ExperimentalForeignApi::class, ExperimentalResourceApi::class, BetaInteropApi::class)
private suspend fun prepareLexicalBundleDir(): NSURL? =
    withContext(Dispatchers.Default) {
        val fm = NSFileManager.defaultManager
        val array =
            fm.URLsForDirectory(
                directory = NSCachesDirectory,
                inDomains = NSUserDomainMask,
            ) ?: return@withContext null
        if (array.isEmpty()) return@withContext null
        val cacheRoot = array[0] as? NSURL ?: return@withContext null
        val dir =
            cacheRoot.URLByAppendingPathComponent(
                pathComponent = "bluetasks_lexical",
                isDirectory = true,
            ) ?: return@withContext null
        val assetsDir =
            dir.URLByAppendingPathComponent(
                pathComponent = "assets",
                isDirectory = true,
            ) ?: return@withContext null
        fm.createDirectoryAtURL(url = dir, withIntermediateDirectories = true, attributes = null, error = null)
        fm.createDirectoryAtURL(url = assetsDir, withIntermediateDirectories = true, attributes = null, error = null)

        val indexHtml = Res.readBytes("files/bluetasks_lexical/index.html")
        val indexJs = Res.readBytes("files/bluetasks_lexical/assets/index.js")
        val indexCss = Res.readBytes("files/bluetasks_lexical/assets/index.css")
        val indexPath = dir.path?.plus("/index.html") ?: return@withContext null
        val jsPath = assetsDir.path?.plus("/index.js") ?: return@withContext null
        val cssPath = assetsDir.path?.plus("/index.css") ?: return@withContext null
        if (!indexHtml.writeToFilePath(indexPath)) return@withContext null
        if (!indexJs.writeToFilePath(jsPath)) return@withContext null
        if (!indexCss.writeToFilePath(cssPath)) return@withContext null
        dir
    }

private fun ByteArray.writeToFilePath(path: String): Boolean {
    val f = fopen(path, "wb") ?: return false
    if (isEmpty()) {
        return fclose(f) == 0
    }
    val ok =
        usePinned { pinned ->
            val written = fwrite(pinned.addressOf(0), 1uL, size.toULong(), f)
            written == size.toULong()
        }
    fclose(f)
    return ok
}

@OptIn(ExperimentalForeignApi::class, ExperimentalResourceApi::class)
@Composable
public actual fun LexicalNotesEditor(
    contentJson: String,
    placeholder: String,
    modifier: Modifier,
    onChange: (contentJson: String, contentText: String, checklistTotal: Int, checklistCompleted: Int) -> Unit,
) {
    var bundleDir by remember { mutableStateOf<NSURL?>(null) }
    LaunchedEffect(Unit) {
        bundleDir = prepareLexicalBundleDir()
    }

    if (bundleDir == null) {
        Box(
            modifier
                .fillMaxSize()
                .background(BlueTasksColors.Canvas),
        )
        return
    }

    key(bundleDir) {
        LexicalWebViewHost(
            bundleDir = bundleDir!!,
            contentJson = contentJson,
            placeholder = placeholder,
            modifier = modifier,
            onChange = onChange,
        )
    }
}

@OptIn(ExperimentalForeignApi::class, ExperimentalResourceApi::class)
@Composable
private fun LexicalWebViewHost(
    bundleDir: NSURL,
    contentJson: String,
    placeholder: String,
    modifier: Modifier,
    onChange: (contentJson: String, contentText: String, checklistTotal: Int, checklistCompleted: Int) -> Unit,
) {
    var webView by remember { mutableStateOf<WKWebView?>(null) }
    var editorReady by remember { mutableStateOf(false) }

    val handler =
        remember(onChange) {
            LexicalScriptHandler(
                onReady = { editorReady = true },
                onChange = onChange,
            )
        }

    val indexFile =
        remember(bundleDir) {
            bundleDir.URLByAppendingPathComponent("index.html")
        }

    UIKitView(
        factory = {
            val config = WKWebViewConfiguration()
            config.userContentController.addScriptMessageHandler(handler, "blueTasksLexical")
            WKWebView(
                frame = CGRectMake(0.0, 0.0, 0.0, 0.0),
                configuration = config,
            ).apply {
                allowsBackForwardNavigationGestures = false
                val canvas =
                    UIColor.colorWithRed(
                        red = 42.0 / 255.0,
                        green = 38.0 / 255.0,
                        blue = 52.0 / 255.0,
                        alpha = 1.0,
                    )
                backgroundColor = canvas
                opaque = true
                scrollView.backgroundColor = canvas
                scrollView.bounces = false
                if (indexFile != null) {
                    loadFileURL(indexFile, allowingReadAccessToURL = bundleDir)
                }
                webView = this
            }
        },
        modifier = modifier,
        update = { wv ->
            webView = wv
        },
        onRelease = { wv ->
            wv.configuration.userContentController.removeScriptMessageHandlerForName("blueTasksLexical")
            webView = null
            editorReady = false
        },
    )

    LaunchedEffect(editorReady, contentJson, placeholder, webView) {
        val wv = webView ?: return@LaunchedEffect
        if (!editorReady) {
            return@LaunchedEffect
        }
        val cmdJson = lexicalSetDocumentJson(contentJson, placeholder)
        val arg = jsStringLiteral(cmdJson)
        val js = "window.__BT_LEXICAL_RECEIVE__($arg)"
        wv.evaluateJavaScript(javaScriptString = js, completionHandler = null)
    }
}

private fun lexicalSetDocumentJson(
    contentJson: String,
    placeholder: String,
): String =
    buildString {
        append("{\"type\":\"setDocument\",\"contentJson\":")
        append(jsonString(contentJson))
        append(",\"placeholder\":")
        append(jsonString(placeholder))
        append('}')
    }

private fun jsonString(s: String): String {
    val sb = StringBuilder()
    sb.append('"')
    for (ch in s) {
        when (ch) {
            '\\' -> sb.append("\\\\")
            '"' -> sb.append("\\\"")
            '\n' -> sb.append("\\n")
            '\r' -> sb.append("\\r")
            '\t' -> sb.append("\\t")
            else -> {
                if (ch.code < 0x20) {
                    val hex = ch.code.toString(16).padStart(4, '0')
                    sb.append("\\u$hex")
                } else {
                    sb.append(ch)
                }
            }
        }
    }
    sb.append('"')
    return sb.toString()
}

private fun jsStringLiteral(s: String): String = jsonString(s)

private class LexicalScriptHandler(
    private val onReady: () -> Unit,
    private val onChange: (contentJson: String, contentText: String, checklistTotal: Int, checklistCompleted: Int) -> Unit,
) : NSObject(), WKScriptMessageHandlerProtocol {
    override fun userContentController(
        userContentController: WKUserContentController,
        didReceiveScriptMessage: WKScriptMessage,
    ) {
        val raw =
            when (val body = didReceiveScriptMessage.body) {
                is String -> body
                else -> return
            }
        when (val p = LexicalNativePayload.parse(raw)) {
            LexicalNativePayload.Ready -> onReady()
            is LexicalNativePayload.Change ->
                if (p.json.isNotEmpty()) {
                    onChange(p.json, p.plainText, p.checklistTotal, p.checklistCompleted)
                }
            null -> Unit
        }
    }
}
