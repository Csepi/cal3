# Guards & Policies

This folder contains policy-focused guards that centralize authorization and validation rules used across controllers.

## When to use each guard
- `ResourceAccessGuard`
  - Protects resource-specific endpoints.
  - Use for view/edit/delete checks based on the owning organization and resource type.
- `OrganizationAccessGuard`
  - Protects organization endpoints.
  - Use for admin-only actions or organization settings changes.
- `PublicBookingGuard`
  - Protects public booking endpoints.
  - Validates booking token and basic booking date sanity.

## Adding new permissions
1. Add a new policy method to the guard interface.
2. Extend the guard’s action switch and metadata keys if needed.
3. Expose a decorator to apply the new action in controllers.
4. Keep error messages consistent with existing controller behavior.

## Testing guide
- Unit-test the guard methods with mocked repositories/services.
- Verify guard-denied paths return the same status/message as before.
- Smoke-test routes under `resources`, `organisations`, and `public/booking` to ensure no behavior changes.
