╔═══════════════════════════════════════════════════════════════╗
║                 CAL3 MOBILE APP BUILD SCRIPTS                 ║
║                          Quick Guide                          ║
╚═══════════════════════════════════════════════════════════════╝

📱 THREE SIMPLE WAYS TO BUILD YOUR ANDROID APK:

┌───────────────────────────────────────────────────────────────┐
│ 1. BASIC BUILD (No Installation)                              │
│    build-mobile.bat                                           │
│                                                               │
│    ✓ Builds frontend                                         │
│    ✓ Syncs Capacitor                                         │
│    ✓ Creates APK                                             │
│    ✓ Shows location and size                                 │
│                                                               │
│    Best for: Creating APK for distribution                   │
│    Time: ~2-3 minutes                                        │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ 2. BUILD + INSTALL + LAUNCH (Complete Workflow)               │
│    build-and-install-mobile.bat                               │
│                                                               │
│    ✓ Builds frontend                                         │
│    ✓ Syncs Capacitor                                         │
│    ✓ Creates APK                                             │
│    ✓ Detects connected devices                               │
│    ✓ Installs on device (optional)                           │
│    ✓ Launches app (optional)                                 │
│                                                               │
│    Best for: Full development workflow                       │
│    Time: ~2-3 minutes + installation                         │
│    Interactive: Prompts for install/launch                   │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ 3. QUICK REBUILD (Fast Incremental)                           │
│    rebuild-mobile-quick.bat                                   │
│                                                               │
│    ✓ Quick frontend build                                    │
│    ✓ Fast Capacitor sync                                     │
│    ✓ Incremental Gradle build                                │
│                                                               │
│    Best for: Rapid testing during development                │
│    Time: ~30-60 seconds (incremental)                        │
└───────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 OUTPUT APK LOCATION:
   frontend\android\app\build\outputs\apk\debug\app-debug.apk

📏 APK SIZE: ~4.1 MB

🔧 REQUIREMENTS:
   ✓ Node.js 18+
   ✓ Android SDK installed
   ✓ frontend/android/local.properties configured
   ✓ npm dependencies installed (npm install)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 QUICK START:

   1. Open Command Prompt (cmd)
   2. Navigate to project: cd C:\Users\ThinkPad\cal3
   3. Run: build-and-install-mobile.bat
   4. Follow the prompts!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 DETAILED DOCUMENTATION:
   See: MOBILE_BUILD_SCRIPTS.md
   Mobile App Guide: docs\MOBILE_APP.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐛 TROUBLESHOOTING:

   Build fails?
   → Check that frontend/android/local.properties exists
   → Run: cd frontend && npm install

   Device not detected?
   → Enable USB debugging on Android device
   → Run: adb devices

   Slow builds?
   → Use rebuild-mobile-quick.bat for incremental builds

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ DEVELOPMENT WORKFLOW EXAMPLE:

   1. Make changes to frontend code
   2. Run: rebuild-mobile-quick.bat (fast!)
   3. Test on emulator/device
   4. Repeat!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Version: 1.1.5
Last Updated: October 24, 2025
