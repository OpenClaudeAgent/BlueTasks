# GitHub Actions plan — mobile app release (Android + iOS)

**Implemented in-repo:** [`.github/workflows/mobile-artifacts-unsigned.yml`](../.github/workflows/mobile-artifacts-unsigned.yml) — **manual-only** (`workflow_dispatch`), **unsigned** AAB + iOS simulator zip; **not** dispatched from [`release.yml`](../.github/workflows/release.yml) or [`ci.yml`](../.github/workflows/ci.yml). Version alignment on release still comes from [`sync-package-version.mjs`](../scripts/sync-package-version.mjs) (Gradle + Xcode).

**Current CI policy:** **unsigned only** (no Android keystore / no distribution iOS archive). The sections below describe a later path for Play / App Store signing.

**Goal:** ship **reproducible artifacts** (and later **signed** store builds) from a semver tag `v*`, aligned with the **Release** flow ([`.github/workflows/release.yml`](../.github/workflows/release.yml)) described in [releasing.md](releasing.md).

---

## Current repo state

| Area             | Status                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Mobile PR CI     | `ci.yml`: Lexical bundle, `qualityGate`, debug APK, `iosTestGate` (instrumented Android: manual workflow only)                     |
| Monorepo version | `sync-package-version.mjs` updates **root / web / server / desktop** — **not** `mobile/composeApp/build.gradle` or iOS **CFBundle** |
| Android release  | No `bundleRelease` / signed AAB in CI                                                                                               |
| iOS release      | Xcode shell + CocoaPods + Gradle framework; no archive build in CI                                                                  |

**Product prerequisites:** final Play / App Store bundle IDs, developer accounts, distribution tracks (internal, TestFlight, production).

---

## Recommended phases

### Phase 0 — One-time setup

1. **Version alignment**
   - Extend `scripts/sync-package-version.mjs` (or a dedicated script) for:
     - `mobile/composeApp/build.gradle`: `version = 'x.y.z'`, `defaultConfig.versionName`
     - `mobile/iosApp/.../Info.plist`: `CFBundleShortVersionString` / `CFBundleVersion` (or Xcode `agvtool` / `MARKETING_VERSION`).
   - Include mobile files in the **Release** `ship` job commit (same pattern as desktop).

2. **GitHub secrets** (suggested names)

   **Android (Play App Signing or upload key)**
   - `ANDROID_KEYSTORE_BASE64` — base64-encoded keystore
   - `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`
   - Optional: **Play** **service account** JSON (`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`) for `r0adkll/upload-google-play`.

   **iOS**
   - **Option A:** distribution certificate + provisioning profile as secrets (`IOS_DISTRIBUTION_CERT_BASE64`, `IOS_DISTRIBUTION_CERT_PASSWORD`, `IOS_PROVISION_PROFILE_BASE64`) + `APPLE_TEAM_ID`, `APPLE_ID`, `APP_SPECIFIC_PASSWORD` (notary / altool if needed).
   - **Option B:** **Fastlane match** with encrypted repo + `MATCH_PASSWORD`.
   - **Option C:** **Xcode Cloud** or local signed build + manual upload (CI only produces unsigned artifacts).

3. **Gradle signing (Android)**
   - `mobile/composeApp`: `signingConfigs.release` gated on secret presence (do not commit the keystore).

### Phase 1 — CI “release artifacts” (no store)

**Trigger:** `workflow_dispatch` with input `tag: vX.Y.Z` **or** `repository_dispatch` / `gh workflow run` from **Release** (same as Docker and Desktop).

**Android job (`ubuntu-latest`)**

- Checkout at tag
- `npm ci` + `npm run build:mobile-lexical`
- JDK 21 + Android SDK (`android-actions/setup-android`)
- `./gradlew :composeApp:bundleRelease` (or `assembleRelease`) with signing when secrets exist
- **Upload artifact:** `*.aab` and/or `*.apk` + checksum

**iOS job (`macos-latest`)**

- Checkout at tag
- Same Lexical + JDK 21
- `./gradlew :composeApp:generateDummyFramework` (or equivalent per [mobile/README](../mobile/README.md)), then `pod install` under `mobile/iosApp`
- `xcodebuild -workspace iosApp.xcworkspace -scheme iosApp -configuration Release -archivePath build/iosApp.xcarchive archive`
- If signing is configured: `xcodebuild -exportArchive` with `ExportOptions.plist` (App Store / ad hoc)
- **Upload artifact:** `.ipa` or zipped `.xcarchive`

**GitHub Release**

- Reuse the `softprops/action-gh-release` pattern from [desktop-publish.yml](../.github/workflows/desktop-publish.yml) to attach mobile artifacts to the **same** `v*` release (needs `contents: write` and coordination with desktop or a dedicated “assemble release assets” job).

### Phase 2 — Store deployment (optional)

**Android — Google Play**

- After a successful signed bundle job: **upload** to **internal** / **closed** track, then manual promotion to production.
- Common actions: `r0adkll/upload-google-play` or **fastlane** `supply`.

**iOS — TestFlight / App Store**

- After `.ipa` export: **fastlane** `pilot` / `deliver`, or `apple-actions/upload-testflight-build`, with App Store Connect API key (`ASC_API_KEY` JSON + Issuer ID + Key ID).

### Phase 3 — Monorepo **Release** integration (optional)

- **Current choice:** mobile stays **out** of [release.yml](../.github/workflows/release.yml); run [mobile-artifacts-unsigned.yml](../.github/workflows/mobile-artifacts-unsigned.yml) manually once the tag (and usually the Desktop release) exists.
- **Alternative:** add `publish-mobile` with `gh workflow run mobile-artifacts-unsigned.yml -f tag=v${{ inputs.version }}` next to Docker / Desktop.

---

## Target workflow file (skeleton)

Implemented as [`.github/workflows/mobile-artifacts-unsigned.yml`](../.github/workflows/mobile-artifacts-unsigned.yml). Sketch:

```yaml
name: Mobile artifacts (unsigned)

on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'Git tag (e.g. v0.3.0)'
        required: true
        type: string

permissions:
  contents: read   # + write if creating/updating GitHub Release here

jobs:
  android-release-bundle:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { ref: ${{ inputs.tag }} }
      # setup-node, npm ci, build:mobile-lexical
      # setup-java 21, setup-android, gradle
      # ./gradlew :composeApp:bundleRelease
      # actions/upload-artifact

  ios-archive:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v6
        with: { ref: ${{ inputs.tag }} }
      # same: Lexical + JDK + Gradle framework + pod install + xcodebuild
      # actions/upload-artifact

  # release-assets:
  #   needs: [android-release-bundle, ios-archive]
  #   runs-on: ubuntu-latest
  #   steps: download artifacts + gh release upload for tag
```

Tune artifact names, signing, and **permissions** if uploading to the GitHub release.

---

## Risks and constraints

| Risk                               | Mitigation                                                                |
| ---------------------------------- | ------------------------------------------------------------------------- |
| iOS + CocoaPods build time         | Cache Gradle + Pods; `macos-14` / `macos-latest` runners                  |
| Lexical bundle skipped             | Always run `npm run build:mobile-lexical` before Gradle / Xcode           |
| iOS signing (certs)                | Prefer **match** or documented, rotatable secrets                         |
| Tag without aligned mobile version | Phase 0 required before promising store semver consistency                |
| **Kover / tests**                  | Do not gate release on them; keep `qualityGate` on `main` (already in CI) |

---

## Checklist before first store release

- [ ] Mobile version synced with tag `v*` (script + Release workflow).
- [ ] Android `versionCode` bumped on each Play upload (Play requirement).
- [ ] Privacy policy / store listings if required.
- [ ] Screenshots and metadata in App Store Connect + Play Console.
- [ ] Manual smoke test on CI artifact before production.

---

## Internal references

- [mobile/README.md](../mobile/README.md) — Gradle, iOS, Lexical.
- [releasing.md](releasing.md) — Release flow, Desktop, Docker.
- [ci.yml](../.github/workflows/ci.yml) — existing mobile jobs.
