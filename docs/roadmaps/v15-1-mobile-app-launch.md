# v15.1: Mobile App Launch

> **Status**: Future
> **Roadmap Version**: v15.1
> **Last Updated**: 2026-01-13
> **Target Completion**: TBD (after v15.0 completion + macOS access acquired)
> **Owner/Resourcing**: Solo dev + AI assistance
> **Prerequisites**: macOS access, Apple Developer Program ($99/year), Google Play Console ($25)
> **Note**: ⚠️ **Do NOT implement until user has macOS access and explicitly requests it**

This document is the **version definition and implementation plan** for v15.1, which completes the mobile app journey by **publishing native iOS and Android apps** to App Store and Google Play Store.

---

## 0) Executive Summary

### The Vision

v15.0 (Mobile-Ready Infrastructure) builds all the backend systems needed for native mobile apps: offline data storage, push notification infrastructure, mobile-optimized APIs, and deep linking configuration. However, the apps themselves cannot be published without:

1. **macOS Access**: Required for Xcode, iOS builds, and iOS simulator testing
2. **Apple Developer Program**: $99/year membership required for App Store distribution
3. **Google Play Console**: $25 one-time fee for Android app distribution

v15.1 completes the final mile by creating native app builds, generating App Store assets, passing App Store Review, and launching publicly.

### What v15.0 Provides (Already Built)

✅ **Infrastructure from v15.0**:

- Capacitor configuration (app structure defined)
- Offline data infrastructure (IndexedDB, sync, caching)
- Push notification backend (OneSignal, admin panel)
- Mobile-optimized API endpoints (`/api/v1/services/export`)
- Deep linking configuration files (`.well-known/`)
- Enhanced PWA offline experience

### What v15.1 Adds (Requires macOS)

🚀 **New in v15.1**:

- iOS app build configuration in Xcode
- Android app build configuration (if not done in v15.0)
- App icons and splash screens for both platforms
- App Store and Google Play Store metadata
- Screenshots for all required device sizes
- TestFlight beta testing (iOS)
- App Store Review submission and approval
- Google Play Review submission and approval
- Public app launch and ASO (App Store Optimization)

---

## 1) Prerequisites

### Must-Have Before Starting v15.1

1. **v15.0 Completion**: All offline, push, and API infrastructure must be functional and tested
2. **macOS Access**: Personal Mac, borrowed Mac, Mac mini, or GitHub Actions macOS runners
3. **Apple Developer Account**: Active membership ($99/year)
4. **Google Play Console**: Developer account registered ($25 one-time)
5. **Testing Devices**: At least one physical iOS device and one Android device (or cloud testing service)

### Recommended Before Starting

- [ ] v15.0 infrastructure running in production for 30+ days with no critical bugs
- [ ] Offline mode tested thoroughly on PWA
- [ ] Push notifications validated via web push
- [ ] Budget allocated for App Store fees and potential testing services

---

## 2) Implementation Overview

v15.1 focuses on **platform-specific builds, assets, testing, and distribution** since all backend work is complete.

### Timeline Estimate: 4-6 Weeks

| Phase       | Duration  | Description                                                    |
| :---------- | :-------- | :------------------------------------------------------------- |
| **Phase 1** | 3-5 days  | iOS Build Setup (Xcode configuration, signing)                 |
| **Phase 2** | 2-3 days  | Android Build Setup (if not done in v15.0)                     |
| **Phase 3** | 5-7 days  | App Assets (icons, splash screens, screenshots)                |
| **Phase 4** | 3-5 days  | Platform-Specific Polish (iOS safe areas, Android back button) |
| **Phase 5** | 7-10 days | Testing & QA (physical devices, beta testing)                  |
| **Phase 6** | 3-5 days  | App Store Submissions (metadata, review)                       |
| **Phase 7** | 2-3 days  | Launch & Monitoring (ASO, announcements)                       |

**Total**: 25-38 days (dependent on App Store review speed)

---

## 3) High-Level Task List

### Phase 1: iOS Build Setup (Days 1-5)

- [ ] Install Xcode 15+ on macOS
- [ ] Run `npx cap add ios` to create iOS project
- [ ] Open iOS project in Xcode
- [ ] Configure signing and capabilities:
  - [ ] App ID created in Apple Developer Portal
  - [ ] Push Notifications capability enabled
  - [ ] Associated Domains capability (for Universal Links)
  - [ ] Development and Distribution certificates generated
  - [ ] Provisioning profiles created
- [ ] Test app launches in iOS Simulator
- [ ] Connect physical iOS device and test build
- [ ] Verify offline mode works in native app
- [ ] Verify push notifications work (requires OneSignal native SDK integration)

### Phase 2: Android Build Setup (Days 6-8)

- [ ] Install Android Studio with SDK 34 (if not already done in v15.0)
- [ ] Run `npx cap add android` (if not already done in v15.0)
- [ ] Open Android project in Android Studio
- [ ] Configure signing:
  - [ ] Generate release keystore (`keystore.jks`)
  - [ ] Store keystore credentials securely
  - [ ] Update `capacitor.config.ts` with keystore path
- [ ] Test app launches in Android Emulator
- [ ] Test on physical Android device
- [ ] Verify offline mode works in native app
- [ ] Verify push notifications work

### Phase 3: App Assets (Days 9-15)

- [ ] Design app icon (1024x1024 master)
- [ ] Generate iOS icon set (all required sizes via Xcode Asset Catalog)
- [ ] Generate Android adaptive icon (foreground + background layers)
- [ ] Design splash screen
- [ ] Configure Capacitor Splash Screen plugin
- [ ] Generate iOS launch storyboard
- [ ] Generate Android splash screen (Android 12+ style)
- [ ] Capture screenshots:
  - [ ] iPhone 15 Pro Max (6.7")
  - [ ] iPhone 14 (6.1")
  - [ ] iPad Pro 12.9"
  - [ ] Android Phone (1080x1920)
  - [ ] Android Tablet (1200x1920)
- [ ] Add marketing text overlays to screenshots (optional)
- [ ] Prepare App Store metadata (description, keywords, promotional text)
- [ ] Prepare Google Play metadata (description, feature graphic)

### Phase 4: Platform-Specific Polish (Days 16-20)

**iOS**:

- [ ] Configure status bar style (light/dark based on theme)
- [ ] Handle safe area insets (notch, home indicator, Dynamic Island)
- [ ] Test on various iPhone sizes (SE, Mini, standard, Pro Max)
- [ ] Test on iPad (ensure responsive layout works)
- [ ] Configure keyboard avoidance for search input

**Android**:

- [ ] Configure status bar color to match app theme
- [ ] Handle Android back button behavior
- [ ] Test on various screen densities (mdpi to xxxhdpi)
- [ ] Test on Android tablets

**Both**:

- [ ] Test VoiceOver (iOS) and TalkBack (Android)
- [ ] Verify all touch targets are 44pt+ (iOS) / 48dp+ (Android)
- [ ] Test Dynamic Type (iOS) / Font scaling (Android)

### Phase 5: Testing & QA (Days 21-30)

**Beta Testing**:

- [ ] Set up TestFlight for iOS beta distribution
- [ ] Upload first iOS build to TestFlight
- [ ] Recruit 5-10 beta testers (community members, partners)
- [ ] Set up Google Play Internal Testing track
- [ ] Upload first Android build to Internal Testing
- [ ] Collect feedback via in-app feedback or form
- [ ] Run beta for minimum 7 days
- [ ] Fix critical bugs identified in beta

**Device Testing Matrix** (see full matrix in original v15.0 plan):

- [ ] Test on iPhone 15 Pro (iOS 17)
- [ ] Test on iPhone SE 3rd gen (iOS 16)
- [ ] Test on iPad Pro 12.9" (iPadOS 17)
- [ ] Test on Pixel 8 (Android 14)
- [ ] Test on Samsung Galaxy S23 (Android 14)
- [ ] Test on budget Android device (Android 12)

**Critical Test Scenarios**:

- [ ] Fresh install → Data downloads → Search works
- [ ] Go offline → Search continues to work
- [ ] Receive push notification → Tap opens correct service
- [ ] Share service → Native share sheet appears
- [ ] Open universal link (iOS) / app link (Android) → App opens to correct page
- [ ] Kill app → Reopen → Data persisted

### Phase 6: App Store Submissions (Days 31-35)

**iOS App Store**:

- [ ] Archive build in Xcode (Release configuration)
- [ ] Upload to App Store Connect via Xcode or Transporter
- [ ] Complete app information in App Store Connect:
  - [ ] App name, subtitle, description
  - [ ] Keywords, categories
  - [ ] Screenshots (all required sizes)
  - [ ] Privacy policy URL
  - [ ] Support URL, marketing URL
- [ ] Complete App Privacy questionnaire (minimal data collection)
- [ ] Submit for review
- [ ] Monitor review status (typically 24-48 hours)
- [ ] Respond to any reviewer questions promptly

**Google Play Store**:

- [ ] Generate signed AAB (Android App Bundle)
- [ ] Create release in Google Play Console
- [ ] Complete store listing:
  - [ ] Title, short description, full description
  - [ ] Screenshots, feature graphic
  - [ ] Category, contact details
- [ ] Complete Data Safety section (minimal data collection)
- [ ] Submit for review (Production track)
- [ ] Monitor review status (typically 1-7 days)

### Phase 7: Launch & Monitoring (Days 36-38)

**Launch Activities**:

- [ ] Announce on website homepage: "Now on iOS and Android"
- [ ] Add App Store badges to website
- [ ] Post to social media (Twitter, LinkedIn, Facebook)
- [ ] Email partners about mobile app availability
- [ ] Submit to local news outlets (optional)
- [ ] Update Google My Business / local directories

**Monitoring**:

- [ ] Set up crash reporting (Sentry or Firebase Crashlytics)
- [ ] Monitor crash-free rate (target: >99%)
- [ ] Track app launches and performance
- [ ] Monitor App Store reviews and respond promptly
- [ ] Track install sources (App Store Analytics)
- [ ] Set up alerts for crash rate spikes

**ASO (App Store Optimization)**:

- [ ] Monitor search rankings for target keywords
- [ ] A/B test screenshots if supported (Google Play)
- [ ] Request reviews from satisfied users (after 5+ uses)
- [ ] Iterate on keywords based on performance

---

## 4) Definition of Done (DoD)

v15.1 is considered "done" when:

**App Store Distribution**:

- [ ] Kingston Care Connect live on Apple App Store (iOS 15+)
- [ ] Kingston Care Connect live on Google Play Store (Android 8.0+)
- [ ] Apps discoverable via search: "Kingston social services"
- [ ] No pending App Store rejections or compliance issues

**Quality Metrics**:

- [ ] App rating ≥ 4.0 on both stores after first 30 days
- [ ] Crash-free rate ≥ 99%
- [ ] Cold start time ≤ 3 seconds on mid-range devices
- [ ] 500+ installs in first 90 days (combined iOS + Android)

**Functionality**:

- [ ] All v15.0 features work in native apps (offline, push, search)
- [ ] Deep links open app to correct page
- [ ] Share button works via native share sheets
- [ ] No regressions from PWA functionality

**Documentation**:

- [ ] App Store URLs added to website
- [ ] Mobile development guide updated (`docs/development/mobile-dev.md`)
- [ ] Runbook created for future app updates

---

## 5) Success Metrics

### Quantitative (90 Days Post-Launch)

1. **Install Rate**: 500+ total installs (iOS + Android)
2. **Retention**: 30-day retention rate ≥ 20%
3. **Offline Usage**: ≥ 10% of sessions occur offline
4. **Push Opt-In**: ≥ 15% of users enable notifications
5. **Crash-Free Rate**: ≥ 99.5%
6. **App Rating**: ≥ 4.5 stars on both stores
7. **Review Count**: ≥ 10 reviews per store

### Qualitative

1. **Frontline Worker Adoption**: At least 3 shelters/organizations using offline mode
2. **User Testimonials**: At least 5 positive reviews mentioning offline or accessibility
3. **Partner Recognition**: Positive feedback from service providers on app availability
4. **Media Coverage**: At least 1 local news mention of mobile app launch

### Strategic

1. **Grant Applications**: "Available on iOS and Android" included in 2+ funding proposals
2. **Community Expansion**: App enables pilot in neighboring municipality (e.g., Frontenac)
3. **Partnership Discussions**: Mobile availability referenced in 3+ partnership conversations

---

## 6) Risks & Mitigations

| Risk                                   | Impact   | Likelihood | Mitigation                                                                                  |
| :------------------------------------- | :------- | :--------- | :------------------------------------------------------------------------------------------ |
| **Apple rejects app (Guideline 4.2)**  | High     | Medium     | Emphasize offline utility, verified data quality; prepare appeal with community impact data |
| **iOS WebView incompatibilities**      | Medium   | Low        | Test thoroughly in simulator and physical devices; fallback to web for unsupported features |
| **App Store review delayed (>7 days)** | Medium   | Low        | Submit well before any deadline; respond to reviewers within 24 hours                       |
| **Low install rate (<100 in 90 days)** | Medium   | Medium     | Invest in ASO, social media promotion, partner outreach; iterate on app description         |
| **Crash rate spikes post-launch**      | High     | Low        | Comprehensive testing in Phase 5; crash monitoring with alerts; hotfix process ready        |
| **macOS hardware unavailable**         | Critical | Low        | Secure Mac access before starting; GitHub Actions macOS runners as fallback for CI          |

---

## 7) Cost Estimate

| Item                             | Cost    | Frequency | Notes                                                           |
| :------------------------------- | :------ | :-------- | :-------------------------------------------------------------- |
| **Apple Developer Program**      | $99     | Annual    | Required for App Store distribution                             |
| **Google Play Console**          | $25     | One-time  | Required for Play Store distribution                            |
| **macOS Hardware**               | $0-$600 | One-time  | Personal Mac (free), Mac mini (~$600), or cloud Mac ($30-50/mo) |
| **Testing Devices**              | $0-$500 | One-time  | Use personal devices, borrow, or cloud testing (BrowserStack)   |
| **OneSignal (beyond free tier)** | $0-$99  | Monthly   | Free for 10k subscribers; upgrade if needed                     |
| **Crashlytics / Sentry**         | $0-$26  | Monthly   | Free tier sufficient for launch; upgrade if needed              |

**Total Initial Cost**: $124 - $1,224 (depending on hardware needs)
**Total Annual Cost**: $99 - $297 (Apple + optional services)

---

## 8) Post-Launch Roadmap (v15.2+)

### v15.2: Analytics & Optimization

- Privacy-preserving usage analytics (aggregate counts only)
- A/B test onboarding flow and push opt-in timing
- Optimize cold start performance based on real device data
- In-app review prompt with smart timing

### v15.3: Enhanced Offline Features

- Offline map tiles for service locations (if feasible)
- Offline "recently viewed" history
- Automatic background sync (Capacitor Background Task)
- Offline search suggestions based on usage patterns

### v15.4: Notification Enhancements

- Topic-based subscriptions (Housing alerts, Crisis alerts, etc.)
- Partner-triggered notifications (service hours changed)
- Rich notifications with images (iOS 15+, Android)
- Notification history screen in-app

### v15.5: Platform-Specific Features

- iOS Widgets (Service of the day, Crisis hotlines)
- iOS Live Activities (Emergency alerts)
- Android Quick Settings Tile (Open search)
- Siri Shortcuts / Google Assistant integration

---

## 9) Appendices

### Appendix A: Required macOS Software

- **macOS Version**: Sonoma (14.0) or later
- **Xcode Version**: 15.0 or later
- **Command Line Tools**: `xcode-select --install`
- **CocoaPods**: `sudo gem install cocoapods` (if needed for plugins)
- **iOS Simulator**: Included with Xcode

### Appendix B: GitHub Actions macOS Runners (Alternative)

If purchasing Mac hardware is not feasible, GitHub Actions provides macOS runners for CI/CD:

**Pros**:

- No hardware investment
- Integrated with repository
- Supports automated builds and TestFlight uploads

**Cons**:

- Cannot interactively debug in Xcode
- Costs $0.08/minute for private repos (free for public repos)
- Requires scripting all build steps

**Recommendation**: Use for automated builds; borrow Mac for initial setup and debugging.

### Appendix C: App Store Review Tips

**Common Rejection Reasons**:

1. **Guideline 4.2 (Minimum Functionality)**: App must provide sufficient value
   - **Mitigation**: Emphasize offline utility, 196 verified services, 7 languages
2. **Guideline 5.1.1 (Privacy)**: Privacy policy must be accessible
   - **Mitigation**: Ensure privacy policy URL works in-app and in metadata
3. **Guideline 2.1 (App Completeness)**: App must not crash
   - **Mitigation**: Test thoroughly; crash-free rate >99.5% in beta

**Expedited Review**:

- Available for critical bug fixes or time-sensitive updates
- Requires justification; use sparingly

**Responding to Reviewers**:

- Respond within 24 hours with detailed explanations
- Include screenshots or screen recordings demonstrating features
- Be polite and professional; reviewers are allies, not adversaries

---

**Document Version**: 1.0
**Last Updated**: 2026-01-13
**Status**: Placeholder (Do Not Implement Until Prerequisites Met)

---

## Important Reminders

⚠️ **Do NOT start v15.1 until**:

1. v15.0 (Mobile-Ready Infrastructure) is fully complete and tested
2. macOS access is secured (personal, borrowed, or cloud)
3. Apple Developer Program membership is active
4. Google Play Console account is registered
5. User explicitly requests mobile app launch implementation

✅ **When Prerequisites Are Met**:

- Review this document for any updates since v15.0 completion
- Verify all v15.0 infrastructure is functional in production
- Allocate 4-6 weeks for implementation
- Budget for $124+ in one-time costs and $99/year ongoing

---

**Next Steps**: Complete v15.0 first. When macOS access is available and user is ready, return to this document to begin v15.1 implementation.
