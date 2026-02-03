# Deployment

## Docker Build / Run

### Backend
```bash
cd backend-nestjs
docker build -t cal3-backend .
docker run -p 8081:8081 --env-file .env cal3-backend
```

### Frontend
```bash
cd frontend
docker build -t cal3-frontend .
docker run -p 8080:8080 cal3-frontend
```

## Environment Variables
- DB: `DB_TYPE`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- Auth: `JWT_SECRET`, issuer/audience/expiry
- OAuth: Google/Microsoft client + secret + callback urls
- URLs: backend/frontend base URLs

## Health Checks
- Backend: `GET /api/health` (or equivalent configured health endpoint)
- Frontend: `GET /` returns app shell
- Verify DB connectivity from backend startup logs

## Portainer / Git Redeploy Notes
- Ensure repo sync completes before service status checks.
- Keep compose/env values in sync with repository updates.
- If stack appears missing immediately after redeploy, allow pull/build cycle to finish.