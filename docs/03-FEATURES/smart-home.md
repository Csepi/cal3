# Smart Home Integration

Last updated: 2026-02-03

[‹ Features](./README.md)

## Status
Smart home integration is supported via adapter configuration and webhook-style automation patterns.

## Typical Platforms
- Home Assistant
- IFTTT-compatible webhooks
- Custom bridge services

## Setup
1. Enable smart home variables in environment.
2. Configure provider endpoint/token.
3. Create automation rules that target smart-home webhooks/actions.

## Example Use Cases
- Turn on room lights before reservation start.
- Toggle occupancy state when meeting begins/ends.
- Notify wall panel on schedule changes.