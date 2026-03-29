---
title: Creating Your Account
description: Register in PrimeCal, complete the onboarding wizard, and understand the exact fields and required decisions shown to new users.
category: Getting Started
audience: End User
difficulty: Beginner
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../quick-start-guide.md
  - ./initial-setup.md
  - ../../USER-GUIDE/profile/profile-page.md
tags: [primecal, registration, onboarding, account]
---

# Creating Your Account

PrimeCal starts with a compact sign-up form, then moves immediately into a five-step onboarding wizard. The goal is to collect only the information needed to make the calendar usable from the first session.

## Step 1: Open Sign Up

1. Open the PrimeCal sign-in page.
2. Switch to `Sign up`.
3. Fill the three visible fields.
4. Submit `Create account`.

![PrimeCal sign-up form before entering details](../../assets/getting-started/sign-up-screen.png)

![PrimeCal sign-up form with all required fields filled](../../assets/getting-started/sign-up-form-complete.png)

## Registration Fields

| Field | Required | What to enter | Rules and constraints |
| --- | --- | --- | --- |
| Username | Yes | Your public account name | 3 to 64 characters. Use letters, numbers, dots, or underscores. Must be unique. |
| Email address | Yes | Your sign-in email | Must be a valid email address and must be unique. |
| Password | Yes | A secure password | Minimum 6 characters. The password helper must show a valid result before you continue. |

## What Happens After Registration

After the account is created, PrimeCal signs you in and opens the onboarding wizard automatically. Until that wizard is finished, the product keeps you on the setup path instead of dropping you into the main workspace.

## Step 2: Complete The Five Wizard Steps

### 1. Welcome Profile

- Optional first name
- Optional last name
- Optional Gravatar-based profile image

![PrimeCal onboarding welcome step with profile fields](../../assets/getting-started/registration-onboarding-step-1-filled.png)

### 2. Personalization

- Language
- Timezone
- Time format
- Week start day
- Default calendar view
- Theme color

![PrimeCal personalization step with language, timezone, time format, week start, and theme](../../assets/getting-started/registration-onboarding-step-2-personalization.png)

### 3. Privacy And Consent

- Privacy policy acceptance: required
- Terms of service acceptance: required
- Product updates by email: optional

You cannot complete setup until both required checkboxes are accepted.

![PrimeCal compliance step with required privacy and terms checkboxes](../../assets/getting-started/registration-onboarding-step-3-compliance.png)

### 4. Calendar Preferences

- Main use case: personal, business, team, or other
- Optional request to connect Google Calendar later
- Optional request to connect Microsoft Calendar later

![PrimeCal calendar preferences step with use case and sync choices](../../assets/getting-started/registration-onboarding-step-4-calendar-preferences.png)

### 5. Review

PrimeCal shows a summary of the choices you made so you can confirm them before `Complete Setup`.

![PrimeCal onboarding review step before final completion](../../assets/getting-started/registration-onboarding-step-5-review.png)

## After Setup

When the wizard finishes, PrimeCal sends you into the main app with:

- your profile basics saved
- your locale and view preferences applied
- privacy acceptance recorded
- a default `Tasks` calendar already created for you

Your next step should be [Initial Setup](./initial-setup.md), where you create a normal calendar and organize your sidebar.

## Best Practices

- Pick the timezone carefully on first run because it affects every event you create afterward.
- Use a distinct username you are comfortable sharing with collaborators.
- Treat the optional sync toggles as later setup choices, not something you must finish before using the app.
- Go back to the [Profile Page](../../USER-GUIDE/profile/profile-page.md) later if you want to refine labels, focus behavior, or appearance.

## Developer Reference

If you are implementing or testing the registration flow, use the [Authentication API](../../DEVELOPER-GUIDE/api-reference/authentication-api.md).
