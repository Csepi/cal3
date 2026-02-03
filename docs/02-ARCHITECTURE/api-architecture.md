# API Architecture

Last updated: 2026-02-03

[‹ Architecture](./README.md)

## Layers
1. Controllers (transport)
2. Guards/Pipes/Decorators (policy + validation)
3. Services (business logic)
4. Repositories (persistence)
5. Interceptors/Filters (response/error shaping)

## Contracts
- Success envelope: ApiResponse<T>
- Error envelope: machine-readable code + request tracing