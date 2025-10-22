# Cal3 Mobile - Deployment Guide

This document provides step-by-step instructions for deploying the Cal3 Mobile app to the Apple App Store and Google Play Store.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [iOS Deployment](#ios-deployment)
3. [Android Deployment](#android-deployment)
4. [Version Management](#version-management)
5. [Beta Testing](#beta-testing)
6. [Release Process](#release-process)
7. [Post-Release](#post-release)

---

## Pre-Deployment Checklist

Before deploying to production, ensure the following are complete:

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code reviewed and approved
- [ ] Performance profiling complete

### Configuration
- [ ] Production API URL configured
- [ ] Environment variables set correctly
- [ ] Analytics/crash reporting configured (Firebase, Sentry)
- [ ] App icons and splash screens created
- [ ] App metadata prepared (descriptions, screenshots, keywords)

### Testing
- [ ] Tested on real iOS devices (multiple models)
- [ ] Tested on real Android devices (multiple models/OS versions)
- [ ] Beta testing completed (TestFlight, Google Play Internal Testing)
- [ ] All critical user flows tested
- [ ] Offline mode tested
- [ ] Push notifications tested

### Legal
- [ ] Privacy policy updated and accessible
- [ ] Terms of service updated
- [ ] App Store listing complies with guidelines
- [ ] Required permissions explained to users

---

## iOS Deployment

### Prerequisites

1. **Apple Developer Account**: $99/year enrollment
2. **macOS** with Xcode installed
3. **App Store Connect** access
4. **Certificates and Provisioning Profiles**

### Step 1: Configure App in Xcode

1. Open project in Xcode:
   ```bash
   cd ios
   open Cal3Mobile.xcworkspace
   ```

2. Select project in navigator, then select target

3. **General Tab**:
   - **Display Name**: Cal3
   - **Bundle Identifier**: com.yourcompany.cal3 (must be unique)
   - **Version**: 1.0.0
   - **Build**: 1

4. **Signing & Capabilities**:
   - Select your team
   - Enable "Automatically manage signing"
   - Or manually configure:
     - Distribution certificate
     - App Store provisioning profile

### Step 2: Configure Build Settings

1. **Info.plist** - Add required permissions:
   ```xml
   <key>NSCalendarsUsageDescription</key>
   <string>Cal3 needs access to your calendar to sync events</string>

   <key>NSContactsUsageDescription</key>
   <string>Cal3 needs access to contacts for sharing events</string>

   <key>NSCameraUsageDescription</key>
   <string>Cal3 needs camera access to add photos to events</string>

   <key>NSPhotoLibraryUsageDescription</key>
   <string>Cal3 needs photo library access to add images</string>

   <key>NSFaceIDUsageDescription</key>
   <string>Cal3 uses Face ID for secure authentication</string>
   ```

2. **Build Configuration**:
   - Select "Release" scheme
   - Ensure "Generic iOS Device" is selected

### Step 3: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com/

2. **Apps** → **+** → **New App**:
   - **Platform**: iOS
   - **Name**: Cal3
   - **Primary Language**: English
   - **Bundle ID**: com.yourcompany.cal3
   - **SKU**: cal3-ios

3. **App Information**:
   - Category: Productivity
   - Subcategory: Business
   - Privacy Policy URL: https://yoursite.com/privacy

### Step 4: Build and Archive

1. In Xcode: **Product** → **Archive**

2. Wait for build to complete (several minutes)

3. **Organizer** window opens automatically:
   - Select your archive
   - Click **Distribute App**
   - Select **App Store Connect**
   - Select **Upload**
   - Choose signing options (automatic recommended)
   - Click **Upload**

4. Wait for upload to complete and processing to finish (10-30 minutes)

### Step 5: Prepare App Store Listing

1. In App Store Connect, select your app

2. **App Store** tab:
   - **App Preview and Screenshots**: Upload for all required device sizes
     - 6.7" (iPhone 14 Pro Max)
     - 6.5" (iPhone 11 Pro Max)
     - 5.5" (iPhone 8 Plus)

   - **Description**: Write compelling app description

   - **Keywords**: Add relevant keywords (max 100 characters)

   - **Support URL**: https://yoursite.com/support

   - **Marketing URL** (optional): https://yoursite.com/cal3

3. **Pricing and Availability**:
   - **Price**: Free
   - **Availability**: All countries or select specific countries

4. **App Privacy**:
   - Complete privacy questionnaire
   - Declare data collection practices

### Step 6: Submit for Review

1. Select build uploaded in Step 4

2. **Export Compliance**:
   - Does your app use encryption? Usually "No" for standard HTTPS

3. **Advertising Identifier**:
   - Does your app use the Advertising Identifier (IDFA)? Select if using ads/analytics

4. Click **Submit for Review**

5. **Review Time**: Typically 24-48 hours

### Step 7: App Store Review Process

**Common Rejection Reasons**:
- Missing required app functionality
- Crashes or bugs
- Incomplete app information
- Privacy policy issues
- In-app purchase issues
- Using private APIs

**If Rejected**:
1. Read rejection message carefully
2. Fix issues
3. Resubmit with explanation

---

## Android Deployment

### Prerequisites

1. **Google Play Console Account**: $25 one-time fee
2. **Signing Key**: For app signing
3. **Android Studio** installed

### Step 1: Generate Signing Key

```bash
cd android/app

# Generate keystore
keytool -genkeypair -v -storetype PKCS12 -keystore cal3-release.keystore -alias cal3-key -keyalg RSA -keysize 2048 -validity 10000

# Enter password and information
# Store keystore file securely - you can't recover it if lost!
```

### Step 2: Configure Gradle Signing

1. Create `android/gradle.properties`:
   ```
   MYAPP_RELEASE_STORE_FILE=cal3-release.keystore
   MYAPP_RELEASE_KEY_ALIAS=cal3-key
   MYAPP_RELEASE_STORE_PASSWORD=your-store-password
   MYAPP_RELEASE_KEY_PASSWORD=your-key-password
   ```

2. Edit `android/app/build.gradle`:
   ```gradle
   android {
       ...
       defaultConfig { ... }

       signingConfigs {
           release {
               if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                   storeFile file(MYAPP_RELEASE_STORE_FILE)
                   storePassword MYAPP_RELEASE_STORE_PASSWORD
                   keyAlias MYAPP_RELEASE_KEY_ALIAS
                   keyPassword MYAPP_RELEASE_KEY_PASSWORD
               }
           }
       }

       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

### Step 3: Build Release APK/AAB

**Build AAB (App Bundle - Recommended)**:
```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

**Build APK (Alternative)**:
```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Step 4: Create App in Google Play Console

1. Go to https://play.google.com/console/

2. **Create App**:
   - **App name**: Cal3
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free

3. **Set up your app**:
   - Complete all required sections

### Step 5: Prepare Store Listing

1. **Main Store Listing**:
   - **App name**: Cal3
   - **Short description**: Modern calendar & reservation management (max 80 chars)
   - **Full description**: Detailed app description (max 4000 chars)
   - **App icon**: 512x512 PNG
   - **Feature graphic**: 1024x500 JPG/PNG
   - **Phone screenshots**: At least 2, up to 8 (JPG/PNG)
   - **7-inch tablet screenshots**: At least 2 (optional but recommended)
   - **10-inch tablet screenshots**: At least 2 (optional)

2. **Categorization**:
   - **App category**: Productivity
   - **Tags**: Calendar, Events, Scheduling, Reservations

3. **Contact details**:
   - **Email**: support@yourcompany.com
   - **Phone** (optional)
   - **Website** (optional): https://yoursite.com

4. **Privacy Policy**:
   - URL: https://yoursite.com/privacy

### Step 6: Content Rating

1. **Start questionnaire**

2. Answer questions about app content

3. Review rating and apply

### Step 7: App Content

1. **Privacy & Security**:
   - Data safety form
   - Privacy policy
   - Advertising ID usage

2. **Target audience**:
   - Select age groups

3. **News apps** (if applicable)

4. **COVID-19 contact tracing** (No for Cal3)

5. **Data safety**:
   - Declare data collection and sharing practices

### Step 8: Upload Release

1. **Production** → **Releases** → **Create new release**

2. **Upload AAB**:
   - Click **Upload**
   - Select `app-release.aab`

3. **Release name**: 1.0.0

4. **Release notes**:
   ```
   Initial release of Cal3
   - Calendar management with multiple views
   - Event creation and management
   - Reservation system
   - Automation rules
   - User profiles and settings
   ```

5. Click **Save** → **Review release** → **Start rollout to Production**

### Step 9: Review Process

**Review Time**: Typically hours to a few days

**Common Rejection Reasons**:
- Permissions not justified
- Privacy policy issues
- Crashes or bugs
- Target API level too old
- Missing required content

---

## Version Management

### Versioning Format

Follow Semantic Versioning: **MAJOR.MINOR.PATCH**

- **MAJOR**: Breaking changes (2.0.0)
- **MINOR**: New features (1.1.0)
- **PATCH**: Bug fixes (1.0.1)

### iOS Version Updates

1. **Xcode**:
   - Increment **Version** (e.g., 1.0.0 → 1.1.0)
   - Increment **Build** (e.g., 1 → 2)

2. **package.json**:
   ```json
   {
     "version": "1.1.0"
   }
   ```

### Android Version Updates

1. **android/app/build.gradle**:
   ```gradle
   android {
       defaultConfig {
           versionCode 2          // Integer, increment by 1
           versionName "1.1.0"    // Semantic version
       }
   }
   ```

2. **package.json**:
   ```json
   {
     "version": "1.1.0"
   }
   ```

---

## Beta Testing

### iOS: TestFlight

1. **Upload build** (same as App Store submission)

2. **App Store Connect** → **TestFlight**:
   - **Internal Testing**: Up to 100 testers
     - Add testers by email
     - They get instant access

   - **External Testing**: Up to 10,000 testers
     - Requires beta app review
     - Public link or email invitations

3. **Testers install TestFlight app**:
   - Download from App Store
   - Accept email invitation
   - Install Cal3 beta

### Android: Google Play Internal Testing

1. **Google Play Console** → **Testing** → **Internal testing**

2. **Create new release**:
   - Upload AAB
   - Add release notes
   - Save and review

3. **Create tester list**:
   - Add testers by email
   - Or create email list

4. **Testers access beta**:
   - Share opt-in URL
   - Testers opt-in
   - Download from Play Store

---

## Release Process

### Pre-Release

1. **Code freeze**: No new features
2. **Final testing**: All platforms, all devices
3. **Version bump**: Update version numbers
4. **Update changelog**: Document changes
5. **Build release**: iOS archive + Android AAB

### Release

1. **Submit to stores**:
   - iOS: Upload to App Store Connect → Submit
   - Android: Upload to Play Console → Production

2. **Monitor review**:
   - Check email for updates
   - Respond to any questions

3. **Approval**:
   - iOS: Can schedule release date
   - Android: Usually live within hours

### Post-Release

1. **Monitor crashes**: Check Crashlytics, Sentry
2. **Monitor reviews**: Respond to user feedback
3. **Track metrics**: Downloads, active users, retention
4. **Prepare hotfix**: If critical bugs found

---

## Post-Release

### Monitoring

- **Crash Reporting**: Firebase Crashlytics, Sentry
- **Analytics**: Firebase Analytics, Google Analytics
- **User Feedback**: App Store/Play Store reviews
- **Performance**: Firebase Performance Monitoring

### Updating the App

1. **Fix bugs** or **add features**
2. **Test thoroughly**
3. **Increment version**
4. **Build and submit**
5. **Same process as initial release**

### Responding to Reviews

- Respond within 24-48 hours
- Be professional and helpful
- Thank users for positive reviews
- Address concerns in negative reviews
- Fix reported issues in next update

---

## Summary

This guide covers:
- ✅ iOS deployment to App Store
- ✅ Android deployment to Google Play
- ✅ Version management
- ✅ Beta testing (TestFlight, Internal Testing)
- ✅ Release process
- ✅ Post-release monitoring

For detailed development workflow, see [DEVELOPMENT.md](DEVELOPMENT.md).
