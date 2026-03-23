package com.bluetasks.mobile.lexical

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader
import com.bluetasks.mobile.shared.lexical.LexicalNativePayload
import org.json.JSONObject

private const val LEXICAL_ASSET_URL =
    "https://appassets.androidplatform.net/assets/bluetasks_lexical/index.html"

@SuppressLint("SetJavaScriptEnabled")
@Composable
public actual fun LexicalNotesEditor(
    contentJson: String,
    placeholder: String,
    modifier: Modifier,
    onChange: (contentJson: String, contentText: String, checklistTotal: Int, checklistCompleted: Int) -> Unit,
) {
    val context = LocalContext.current
    val assetLoader =
        remember(context) {
            WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
                .build()
        }
    val mainHandler = remember { Handler(Looper.getMainLooper()) }
    var webViewHolder by remember { mutableStateOf<WebView?>(null) }
    var editorReady by remember { mutableStateOf(false) }

    val bridge =
        remember(onChange) {
            object {
                @JavascriptInterface
                fun postPayload(json: String) {
                    mainHandler.post {
                        handleLexicalBridgeMessage(json, onChange) { ready ->
                            if (ready) {
                                editorReady = true
                            }
                        }
                    }
                }
            }
        }

    AndroidView(
        factory = { ctx ->
            WebView(ctx).apply {
                layoutParams =
                    ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT,
                    )
                // Match BlueTasks `--canvas` / [BlueTasksColors.Canvas] so the view is never default white while loading.
                setBackgroundColor(Color.rgb(42, 38, 52))
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                webChromeClient = WebChromeClient()
                addJavascriptInterface(bridge, "BlueTasksLexicalBridge")
                webViewClient =
                    object : WebViewClient() {
                        override fun shouldInterceptRequest(
                            view: WebView,
                            request: WebResourceRequest,
                        ): WebResourceResponse? =
                            assetLoader.shouldInterceptRequest(request.url)
                                ?: super.shouldInterceptRequest(view, request)

                        override fun onPageFinished(
                            view: WebView?,
                            url: String?,
                        ) {
                            super.onPageFinished(view, url)
                            if (view != null) {
                                webViewHolder = view
                            }
                        }
                    }
                loadUrl(LEXICAL_ASSET_URL)
            }
        },
        modifier = modifier,
        update = { wv ->
            webViewHolder = wv
        },
    )

    LaunchedEffect(editorReady, contentJson, placeholder, webViewHolder) {
        val wv = webViewHolder ?: return@LaunchedEffect
        if (!editorReady) {
            return@LaunchedEffect
        }
        val cmd =
            JSONObject().apply {
                put("type", "setDocument")
                put("contentJson", contentJson)
                put("placeholder", placeholder)
            }
        val payload = cmd.toString()
        val js = "window.__BT_LEXICAL_RECEIVE__(${JSONObject.quote(payload)})"
        wv.evaluateJavascript(js, null)
    }
}

private fun handleLexicalBridgeMessage(
    json: String,
    onChange: (contentJson: String, contentText: String, checklistTotal: Int, checklistCompleted: Int) -> Unit,
    onReady: (Boolean) -> Unit,
) {
    when (val p = LexicalNativePayload.parse(json)) {
        LexicalNativePayload.Ready -> onReady(true)
        is LexicalNativePayload.Change ->
            if (p.json.isNotEmpty()) {
                onChange(p.json, p.plainText, p.checklistTotal, p.checklistCompleted)
            }
        null -> Unit
    }
}
