---
name: capacitor-ios
description: Adding or changing a Capacitor app's iOS target. Use before running cap add ios, editing an ios/ or Xcode project, Info.plist, a privacy manifest, a Podfile or Package.swift, adding push or a sign-in method to the iOS shell, setting up iOS signing or a macOS CI build, or uploading to TestFlight.
---

# Capacitor iOS: the target's rules

**As of:** 2026-10-23

**Paths:** `ios/`, `*.xcodeproj/`, `*.xcworkspace/`, `Info.plist`, `*.xcprivacy`, `Podfile`, `capacitor.config.*`

**Stack:** `@capacitor/ios`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a deadline or a toolchain version, and keep going.** Re-check a dated fact against its source before it decides anything.

**A project skill on the same topic wins** where the two disagree.

**These rules are documented, not yet tested on a device.** They come from Apple's and Capacitor's documentation and from store-review reports, checked on the date above. Unlike the Android rules, no shipped iOS build has proven them yet. Treat each as a hypothesis to verify on TestFlight, and report one you did not verify as unverified.

## Toolchain and project

- **Uploads need Xcode 26 and an iOS 26 SDK since 2026-04-28, and a deployment target of iOS 13 or later since 2026-09-09** ([upcoming requirements](https://developer.apple.com/news/upcoming-requirements/), checked 2026-10-23). Apple raises the SDK floor every spring, so re-read that page before planning a release.
- **Capacitor 8's `cap add ios` generates a Swift Package Manager project.** It extracts a template and runs neither CocoaPods nor Xcode, so the project can be created and committed from Linux and compiled only on macOS. An older project uses CocoaPods (`Podfile`, `App.xcworkspace`). Don't mix the two: pick one per project and run `npx cap sync ios` after every plugin change, committing what it writes with the plugin, as on Android.
- **No `server.url` in a release.** It is for live reload. A release built with it loads a website, fails offline, and invites a guideline 4.2 or 2.5.2 rejection (2.5.2 forbids downloading code that changes features, so no live JS updates either).

## CI without a Mac

- **Build on a hosted macOS runner.** GitHub's `macos-26` image is generally available since 2026-02-26, with Xcode 26.6 as its default in mid-2026 images ([changelog](https://github.blog/changelog/2026-02-26-macos-26-is-now-generally-available-for-github-hosted-runners/)). Pin the Xcode version in the workflow (`xcode-select` or `DEVELOPER_DIR`) rather than trusting the image default, which moves.
- **Commit a shared scheme.** *Why:* a clean runner sees only schemes under `xcshareddata/xcschemes/`. A scheme left in a user's `xcuserdata/` exists on the laptop that made it and nowhere else, and `xcodebuild -scheme App` fails on CI.
- **Signing comes from secrets, never the tree.** Either an App Store Connect API key (`.p8`, key ID, issuer ID) with automatic signing (`xcodebuild -allowProvisioningUpdates -authenticationKeyPath …`), or a distribution certificate and provisioning profile imported into a temporary keychain. A capability (Push, Sign in with Apple, Associated Domains) must be on the App ID **and** in the profile, or the archive fails or the feature dies silently.
- **Export compliance blocks TestFlight until answered.** Set `ITSAppUsesNonExemptEncryption` to `NO` in `Info.plist` when the app's only encryption is HTTPS through the system. Without it, every build waits on a manual question in App Store Connect.

## The WebView, its origin and its session

- **The iOS origin is not the Android one.** *Why:* WKWebView already handles `http` and `https`, so `server.iosScheme` cannot be either; the app runs at `capacitor://localhost` (or the configured scheme and hostname) ([config](https://capacitorjs.com/docs/config)). A shell that keeps an Android cookie session by serving from the web app's own host cannot do the same here.
- **A cookie session from a remote API is a third-party cookie on iOS, and iOS 14+ blocks those by default** ([cookies](https://capacitorjs.com/docs/apis/cookies)). The choice belongs to the architecture, and each option has a price:
  - **Bearer token** stored in the Keychain (not `UserDefaults`, which Preferences-style plugins use): survives ITP, but every request must carry it and logout must clear it.
  - **App-Bound Domains:** list the API's domain and the local hostname in `WKAppBoundDomains` (at most 10), set `ios.limitsNavigationsToAppBoundDomains: true`, and enable `CapacitorCookies`. Navigation outside the list is then blocked, which affects OAuth redirects and external links.
- **Verify session survival, don't assume it.** iOS suspends a backgrounded app and may terminate the WebView's content process. Sign in, background the app, wait, reopen; then force-quit and cold-start. Both must land back inside the session, not on a blank screen or the login page. A reviewer on an iPad has hit exactly that loop on wrapped apps.
- **Handle the safe area.** Use `viewport-fit=cover` and add `env(safe-area-inset-*)` to fixed headers, footers and tab bars. The notch and home indicator cover what the inset does not reserve.

## Push

- **Capacitor's push plugin returns an APNs token on iOS, not an FCM one** ([push notifications](https://capacitorjs.com/docs/apis/push-notifications)). A backend that sends through FCM needs the Firebase Messaging SDK in the iOS app to exchange it for an FCM token, or sends to APNs directly. Upload the APNs auth key (`.p8`) to the push provider. How the server sends, and stores and prunes tokens, is `esq:pwa-and-push`'s.
- **The entitlement `aps-environment` must be in the signed build**, which means the Push capability on the App ID and in the provisioning profile used on CI.
- **The app must work with push refused.** What a notification may show on the lock screen (guideline 4.5.4) is `esq:store-review`'s.

## Privacy

- **Ship the app's own `PrivacyInfo.xcprivacy`.** List each required-reason API the app's own code uses, with its reason code (for example `CA92.1` for `UserDefaults` accessed only by the app). A missing reason is an upload error since 2024-05-01.
- **The App Privacy label is the app's data plus every SDK's.** Each third-party SDK carries its own manifest; read them (Firebase Messaging declares device ID and diagnostics, for instance) and make the label in App Store Connect match the union ([third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/)).
- **No App Tracking Transparency prompt** unless the app itself tracks across other companies' apps or sites. Adding one without a reason invites a question from review.
- **Sign-in methods:** what review requires of a third-party login (guideline 4.8) and of account deletion with Sign in with Apple is `esq:store-review`'s; verifying the provider's tokens and ending the session is `esq:auth-sessions`'s. This module owns only the shell side: the redirect scheme, the capability on the App ID and in the profile.

## Verify before calling a build done

- The archive was built by the pinned Xcode, with the intended bundle ID, version and build number (the build number grows with every upload).
- It installs from TestFlight. Sign-in, a cold start, a backgrounded resume, push, and a universal link work there, on an iPhone and on an iPad if the reviewer can run it there.
- Every rule above that you did not observe on a device is reported as unverified.
