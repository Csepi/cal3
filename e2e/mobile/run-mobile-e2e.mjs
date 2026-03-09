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
