# Mobile E2E (Appium)

`npm run test:e2e:mobile`

Environment variables:

- `APPIUM_SERVER_URL` (default `http://127.0.0.1:4723`)
- `ANDROID_APP_PATH` or (`ANDROID_APP_PACKAGE` + `ANDROID_APP_ACTIVITY`)
- Optional: `ANDROID_DEVICE_ID`, `ADB_PATH`, `TEST_PUSH_NOTIFICATION`, `TEST_SENSOR_INTEGRATION`

If required variables are missing, the runner exits successfully with a skip notice.
