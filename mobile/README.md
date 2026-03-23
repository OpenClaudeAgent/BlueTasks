# BlueTasks mobile (Kotlin Multiplatform)

Compose Multiplatform client for the existing BlueTasks HTTP API. Point the app at your server (e.g. `http://192.168.1.10:8787` or Tailscale) — the same REST API as the web and desktop apps.

## Requirements

- **JDK 21** (Temurin or Azul). Set `JAVA_HOME` to that JDK before running Gradle.  
  JDK 25+ is not supported as the **Gradle runtime** for this project today (Android Gradle Plugin / Groovy compatibility).
- Android SDK (install via Android Studio or `sdkmanager`) for `assembleDebug`.
- **iOS** (optional): Xcode, [CocoaPods](https://cocoapods.org/) (`gem install cocoapods` or Homebrew), same **JDK 21** for the Gradle step invoked when Xcode builds the Kotlin framework.

## Local commands (test here first)

From this directory:

```bash
# macOS (Homebrew): JDK 21 is often here even when `java_home -v 21` does not list it:
export JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || echo /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home)"

./gradlew qualityGate
./gradlew :composeApp:assembleDebug
./gradlew androidUnitTestGate   # :shared + :composeApp JVM unit tests (commonTest) only
./gradlew iosTestGate           # macOS + Xcode: Kotlin/Native tests on iOS Simulator arm64
./gradlew androidConnectedTestGate   # device or emulator: :composeApp instrumented tests
```

`qualityGate` runs **ktlint**, **detekt**, **`androidUnitTestGate`** (`:shared:testDebugUnitTest` + `:composeApp:testDebugUnitTest`), **`koverGate`** (`koverVerify` — couverture JVM fusionnée `:shared` + `:composeApp`, seuil ligne ≥ **9 %** dans `mobile/build.gradle`), and **`:composeApp:lintDebug`**. From the repo root you can use `npm run mobile:quality` or `npm run mobile:ci` (gate + `assembleDebug`). Use `npm run mobile:ios-test` / `npm run mobile:android-unit-test` / `npm run mobile:android-connected` for the focused Gradle gates.

### Couverture (Kover)

[Kover](https://github.com/Kotlin/kotlinx-kover) mesure la couverture des tests **JVM** (dont `testDebugUnitTest` Android). Les tests **iOS natifs** et **instrumentés** ne sont pas inclus.

```bash
./gradlew koverLog           # résumé console
./gradlew koverHtmlReport    # HTML : build/reports/kover/html/index.html (racine), + par module sous */build/reports/kover/
./gradlew koverVerify        # même borne que le CI (qualityGate)
```

Depuis la racine du repo : `npm run mobile:kover` (rapports HTML + XML), `npm run mobile:kover-verify`.

On **push / pull_request** to `main` or `master`, CI (`.github/workflows/ci.yml`) runs **mobile-android** (`npm run build:mobile-lexical` + `qualityGate` + `assembleDebug` on Ubuntu), **mobile-android-connected** (emulator + `connectedDebugAndroidTest`), and **mobile-ios** (`iosTestGate` on macOS).

Individual checks still work: `./gradlew ktlintCheck`, `./gradlew detekt`.

## Localization

Edit string resources directly in `composeApp/src/commonMain/composeResources/`: default language in `values/strings.xml`, other locales in `values-<lang>/strings.xml` (same keys in every file). On **Android** and **iOS**, the UI language follows the **system** preferences; there is no separate in-app language setting.

Open `composeApp` in Android Studio for an emulator or device.

### iOS (Xcode)

The native shell lives under `iosApp/`: SwiftUI hosts `MainViewController()` from Kotlin via the **ComposeApp** CocoaPods pod produced by `:composeApp`.

From **`mobile/`** (after a fresh clone, run the dummy framework once so `pod install` can succeed):

```bash
export JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || echo /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home)"

# Lexical WebView bundle (same as Android) — from repo root:
# npm ci && npm run build:mobile-lexical

./gradlew :composeApp:generateDummyFramework
cd iosApp && pod install
```

After `cd iosApp`, open **`iosApp.xcworkspace`** in Xcode (not the `.xcodeproj` alone). Scheme **iosApp**, bundle id `com.bluetasks.mobile.ios`.

Regenerate the podspec when the CocoaPods block in `composeApp/build.gradle` changes: `./gradlew :composeApp:podspec`.

The Swift shell (`iosApp/iosApp/`) matches **BlueTasks** canvas `#2A2634`, accent `#7EB8FF`, forced dark interface, light status-bar content, and safe-area–aware Compose (`WindowInsets.safeDrawing` on the board + connect screen).

**Lexical (notes)** on iOS: the WebView loads the bundle from app **Caches** (real `file://` URLs). `Res.getUri` alone is not reliable for WKWebView + ES modules. Ensure `npm run build:mobile-lexical` has been run so `composeResources/files/bluetasks_lexical/` is populated.

On **iOS only**, the main board uses a **centered** top bar, hairline dividers, tab-style bottom bar without Material pill indicators, 10 dp capture corners, and the same BlueTasks palette as Android.

SQLite import/share on iOS remains a stub (`IosFileBridge` in `MainViewController.kt`). See also the [Compose Multiplatform iOS docs](https://www.jetbrains.com/help/kotlin-multiplatform-dev/compose-ios.html).

## HTTP API coverage

The mobile client calls the **same REST surface** as the web app (`web/app/src/api.ts`). There are no extra server routes to wire for parity; remaining gaps are **features** (checklist UI, Lexical editor), not missing endpoints. See [docs/mobile-http-api-matrix.md](../docs/mobile-http-api-matrix.md) for the route matrix, Lexical vs `contentText` behavior, and a **dependency upgrade checklist**.

## Rich notes (Phase B — WebView Lexical)

Task bodies are edited with the **same React Lexical editor** as the web app, embedded via a static bundle. Before Gradle (or after changing `LexicalTaskEditor` / plugins on the web), from the **repo root**:

```bash
npm ci
npm run build:mobile-lexical
```

That copies the bundle into `composeApp` Android assets and Compose resources (`bluetasks_lexical/`). See [docs/mobile-rich-notes-phase-b.md](../docs/mobile-rich-notes-phase-b.md) and the **Lexical** section in [docs/mobile-http-api-matrix.md](../docs/mobile-http-api-matrix.md).

### Toolchain notes

- **Kotlin / AGP**: This repo pins **Android Gradle Plugin 8.5.x** and **compileSdk/targetSdk 34** so Kotlin **2.0.21** KMP stays within the versions JetBrains tests. To move to **compileSdk 35** and newer AndroidX (e.g. `core-ktx` 1.15+), upgrade **Kotlin** (and Compose) to a release that officially supports **AGP 8.7+**, then bump AGP and `compileSdk` together. Step-by-step checklist: [docs/mobile-http-api-matrix.md](../docs/mobile-http-api-matrix.md#dependency-and-toolchain-upgrades-tracked-work).
- **Gradle 9**: You may still see a generic “deprecated Gradle features” notice from plugins; fixing it means upgrading Gradle + Android/Kotlin plugins when you are ready.

## GitHub Actions

PR CI (`.github/workflows/ci.yml`) runs Lexical embed, `qualityGate`, debug APK, instrumented tests (emulator), and `iosTestGate` — not every push to arbitrary branches beyond `main`/`master`.

**Release artifacts (optional):** run [**Mobile artifacts (unsigned)**](../.github/workflows/mobile-artifacts-unsigned.yml) from GitHub Actions (`workflow_dispatch`, pass an existing tag `v*`). It builds an **unsigned** AAB and an iOS Release **simulator** `.app` zip and uploads them to that tag’s GitHub Release. Not tied to PR CI or the monorepo Release workflow — see [docs/mobile-release-ci-plan.md](../docs/mobile-release-ci-plan.md).

## Module layout

| Module        | Role                                                |
| ------------- | --------------------------------------------------- |
| `:shared`     | Domain filters/sort, Ktor client, API DTOs, session |
| `:composeApp` | Material 3 UI, ViewModel, Android/iOS entry         |

`composeApp` UI is split under `com.bluetasks.mobile.ui` — `screens/` (`ConnectScreen`, `MainBoardScreen`, `TaskEditorSheet`, `SettingsSheet`) and `components/` (e.g. `TaskRowCard`, category chips, icon mapping). `App.kt` wires the ViewModel, `FileBridge`, and dialogs.

**Category icons** match the web app’s Lucide set (`web/app/src/lib/categoryIcons.ts`) via `com.composables:icons-lucide` (`CategoryIconVector.kt`). Canonical ids are `server/data/category-icon-ids.json` (mirrored in `CategoryIconIds.kt`). Root `npm run build` runs `check:category-icon-parity` so mobile stays aligned when ids change.

The **theme** (`ui/theme/`) follows the web app’s dark palette from `web/app/src/index.css` (purple-grey surfaces, `#7eb8ff` accent); the app always uses that scheme so it matches the browser product.

See also [docs/architecture.md](../docs/architecture.md) and [docs/mobile-web-parity-backlog.md](../docs/mobile-web-parity-backlog.md).
