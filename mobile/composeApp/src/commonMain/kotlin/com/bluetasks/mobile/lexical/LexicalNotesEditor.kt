package com.bluetasks.mobile.lexical

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

/**
 * Embeds the React `LexicalTaskEditor` bundle (Vite shell) in a WebView.
 * [contentJson] is Lexical serialized state; [onChange] mirrors web `EditorChangePayload`.
 */
@Composable
public expect fun LexicalNotesEditor(
    contentJson: String,
    placeholder: String,
    modifier: Modifier = Modifier,
    onChange: (contentJson: String, contentText: String, checklistTotal: Int, checklistCompleted: Int) -> Unit,
)
