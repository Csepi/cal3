---
title: "Creating Your Account"
description: "End-to-end guide for registration and onboarding, including field rules, wizard steps, and the API behind them."
category: Getting Started
audience: End User
difficulty: Beginner
last_updated: 2026-03-27
version: 1.3.0
hide_title: true
related:
  - ../quick-start-guide.md
  - ./initial-setup.md
  - ../../index.md
tags: [getting-started, account, registration, onboarding, auth]
---

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Getting Started • Account Setup</p>
  <h1 class="pc-guide-hero__title">Create Your Account</h1>
  <p class="pc-guide-hero__lead">This page follows the full account path from the current PrimeCalendar product: the sign-up form, live field validation, the 5-step onboarding wizard, required consent capture, and the final API handoff that unlocks the app.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">3 visible registration fields</span>
    <span class="pc-guide-chip">5 onboarding steps</span>
    <span class="pc-guide-chip">2 skippable wizard steps</span>
  </div>
</div>

## Flow Summary

<div class="pc-guide-flow">
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">1</div>
    <h3>Open Sign Up</h3>
    <p>Switch the auth screen from sign-in to <code>Sign up</code> mode.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">2</div>
    <h3>Pass Validation</h3>
    <p>Submit a unique username, a unique email address, and a strong password.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">3</div>
    <h3>Enter Wizard</h3>
    <p>The app signs you in immediately and routes incomplete accounts into <code>/onboarding</code>.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">4</div>
    <h3>Complete Setup</h3>
    <p>Save profile, preferences, compliance, and calendar-preference data through <code>Complete Setup</code>.</p>
  </article>
</div>

## Before You Start

- Open PrimeCalendar in a browser.
- If you are already signed in, sign out first so you can see the registration screen.
- If your deployment uses Google or Microsoft SSO, those buttons may appear below the email/password form, but the self-service flow documented here uses the standard registration path.

## Step 1: Register On The Sign-In Screen

When you open the app while signed out, the login screen is shown first. To create a new account:

1. Click `Sign up` under the main submit button.
2. Fill in `Username`, `Email address`, and `Password`.
3. Wait for the live username and email availability checks to settle.
4. Click `Create account`.

<div class="pc-guide-shot">
  <p class="pc-guide-shot__eyebrow">Screenshot Placeholder</p>
  <h3 class="pc-guide-shot__title">Sign-Up Panel</h3>
  <p class="pc-guide-shot__note">Replace this block with the auth form in sign-up mode, showing the username, email, and password inputs plus the <code>Create account</code> button.</p>
</div>

### Registration Fields

| Field | Shown in current UI | Type | Required | Constraints and behavior |
| --- | --- | --- | --- | --- |
| `username` | Yes | string | Yes | 3-64 characters. Letters, numbers, dots, and underscores only. Live availability check calls `GET /api/auth/username-availability`. Must be unique. |
| `email` | Yes | string | Yes | Must be a valid email address. Backend max length is 254 characters. Live availability check calls `GET /api/auth/email-availability`. Must be unique. |
| `password` | Yes | string | Yes | Effective rule is 10-128 characters with at least one lowercase letter, one uppercase letter, one number, and one special character. |
| `firstName` | No | string | No | API supports it at registration, max 80 characters, safe text only. Current self-service registration UI does not expose it. |
| `lastName` | No | string | No | API supports it at registration, max 80 characters, safe text only. Current self-service registration UI does not expose it. |
| `role` | No | enum | No | API-only field intended for controlled or admin use. Self-service users do not pick a role in the UI. |

### What Happens After Successful Registration

- The app immediately creates a signed-in session from the registration response.
- Browser clients receive an access token plus a refresh-token cookie.
- The user record is stored with `onboardingCompleted = false`.
- The route guard redirects the user into `/onboarding` until setup is finished.
- A private `Tasks` calendar is created automatically in the background for task integration.

## Step 2: Complete The Onboarding Wizard

The current wizard has 5 steps. The progress bar and `Step x of 5` indicator advance as you move through the flow.

<div class="pc-guide-shot">
  <p class="pc-guide-shot__eyebrow">Screenshot Placeholder</p>
  <h3 class="pc-guide-shot__title">Onboarding Progress Header</h3>
  <p class="pc-guide-shot__note">Capture the wizard header with the progress indicator and current step label visible.</p>
</div>

### Wizard Structure

| Step | Screen | Can skip? | Purpose |
| --- | --- | --- | --- |
| 1 | Welcome | No | Capture basic profile details and optional Gravatar profile image |
| 2 | Personalization | Yes | Save language, timezone, time format, week start, default view, and theme |
| 3 | Privacy & Compliance | No | Accept required policies and optionally opt into product updates |
| 4 | Calendar Preferences | Yes | Save intended usage and future sync preferences |
| 5 | Review & Complete | No | Review choices and submit `POST /api/auth/complete-onboarding` |

<div class="pc-guide-flow">
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">1</div>
    <h3>Welcome</h3>
    <p>Optional name fields plus the current Gravatar-based profile image path.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">2</div>
    <h3>Personalization</h3>
    <p>Language, timezone, time format, week start day, default view, and theme color.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">3</div>
    <h3>Privacy</h3>
    <p>Both legal consents are required and block progress until checked.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">4</div>
    <h3>Calendar Preferences</h3>
    <p>Usage intent plus beta-disabled sync choices for Google and Microsoft.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">5</div>
    <h3>Review</h3>
    <p>Read-only summary before the final <code>Complete Setup</code> submission.</p>
  </article>
</div>

### Step 1: Welcome

The current UI does not ask you to re-enter email or username here. It uses the registration values already stored in session state.

| Field | Shown in current UI | Type | Required | Constraints and behavior |
| --- | --- | --- | --- | --- |
| `firstName` | Yes | string | No | Optional. Backend max 80 characters. |
| `lastName` | Yes | string | No | Optional. Backend max 80 characters. |
| Gravatar profile image | Yes | derived URL | No | Generated from the account email. Click `Use Gravatar Photo` to save the selected URL. |
| `profilePictureUrl` | Indirectly | string URL | No | Backend accepts an HTTP or HTTPS URL up to 2048 characters. Current UI only exposes the Gravatar path. Direct upload is not available in beta. |
| `username` | No | string | No in API | Backend can accept a username update during onboarding, but the current wizard keeps the registration username instead of exposing a dedicated edit field. |

### Step 2: Personalization

You can move forward immediately because the wizard is prefilled from current profile data or safe defaults. If you click `Skip for now`, the wizard resets this step to defaults before continuing.

| Field | Type | Required | Constraints and behavior |
| --- | --- | --- | --- |
| `language` | enum | Yes | One of `en`, `de`, `fr`, `hu`. Default falls back to `en`. |
| `timezone` | string | Yes | Must be a valid IANA timezone such as `Europe/Budapest` or `America/New_York`. The UI offers the current timezone plus a curated common list, but the backend accepts any valid IANA timezone. |
| `timeFormat` | enum | Yes | `12h` or `24h`. Default is `24h`. |
| `weekStartDay` | integer | Yes | 0-6 where `0 = Sunday` and `6 = Saturday`. Default is `1` (Monday). |
| `defaultCalendarView` | enum | Yes | `month` or `week`. Default is `month`. |
| `themeColor` | hex color | Yes | Must be one of the supported palette values listed below. Default is `#3b82f6`. |

Supported theme colors:
`#ef4444`, `#f59e0b`, `#eab308`, `#84cc16`, `#10b981`, `#22c55e`, `#14b8a6`, `#06b6d4`, `#0ea5e9`, `#3b82f6`, `#6366f1`, `#7c3aed`, `#8b5cf6`, `#ec4899`, `#f43f5e`, `#64748b`

### Step 3: Privacy & Compliance

This is the first step that cannot be skipped by design. The `Next` button stays disabled until both required checkboxes are enabled.

| Field | Type | Required | Constraints and behavior |
| --- | --- | --- | --- |
| `privacyPolicyAccepted` | boolean | Yes | Must be `true`. |
| `termsOfServiceAccepted` | boolean | Yes | Must be `true`. |
| `productUpdatesEmailConsent` | boolean | No | Optional marketing or product update consent. |
| `privacyPolicyVersion` | string | Auto-supplied | Comes from runtime config or falls back to `v1.0`. |
| `termsOfServiceVersion` | string | Auto-supplied | Comes from runtime config or falls back to `v1.0`. |

The policy links themselves are also runtime-configurable, so production deployments can point to real legal URLs without code changes.

### Step 4: Calendar Preferences

This step is intentionally lightweight in the current build.

| Field | Type | Required | Constraints and behavior |
| --- | --- | --- | --- |
| `calendarUseCase` | enum | No | One of `personal`, `business`, `team`, `other`. |
| `setupGoogleCalendarSync` | boolean | No | Present in the payload, but the current UI keeps the checkbox disabled in beta. |
| `setupMicrosoftCalendarSync` | boolean | No | Present in the payload, but the current UI keeps the checkbox disabled in beta. |

If you click `Skip for now`, the wizard clears this step back to:

- `calendarUseCase = undefined`
- `setupGoogleCalendarSync = false`
- `setupMicrosoftCalendarSync = false`

### Step 5: Review & Complete

The review screen is read-only. It shows the final values that will be submitted when you click `Complete Setup`.

On success:

- the backend marks `onboardingCompleted = true`
- `onboardingCompletedAt` is stored
- consent records are appended for privacy policy, terms of service, and marketing email
- the UI shows `Setup complete`
- the app redirects to `/app` after about 2 seconds

<div class="pc-guide-shot">
  <p class="pc-guide-shot__eyebrow">Screenshot Placeholder</p>
  <h3 class="pc-guide-shot__title">Review And Complete</h3>
  <p class="pc-guide-shot__note">Show the review step with the final summary and the <code>Complete Setup</code> button.</p>
</div>

## API Review

<div class="pc-guide-api-grid">
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Registration Submit</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
    </div>
    <h3><code>/api/auth/register</code></h3>
    <p>Creates the user, returns an authenticated session, and starts the onboarding-required flow.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Live Username Check</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--get">GET</span>
    </div>
    <h3><code>/api/auth/username-availability</code></h3>
    <p>Supports the debounced username uniqueness and format validation shown on the registration form.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Live Email Check</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--get">GET</span>
    </div>
    <h3><code>/api/auth/email-availability</code></h3>
    <p>Supports live email uniqueness validation once the form has enough input to check.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Profile State</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--get">GET</span>
    </div>
    <h3><code>/api/auth/profile</code></h3>
    <p>Used by the app when it needs to confirm the current user profile and onboarding status.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Wizard Completion</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
    </div>
    <h3><code>/api/auth/complete-onboarding</code></h3>
    <p>Saves the final onboarding payload including consents, preferences, use case, and sync-request flags.</p>
  </article>
</div>

## Notes For Documentation Maintainers

- The current registration UI is smaller than the registration DTO. Do not document `firstName`, `lastName`, or `role` as visible self-service fields.
- The current onboarding UI is also smaller than the onboarding DTO. Do not document username editing or direct profile-picture upload as visible wizard controls.
- Add screenshots after these points:
- sign-up mode
- welcome step
- personalization step
- compliance step
- review screen
