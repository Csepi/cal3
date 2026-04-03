#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const APPIUM_SERVER_URL = process.env.APPIUM_SERVER_URL ?? 'http://127.0.0.1:4723';
const ANDROID_APP_PATH = process.env.ANDROID_APP_PATH;
const ANDROID_APP_PACKAGE = process.env.ANDROID_APP_PACKAGE;
const ANDROID_APP_ACTIVITY = process.env.ANDROID_APP_ACTIVITY;
const ANDROID_DEVICE_NAME = process.env.ANDROID_DEVICE_NAME ?? 'Android Emulator';
const ANDROID_PLATFORM_VERSION = process.env.ANDROID_PLATFORM_VERSION;
const ADB_PATH = process.env.ADB_PATH ?? 'adb';
const ANDROID_DEVICE_ID = process.env.ANDROID_DEVICE_ID;
const MOBILE_I18N_SCENARIO = process.env.MOBILE_I18N_SCENARIO === 'true';
const MOBILE_I18N_SETTINGS_SELECTOR = process.env.MOBILE_I18N_SETTINGS_SELECTOR;
const MOBILE_I18N_ASSERTION_SELECTOR =
  process.env.MOBILE_I18N_ASSERTION_SELECTOR;
const MOBILE_I18N_CONFIRM_SELECTOR = process.env.MOBILE_I18N_CONFIRM_SELECTOR;
const MOBILE_I18N_CASES = process.env.MOBILE_I18N_CASES;
const MOBILE_I18N_OPTION_SELECTOR = process.env.MOBILE_I18N_OPTION_SELECTOR;
const MOBILE_I18N_EXPECTED_TEXT = process.env.MOBILE_I18N_EXPECTED_TEXT;

const log = (message) => console.log(`[mobile-e2e] ${message}`);

const hasAppReference =
  (typeof ANDROID_APP_PATH === 'string' && ANDROID_APP_PATH.length > 0) ||
  (typeof ANDROID_APP_PACKAGE === 'string' && ANDROID_APP_PACKAGE.length > 0);

if (!hasAppReference) {
  log(
    'Skipping mobile tests. Set ANDROID_APP_PATH or ANDROID_APP_PACKAGE/ANDROID_APP_ACTIVITY to execute Appium tests.',
  );
  process.exit(0);
}

if (ANDROID_APP_PATH && !existsSync(ANDROID_APP_PATH)) {
  console.error(`[mobile-e2e] ANDROID_APP_PATH does not exist: ${ANDROID_APP_PATH}`);
  process.exit(1);
}

const runAdb = (args) => {
  const result = spawnSync(ADB_PATH, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`adb command failed: ${ADB_PATH} ${args.join(' ')}`);
  }
};

const runOfflineScenario = async (driver) => {
  if (!ANDROID_DEVICE_ID) {
    log('Offline scenario skipped (ANDROID_DEVICE_ID not set).');
    return;
  }

  log('Running offline scenario via adb wifi toggle.');
  runAdb(['-s', ANDROID_DEVICE_ID, 'shell', 'svc', 'wifi', 'disable']);
  await driver.pause(2000);
  runAdb(['-s', ANDROID_DEVICE_ID, 'shell', 'svc', 'wifi', 'enable']);
  await driver.pause(2000);
};

const runLifecycleScenario = async (driver) => {
  log('Running lifecycle scenario (background + foreground).');
  await driver.background(2);

  if (ANDROID_APP_PACKAGE && ANDROID_APP_ACTIVITY) {
    await driver.activateApp(ANDROID_APP_PACKAGE);
  }

  await driver.pause(1000);
};

const runPushScenario = async () => {
  if (process.env.TEST_PUSH_NOTIFICATION !== 'true') {
    log('Push notification scenario skipped (TEST_PUSH_NOTIFICATION not true).');
    return;
  }
  log('Push notification scenario is environment-specific and requires external trigger orchestration.');
};

const runSensorScenario = async () => {
  if (process.env.TEST_SENSOR_INTEGRATION !== 'true') {
    log('Sensor/camera scenario skipped (TEST_SENSOR_INTEGRATION not true).');
    return;
  }
  log('Sensor scenario placeholder executed; configure project-specific selectors and flows as needed.');
};

const parseI18nCases = () => {
  if (MOBILE_I18N_CASES) {
    try {
      const parsed = JSON.parse(MOBILE_I18N_CASES);
      if (!Array.isArray(parsed)) {
        throw new Error('MOBILE_I18N_CASES must be a JSON array.');
      }
      return parsed.map((entry, index) => {
        const optionSelector = String(entry?.optionSelector ?? '').trim();
        const expectedText = String(entry?.expectedText ?? '').trim();
        if (!optionSelector || !expectedText) {
          throw new Error(
            `MOBILE_I18N_CASES entry #${index + 1} must include optionSelector and expectedText.`,
          );
        }
        return { optionSelector, expectedText };
      });
    } catch (error) {
      throw new Error(
        `[mobile-e2e] Invalid MOBILE_I18N_CASES JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (MOBILE_I18N_OPTION_SELECTOR && MOBILE_I18N_EXPECTED_TEXT) {
    return [
      {
        optionSelector: MOBILE_I18N_OPTION_SELECTOR,
        expectedText: MOBILE_I18N_EXPECTED_TEXT,
      },
    ];
  }

  return [];
};

const runI18nScenario = async (driver) => {
  if (!MOBILE_I18N_SCENARIO) {
    log('Mobile i18n scenario skipped (MOBILE_I18N_SCENARIO not true).');
    return;
  }

  const cases = parseI18nCases();
  if (!MOBILE_I18N_SETTINGS_SELECTOR || !MOBILE_I18N_ASSERTION_SELECTOR) {
    throw new Error(
      'MOBILE_I18N_SCENARIO requires MOBILE_I18N_SETTINGS_SELECTOR and MOBILE_I18N_ASSERTION_SELECTOR.',
    );
  }
  if (cases.length === 0) {
    throw new Error(
      'MOBILE_I18N_SCENARIO is enabled but no language cases were provided. Set MOBILE_I18N_CASES or MOBILE_I18N_OPTION_SELECTOR + MOBILE_I18N_EXPECTED_TEXT.',
    );
  }

  log(`Running mobile i18n scenario with ${cases.length} language assertion(s).`);

  for (const scenario of cases) {
    const settingsControl = await driver.$(MOBILE_I18N_SETTINGS_SELECTOR);
    await settingsControl.waitForDisplayed({ timeout: 15000 });
    await settingsControl.click();

    const languageOption = await driver.$(scenario.optionSelector);
    await languageOption.waitForDisplayed({ timeout: 15000 });
    await languageOption.click();

    if (MOBILE_I18N_CONFIRM_SELECTOR) {
      const confirmControl = await driver.$(MOBILE_I18N_CONFIRM_SELECTOR);
      await confirmControl.waitForDisplayed({ timeout: 10000 });
      await confirmControl.click();
    }

    await driver.pause(1200);

    const assertionElement = await driver.$(MOBILE_I18N_ASSERTION_SELECTOR);
    await assertionElement.waitForDisplayed({ timeout: 15000 });
    const visibleText = (await assertionElement.getText()).trim().toLowerCase();
    const expectedText = scenario.expectedText.trim().toLowerCase();

    if (!visibleText.includes(expectedText)) {
      throw new Error(
        `Expected "${scenario.expectedText}" after language switch, got "${visibleText}".`,
      );
    }

    log(`Verified language content contains "${scenario.expectedText}".`);
  }
};

const toCapabilities = () => {
  const capabilities = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': ANDROID_DEVICE_NAME,
    'appium:newCommandTimeout': 180,
    'appium:autoGrantPermissions': true,
  };

  if (ANDROID_PLATFORM_VERSION) {
    capabilities['appium:platformVersion'] = ANDROID_PLATFORM_VERSION;
  }

  if (ANDROID_APP_PATH) {
    capabilities['appium:app'] = ANDROID_APP_PATH;
  }

  if (ANDROID_APP_PACKAGE) {
    capabilities['appium:appPackage'] = ANDROID_APP_PACKAGE;
  }

  if (ANDROID_APP_ACTIVITY) {
    capabilities['appium:appActivity'] = ANDROID_APP_ACTIVITY;
  }

  return capabilities;
};

async function run() {
  const { remote } = await import('webdriverio');

  log(`Connecting to Appium server: ${APPIUM_SERVER_URL}`);

  const url = new URL(APPIUM_SERVER_URL);
  const driver = await remote({
    protocol: url.protocol.replace(':', ''),
    hostname: url.hostname,
    port: Number(url.port || 4723),
    path: url.pathname === '/' ? '/' : url.pathname,
    logLevel: 'error',
    capabilities: toCapabilities(),
  });

  try {
    log('Session created. Running Android smoke scenarios.');
    await driver.pause(3000);

    if (ANDROID_APP_PACKAGE) {
      const currentPackage = await driver.getCurrentPackage();
      if (currentPackage !== ANDROID_APP_PACKAGE) {
        throw new Error(
          `Unexpected package in foreground. Expected ${ANDROID_APP_PACKAGE}, got ${currentPackage}`,
        );
      }
    }

    await runLifecycleScenario(driver);
    await runOfflineScenario(driver);
    await runI18nScenario(driver);
    await runPushScenario();
    await runSensorScenario();

    log('Mobile E2E smoke run completed successfully.');
  } finally {
    await driver.deleteSession();
  }
}

run().catch((error) => {
  console.error('[mobile-e2e] Test run failed:', error);
  process.exit(1);
});
