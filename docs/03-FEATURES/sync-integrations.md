# Sync Integrations

Last updated: 2026-02-03

[Back](./README.md)

Sync integrations connect Cal3 data with provider APIs such as Google and iCal ecosystems.

## Operational Notes
Mapper logic must normalize provider payloads carefully, especially for timezone and recurrence behavior.

## Guidance
Use resilient retry and error reporting patterns because upstream API reliability varies over time.
