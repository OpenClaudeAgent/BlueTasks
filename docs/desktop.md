# Desktop (Tauri) maintainer notes

## App icon

Source vector: [`desktop/src-tauri/icons/bluetasks-icon.svg`](../desktop/src-tauri/icons/bluetasks-icon.svg). Regenerate platform bitmaps (macOS / Windows / Linux bundle assets) from the repo root:

```bash
cd desktop && npx tauri icon ./src-tauri/icons/bluetasks-icon.svg -o ./src-tauri/icons
```

The web favicon is a copy at [`web/app/public/bluetasks-icon.svg`](../web/app/public/bluetasks-icon.svg).
