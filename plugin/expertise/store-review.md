---
name: store-review
description: What Google Play and App Store reviewers check, and what gets a wrapped web app rejected. Use before submitting or resubmitting a build, before answering a Play Console or App Store Connect form (App access, Data safety, App Privacy, age rating, health, export compliance), and before changing how a form or button reacts when a request fails.
---

# Store review: Play and the App Store

**As of:** 2026-10-23

**Paths:** `play-listing/`, `fastlane/`, `*.xcprivacy`, `AndroidManifest.xml`, `Info.plist`

**Stack:** `@capacitor/core`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a deadline, and keep going.** Before every submission, re-read Apple's [upcoming requirements](https://developer.apple.com/news/upcoming-requirements/) and Play's [policy deadlines](https://support.google.com/googleplay/android-developer/table/12921780): these facts expire.

**A project skill on the same topic wins** where the two disagree. The build mechanics (signing, versions, API levels, origins) belong to the `esq:capacitor-android` and `esq:capacitor-ios` skills; this one is about the review itself.

A reviewer is a stranger on an unknown device and network. They get one try, and they file what they see. One dead button is a full rejection plus another wait.

## The reviewer's walk, on both stores

- **A button that does nothing when a request fails is a rejection.** Play files it under **Broken Functionality, "unresponsive UI elements"**, even when the account and the server work. The rule that prevents it, and how to prove it on a built app with the API unreachable, belong to `esq:forms-and-failures`: apply it to every screen the reviewer's walk crosses before submitting.
- **The review account is reusable, never expires, needs no code or email step, and stays verified.** *Why:* Play asks for every detail needed to get past a login, and wants unusual mechanisms (a one-time password, MFA, more than two fields) explained in "Any other instructions" ([App access](https://support.google.com/googleplay/android-developer/answer/9859455)); a code the reviewer cannot receive is a rejection. Apple's guideline 2.1 asks the same of the demo account. Keep its password out of the repo. Give it realistic data, so screens show the app in use and not empty states.
- **No bot challenge in front of login.** *Why:* reviewers often run from datacenter IPs, which a CAPTCHA or Turnstile-style challenge scores as suspicious. Guard signup and password reset if you must; leave login reachable.
- **Don't deploy the API while a review is pending, unless the deploy is the fix.** *Why:* a single-instance server restart drops requests for a few seconds. A reviewer's tap in that window looks like a broken app, and an error message is still a worse review than a working login.
- **The review notes name the path through the app.** Sign in, then the two or three actions that show what the app is for, and each native feature in plain words (push tied to real events, haptics, share, offline). *Why:* reviewers judge what they see, not the plugin list. Wrapped web apps have stayed rejected under Apple's 4.2 after native plugins were added, until the experience itself was explained ([developer forums](https://developer.apple.com/forums/thread/812889)).
- **Ship only what has been walked on a store-signed install.** *Why:* a path that works on the upload key can fail on the store's signing key (an OAuth client bound to the wrong certificate). Ship a feature flag off rather than ship a button you have not walked from the store's own install.

## Google Play

- **Fix and resubmit, don't appeal, when the bug is real.** You get one appeal per enforcement action, and it is meant for Google's errors ([appeals](https://support.google.com/googleplay/android-developer/answer/9842754)).
  - Upload to **internal testing** first. Install from Play, walk the login online and in airplane mode, then promote **the same release** to production from the release library. Uploading the same AAB again is refused because its `versionCode` already exists.
  - Review can take up to seven days ([review times](https://support.google.com/googleplay/android-developer/answer/9859751)).
- **The pre-launch report is a robot, not the reviewer.** It uses its own credentials (Pre-launch report › Settings, not App access), and it cannot get through a WebView-based authentication flow, so it may stall at login ([pre-launch report](https://support.google.com/googleplay/android-developer/answer/9842757)). Read its Stability and Screenshots tabs for crashes; a robot stuck at login is expected, not a finding. Android Vitals stays empty until real installs exist.
- **Answer the Console forms from files kept in the repo, never improvised in the browser.** Content rating, category and target audience; Data safety; the declarations. *Why:* the answers must match the app and each other, and the next submission re-asks them.
  - A target audience of 18+ keeps the app out of the Families policy. A category outside Health & Fitness keeps a general-purpose app from looking like a health app.
  - The **Health apps declaration** is mandatory for every published app, testing tracks included, even to answer that the app has no health features ([health declaration](https://support.google.com/googleplay/android-developer/answer/14738291)). The Financial features and Government apps declarations are mandatory too.
- **Data safety changes before the feature ships, not after.** Adding a sign-in SDK (Google, for example) makes name, email, the account ID and possibly the profile photo collected through that SDK ([Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)). Update the form in the same release, never later.
- **Account deletion needs both paths:** in the app, and at a web URL declared in Data safety ([account deletion](https://support.google.com/googleplay/android-developer/answer/13327111)). The deletion is real, not a deactivation; how to carry it out (sessions, tokens, data) is `esq:auth-sessions`'s.
- **Next deadline:** from 2027-02-01, updates of apps targeting API 35 or higher must support 16 KB memory pages on 64-bit devices ([page sizes](https://developer.android.com/guide/practices/page-sizes), checked 2026-10-23). Pure Java or Kotlin is unaffected; check the AAB for `.so` files before adding a plugin or SDK with native code.

## Apple App Store

- **4.2, minimum functionality, is the main risk for a wrapped web app.** The app must be more than a repackaged website ([guidelines](https://developer.apple.com/app-store/review/guidelines/)).
  - Bundled assets only, no `server.url`, and no downloaded code that changes features (2.5.2).
  - **Offline behaviour is the usual weak point.** At minimum, say "offline" clearly instead of failing; a queued write that syncs later is better.
  - Native navigation, push tied to real events and haptics help. Describe them in the review notes.
- **4.8, login services.** An app that uses only its own email-and-password accounts needs no Sign in with Apple. Offering a third-party login brings 4.8 in, and in practice reviewers then ask for Sign in with Apple, so plan the two together.
- **5.1.1(v), account deletion:** started in the app, a real deletion, never "contact support". With Sign in with Apple, deletion also revokes the user's Apple tokens through the REST API ([offering account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/)).
- **Privacy:** the app's own `PrivacyInfo.xcprivacy` with a reason for each required-reason API; an App Privacy label that covers the app's data **plus** every SDK's ([third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/)); the privacy policy link in App Store Connect **and** inside the app (5.1.1(i)). No tracking prompt unless the app tracks.
- **Push (4.5.4):** the app works with push refused, and a notification carries no sensitive personal data to the lock screen. User-written text in a notification body counts: decide it with the product owner before submitting, never silently.
- **The reviewer may use an iPad, even for an iPhone-only app.** Reports describe "button not responsive" and a login that loops back to itself. The session must survive a cold start there. If the app runs natively on iPad, 13-inch screenshots (2064×2752) are required, and screenshots show the app in use, not the login screen (2.3.3).
- **App Store Connect forms that block a build or a review:**
  - **Export compliance:** `ITSAppUsesNonExemptEncryption = NO` in `Info.plist` for HTTPS-only apps; without it, TestFlight holds every build.
  - **Age rating:** the questionnaire introduced in 2026 (4+, 9+, 13+, 16+, 18+); answers were required by 2026-01-31 to keep submitting updates.
  - **EU DSA trader status:** required for EU distribution; a trader's address, phone and email are shown publicly.
  - **Medical device status** for EEA, UK and US distribution, reported as asked of new apps since March 2026 (re-check in App Store Connect): "no" is a valid answer for an app that is not one.
  - A support URL and a privacy policy URL.
- **Paid features on iOS go through In-App Purchase (3.1.1).** Linking out to an outside payment is allowed only on the storefronts Apple names (the US one, under 3.1.1(a)); elsewhere it is a rejection. Price and tier decisions that ignore this break on the first iOS submission.

## Language rules by market

- **Quebec:** the Charter of the French Language (s. 52.1) requires software sold there to be available in French on terms at least as favourable as other languages. Neither store requires French metadata, but a French listing follows from the same rule.
