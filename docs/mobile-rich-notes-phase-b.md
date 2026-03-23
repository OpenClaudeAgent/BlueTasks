# Mobile rich notes — Phase B (WebView + React LexicalTaskEditor)

## Status

Phase B uses a **static Vite bundle** that mounts the **same** React component as the web app (`LexicalTaskEditor`), loaded in a **WebView** (Android `WebView`, iOS `WKWebView`) from Compose Multiplatform. The native ↔ JS bridge follows the same shape as web `EditorChangePayload` (`json`, `plainText`, `checklistTotal`, `checklistCompleted`).

## Build

From the **repository root**:

```bash
npm ci
npm run build:mobile-lexical
```

This builds `web/mobile-lexical-shell` and copies `dist/` into:

- `mobile/composeApp/src/androidMain/assets/bluetasks_lexical/`
- `mobile/composeApp/src/commonMain/composeResources/files/bluetasks_lexical/`

Commit those folders when you change the web editor so Android Studio / Gradle work **without** Node. Re-run `build:mobile-lexical` after any change to `LexicalTaskEditor` or its Lexical plugins.

## Kotlin integration

- UI: `LexicalNotesEditor` (`expect`/`actual`) in `mobile/composeApp/.../lexical/`.
- Task editor: `TaskEditorSheet` binds `contentJson`, `contentText`, `checklistTotal`, `checklistCompleted` from the bridge and passes them into `ApiTaskRow` on save.
- Bridge parsing: `LexicalNativePayload.parse` in `mobile/shared/.../lexical/LexicalNativePayload.kt` (tests in `LexicalNativePayloadTest`).

## Images / paste (v1)

The web Lexical stack may inline pasted images as **data URLs** inside `contentJson`, same as in the browser when not using multipart upload. **v1 mobile** does not wire `AndroidFileBridge` into the Lexical shell for HTTP image upload. Very large pastes may hit server or client limits; treat as a known constraint until a dedicated mobile upload path is added.

## Acceptance criteria

1. Open a task created on the web with Lexical content: mobile edits without corrupting `contentJson` on save.
2. Edits on mobile produce Lexical JSON the server accepts and the web renders correctly.
3. Automated tests: bridge JSON parsing is covered in `LexicalNativePayloadTest`; a full HTTP round-trip golden test remains optional follow-up.
4. Unsupported nodes: same bundle as web — no separate degradation layer on mobile.

## References

- HTTP / Lexical fields: [mobile-http-api-matrix.md](mobile-http-api-matrix.md)
- Web editor: `web/app/src/components/LexicalTaskEditor.tsx`
- Vite shell: `web/mobile-lexical-shell/`
- Parity backlog: [mobile-web-parity-backlog.md](mobile-web-parity-backlog.md)
