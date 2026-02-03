# Frontend Structure

Last updated: 2026-02-03

[Back](./README.md)

Frontend architecture uses contexts for shared state, hooks for typed access, services for API calls, and reusable UI components for consistency.

## Operational Notes
This design reduces prop drilling and keeps components focused on rendering behavior rather than global state orchestration.

## Guidance
When adding new features, place logic in the appropriate layer instead of expanding page-level components indefinitely.
