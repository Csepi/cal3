# ==================================================================================================
# Cal3 Mobile - ProGuard Rules
# ==================================================================================================
# This file contains ProGuard rules for code obfuscation and optimization in release builds.
# Add project-specific keep rules here to prevent ProGuard from removing required code.
# ==================================================================================================

# ==================================================================================================
# React Native Core
# ==================================================================================================

# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep ReactNativeHost implementation
-keep class * extends com.facebook.react.ReactNativeHost { *; }

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep React Native's JavaScript interface
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# Keep line numbers for crash reports
-keepattributes SourceFile,LineNumberTable

# Rename source file attribute to hide original source file name
-renamesourcefileattribute SourceFile

# ==================================================================================================
# React Native New Architecture (Fabric & TurboModules)
# ==================================================================================================

# Keep TurboModule classes
-keep class com.facebook.react.turbomodule.** { *; }

# Keep Fabric classes
-keep class com.facebook.react.fabric.** { *; }

# Keep ReactPackageTurboModuleManagerDelegate
-keep class * extends com.facebook.react.ReactPackageTurboModuleManagerDelegate { *; }

# ==================================================================================================
# React Native Libraries
# ==================================================================================================

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native Keychain
-keep class com.oblador.keychain.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Navigation
-keep class com.reactnavigation.** { *; }
-keep class com.swmansion.** { *; }

# ==================================================================================================
# AndroidX & Support Libraries
# ==================================================================================================

# Keep AndroidX classes
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# MultiDex
-keep class androidx.multidex.** { *; }

# ==================================================================================================
# Kotlin
# ==================================================================================================

# Keep Kotlin metadata
-keep class kotlin.Metadata { *; }
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# Keep Kotlin coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# ==================================================================================================
# JSON & Serialization
# ==================================================================================================

# Keep Gson classes (if used)
-keep class com.google.gson.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep data classes for JSON parsing
-keepclassmembers class * {
    public <init>(...);
}

# ==================================================================================================
# Networking
# ==================================================================================================

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Retrofit (if used)
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# ==================================================================================================
# Crash Reporting & Analytics
# ==================================================================================================

# Keep stack trace information for better crash reports
-keepattributes Exceptions,InnerClasses,Signature,Deprecated,EnclosingMethod

# ==================================================================================================
# Optimization Settings
# ==================================================================================================

# Optimize and shrink code
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify

# Don't warn about missing classes (common in multi-module projects)
-dontwarn com.facebook.react.**
-dontwarn java.nio.file.*
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement

# ==================================================================================================
# Custom Application Classes
# ==================================================================================================

# Keep your application classes
-keep class com.cal3mobile.** { *; }

# Keep models/entities (add your data classes here)
# -keep class com.cal3mobile.models.** { *; }
# -keep class com.cal3mobile.entities.** { *; }

# ==================================================================================================
# End of ProGuard Rules
# ==================================================================================================
