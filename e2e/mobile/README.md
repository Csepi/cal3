# Mobile E2E (Appium)

`npm run test:e2e:mobile:native`

Environment variables:

- `APPIUM_SERVER_URL` (default `http://127.0.0.1:4723`)
- `ANDROID_APP_PATH` or (`ANDROID_APP_PACKAGE` + `ANDROID_APP_ACTIVITY`)
- Optional: `ANDROID_DEVICE_ID`, `ADB_PATH`, `TEST_PUSH_NOTIFICATION`, `TEST_SENSOR_INTEGRATION`
- Optional mobile i18n scenario:
  - `MOBILE_I18N_SCENARIO=true`
  - `MOBILE_I18N_SETTINGS_SELECTOR`
  - `MOBILE_I18N_ASSERTION_SELECTOR`
  - Either `MOBILE_I18N_CASES` (JSON array of `{ optionSelector, expectedText }`) or both `MOBILE_I18N_OPTION_SELECTOR` + `MOBILE_I18N_EXPECTED_TEXT`
  - Optional: `MOBILE_I18N_CONFIRM_SELECTOR`

If required variables are missing, the runner exits successfully with a skip notice.
