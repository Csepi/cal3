# Local Postgres Service (Optional)

This folder holds assets for the optional PostgreSQL container that ships with the Docker stack.

## Image & Version
- Image: `postgres:15-alpine`
- Data volume: `postgres-data` (named volume managed by Docker)
- Init scripts: any `.sql` or `.sh` files inside `docker/postgres/init-scripts` are executed automatically the first time the volume is created. Use this to create extensions, seed baseline data, or run migrations.

## Service Behavior
- Credentials and database name are populated from the same variables you configure for the backend: `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`.
- Health checks rely on `pg_isready`, so the backend waits until the database reports ready before attempting to connect.
- Port forwarding uses `DB_HOST_PORT` (defaults to `5432`) to expose the service to the host, but you can set it to blank to keep the DB private to the Docker network.
- Compose profiles:
  - `local` (default) spins up this Postgres container.
  - `portainer` skips it so you can point the backend at Azure or any managed PostgreSQL instance.

## Disabling the Service
You may already have an Azure Database for PostgreSQL or another managed instance. In that case you have two options:

1. **Compose CLI:** select the `portainer` profile to omit the local database and connect to Azure or another managed instance:
   ```bash
   docker compose -f docker/compose.yaml --profile portainer up
   ```
   The default `local` profile (`docker compose --profile local up`) starts the bundled Postgres container.
2. **Portainer Stack:** delete or comment out the `db` service in `docker/compose.portainer.yml` before deploying the stack. Alternatively, keep it but set `deploy.replicas: 0`.

Remember to update the backend environment variables (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SSL`, etc.) to match your remote database.

## Init Scripts
Place any `.sql` or `.sh` scripts in `docker/postgres/init-scripts`. They run **once** when the named volume is first created. To re-run them, wipe the `postgres-data` volume:

```bash
docker volume rm cal3_postgres-data
```

For production stacks, manage migrations separately (e.g., via TypeORM commands executed from the backend container).
