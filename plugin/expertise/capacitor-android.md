---
name: capacitor-android
description: Building and releasing a Capacitor app's Android shell. Use before creating or changing an android/ project, a Gradle file, AndroidManifest.xml, capacitor.config, assetlinks.json, a keystore or signing config, or a Capacitor plugin with a native half, and before building an AAB or APK for Play.
---

# Capacitor Android: the shell's rules

**As of:** 2026-10-23

**Paths:** `android/`, `AndroidManifest.xml`, `*.gradle`, `*.gradle.kts`, `capacitor.config.*`, `assetlinks.json`

**Stack:** `@capacitor/android`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a deadline or an API level, and keep going.** Re-check a dated fact against its source before it decides anything.

**A project skill on the same topic wins** where the two disagree. This one is generic: it states each failure mechanism and how to check for it, and a remedy that depends on an architecture choice says which one.

None of these misses reds a CI run. Each one shows up later, as a rejected upload, an install talking to the wrong server, or a user logged out for no visible reason.

## Building the artefact

- **Build with the target API origin set, every time.** *Why:* Vite (and most bundlers) inline `import.meta.env.*` at build time, so an AAB built without it carries the dev default (`http://localhost:…`) for the life of every install. Make the release script refuse to start when a production origin is missing or points at localhost, before Gradle runs. Leave the plain `cap sync` used by a debug-on-LAN recipe unguarded.
- **`versionCode` only ever grows, and never changes scheme after the first upload.** *Why:* Play refuses any code at or below the highest one ever uploaded, for the life of the app. A scheme that is monotone with no shared state (seconds since a fixed epoch, computed when Gradle configures) works from a laptop and a CI runner alike. Switching later to a commit count or a CI run number drops the value and locks releases out. Put the short commit hash in `versionName` to tell two builds of one commit apart.
- **Pin the API levels where Gradle reads them, and treat Play's target as a floor.** *Why:* since 2026-08-31 Play refuses new apps and updates targeting below API 36 (Android 16); an extension to 2026-11-01 can be requested ([target API requirements](https://developer.android.com/google/play/requirements/target-sdk), checked 2026-10-23). The value usually sits in `android/variables.gradle`, which a Capacitor regeneration can rewrite, while `android/app/build.gradle` is not regenerated. Check that the built AAB's `targetSdkVersion` is the one you meant.
- **Commit what `cap sync` writes, in the same commit as the plugin that caused it.** *Why:* `android/capacitor.settings.gradle` and `android/app/capacitor.build.gradle` are generated but tracked, and they list each plugin's native half. Add the npm dependency without them and a fresh checkout builds a release whose JS calls a plugin with nothing native behind it, which fails silently at runtime. After adding any Capacitor plugin, run `npx cap sync android` and stage both files.
- **A local plugin (Java or Kotlin inside the app) is registered by hand.** *Why:* `cap sync` discovers packaged plugins only. Call `registerPlugin(MyPlugin.class)` in `MainActivity.onCreate`, **before** `super.onCreate`, which builds the bridge from the plugins registered so far.
- **No `server.url` in a release.** *Why:* it makes the WebView load a remote page instead of the bundled assets. Live reload needs it, but a release with it ships a website, breaks offline and fails store review. Guard the release build on its absence.
- **Ignore the Gradle build leftovers.** *Why:* the Kotlin Gradle plugin writes `android/.kotlin/` (session files such as `*.salive`), untracked and unignored. The tree reads dirty for as long as a build runs, and any clean-tree gate blocks whoever builds and commits in the same window. Add `.kotlin/` to `android/.gitignore`.

## The WebView, its origin and its session

- **Never relax the WebView's origin to make something work.** *Why:* the origin the shell serves its assets from (`server.hostname`, `androidScheme: 'https'`) decides whether the backend's cookies are first-party. If the app uses a **cookie session** and the shell serves from the web app's own host, the cookie keeps `Secure`, `SameSite=Lax`, its domain and a `__Secure-`/`__Host-` prefix, with no CORS allow-list entry and no third-party-cookie flag. The price is that every request to that host inside the shell resolves to the bundled assets, never the network, so a debug build cannot point at the deployed frontend. Fix that with a different debug path, never a different origin. With a **bearer token** instead, the origin matters less, and token storage (Keystore-backed) becomes the question.
- **Flush the cookie store when the app leaves the foreground.** *Why:* Android's WebView writes cookies to disk only periodically (about every 30 s). A session cookie set just before the app is swiped away or killed in the background is lost with the process, and the user is logged out for no visible reason. Override `onPause` in `MainActivity`, call `super.onPause()`, then `CookieManager.getInstance().flush()`. Verify it: sign in, background the app at once, force-stop it, and reopen.
- **Keep the session out of backups and device transfers.** *Why:* the app's private data directory holds the WebView cookie jar. A restored install would land inside an account on a phone that never authenticated. Set `android:allowBackup="false"` **and** `android:dataExtractionRules="@xml/data_extraction_rules"` on `<application>`. Some manufacturers still run device-to-device transfer with backup disabled, so the rules file needs both a `<cloud-backup>` and a `<device-transfer>` section. Every `<exclude>` needs **both** `domain` and `path` (`path="."` excludes the whole domain): without `path` the rules can be rejected or silently ignored ([Auto Backup](https://developer.android.com/guide/topics/data/autobackup)). Verify on a real device with `adb shell bmgr backupnow <package>`; an emulator run is not proof.

## Links, signing and keys

- **`assetlinks.json` lists distribution keys only.** *Why:* emailed links often carry reset, verification or invitation tokens. A debug or unprotected key's fingerprint in the file hands those tokens to any APK signed with that key. List the upload key and, with Play App Signing, **add** Play's app-signing key beside it (Play Console › App integrity). Before a release, check the release certificate's SHA-256 is in the served file: a mismatch fails nowhere, and links just keep opening in the browser. Claim the whole host rather than a path list, which misses the next link type. Avoid a custom URL scheme for anything carrying a token: any app can register it.
- **Signing comes from the environment, never the tree.** *Why:* a committed keystore or password is a leaked upload key. Read the keystore path and passwords from environment variables, or from an untracked local file as a laptop fallback. **Read that file literally, not with `Properties.load()`:** Java's `.properties` escaping silently drops a backslash in a generated password, and the build then fails at `:app:signReleaseBundle` with "Keystore was tampered with, or password was incorrect", which points at the key rather than the parser. If `keytool` opens the key with the same string, suspect the parser.
- **A sign-in path can work on the upload key and fail on Play's signing key.** *Why:* an OAuth client (Google Sign-In, Credential Manager) is bound to a certificate SHA-1. Register Play App Signing's SHA-1 too, and walk sign-in on an install from Play's internal testing track, not a sideloaded build.
- **Push config is not a secret.** `google-services.json` may be committed; the server's sending credential and token lifecycle are `esq:pwa-and-push`'s. Keep a notification channel id as one shared constant across the server sender, the client registration and the manifest.

## Layout

- **Handle the system-bar insets; with API 35 or higher targeted, the window is edge-to-edge.** *Why:* from API 35, Android draws the app under the status and navigation bars, and from API 36 the opt-out (`windowOptOutEdgeToEdgeEnforcement`) no longer applies. Capacitor's SystemBars `insetsHandling` (`css` by default, `native` recommended) decides whether the WebView is padded or gets `env(safe-area-inset-*)` / `--safe-area-inset-*` values; WebView before 140 reports wrong `env()` values ([SystemBars](https://capacitorjs.com/docs/apis/system-bars), checked 2026-10-23). Then **add** the inset to each fixed header's, footer's and tab bar's padding (`padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px))`), including the content area under a fixed bar. A utility layer where a plain padding class overrides the inset class loses it silently. Check on a phone with gesture navigation, signed out and signed in.

## Verify before calling a release done

- The AAB's origin, `versionCode`, `targetSdkVersion` and signing certificate are the intended ones.
- Install it from Play's internal testing track, not by sideloading. Walk sign-in, a link from an email, push and a cold start after a force-stop.
- Report an on-device check you did not run as unverified, never as proven.
