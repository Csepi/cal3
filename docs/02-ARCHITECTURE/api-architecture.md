# API Architecture

Last updated: 2026-02-03

[Back](./README.md)

API design separates HTTP handling from business logic. Controllers stay thin while services and policy layers enforce domain behavior.

## Operational Notes
Pipes, guards, interceptors, and exception filters provide consistent validation, authorization, response shaping, and error semantics.

## Guidance
Stable contracts and machine-readable errors are mandatory for frontend and script compatibility.
