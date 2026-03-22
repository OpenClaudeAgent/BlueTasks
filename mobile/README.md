# BlueTasks mobile (Kotlin Multiplatform)

Compose Multiplatform client for the existing BlueTasks HTTP API. Point the app at your server (e.g. `http://192.168.1.10:8787` or Tailscale) — the same REST API as the web and desktop apps.

## Requirements

- **JDK 21** (Temurin or Azul). Set `JAVA_HOME` to that JDK before running Gradle.  
  JDK 25+ is not supported as the **Gradle runtime** for this project today (Android Gradle Plugin / Groovy compatibility).
- Android SDK (install via Android Studio or `sdkmanager`) for `assembleDebug`.

## Local commands (test here first)

From this directory:

```bash
# macOS (Homebrew): JDK 21 is often here even when `java_home -v 21` does not list it:
export JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || echo /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home)"

./gradlew :shared:test
./gradlew :composeApp:assembleDebug
./gradlew detekt
./gradlew ktlintCheck
```

Open `composeApp` in Android Studio for an emulator or device.

### iOS

An iOS entry point exists (`MainViewController`). Wire it in an Xcode project per the [Compose Multiplatform iOS docs](https://www.jetbrains.com/help/kotlin-multiplatform-dev/compose-ios.html). Import/share for database files is still a stub on iOS.

## Rich notes (Phase A)

Task bodies are edited as **plain text** (`contentText`). The server’s Lexical `contentJson` is preserved on save so the web app stays consistent. Full Lexical UI on mobile is a later phase (WebView or native editor).

## GitHub Actions

No mobile workflow runs on every push (keeps CI cost down). When you want automation, add a job with `on: workflow_dispatch` and `actions/setup-java@v4` (Java 21) running the same `./gradlew` lines as above.

## Module layout

| Module       | Role                                                |
| ------------ | --------------------------------------------------- |
| `:shared`    | Domain filters/sort, Ktor client, API DTOs, session |
| `:composeApp`| Material 3 UI, ViewModel, Android/iOS entry        |

See also [docs/architecture.md](../docs/architecture.md).
