# Troubleshooting

## Common Issues

### Frontend login loop / session expired redirect
- Check backend availability on `8081`.
- Verify refresh endpoint `/api/auth/refresh` responds.
- Confirm runtime config points to current backend URL.

### `ERR_CONNECTION_REFUSED`
- Backend service is down, wrong port, or container unhealthy.
- Confirm DB reachable and backend startup completed.

### Backend startup stuck
- Check DB connectivity and credentials.
- Verify pool/timeouts in `.env`.
- Review startup logs for migration/entity metadata errors.

### TypeScript/Lint regressions
- Run both app checks:
  - `backend-nestjs: npx tsc --noEmit && npm run lint`
  - `frontend: npx tsc --noEmit && npm run lint`

## Debug Procedure
1. Confirm ports listening.
2. Check backend + frontend runtime logs.
3. Test backend health/auth endpoints directly.
4. Check DB host reachability and credentials.
5. Rebuild services if dependency/runtime mismatch suspected.

## Performance Tips
- Keep DB indexes aligned with frequent filters/sorts.
- Tune DB pool config for auth and list-heavy traffic.
- Avoid oversized frontend bundles; split large feature chunks.