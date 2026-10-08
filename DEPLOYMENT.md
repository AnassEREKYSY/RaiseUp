# Deploying RaiseUp to the OVH VM

On each push to `main`, `.github/workflows/ci-cd.yml`:

1. runs the API tests, the database upgrade check and the client end-to-end tests;
2. builds `ghcr.io/anasserekysy/raiseup-server` and `raiseup-client` (tags `latest` and the commit SHA);
3. copies `deploy/docker-compose.prod.yml` and `deploy/deploy.sh` to `~/raiseup` and runs `deploy.sh`.

`deploy.sh` writes `~/raiseup/.env`, pulls the images of this commit, restarts the stack, waits for
`http://127.0.0.1:3000/api/health` and reloads the `reverse-proxy` container.
On start, the API runs `prisma migrate deploy` (the v2 migration only adds columns and tables).

## Containers

| Container | Role |
|---|---|
| `raiseup-client-1` | Angular app; proxies `/api` and `/api/socket.io` to the API. Port 3000, and on the `web` network |
| `raiseup-api-1` | Express API + Socket.IO, reachable as `raiseup-api` inside the stack only |
| `raiseup-db-1` | PostgreSQL 16, volume `raiseup_investor_db_data` (kept across deploys) |

pgAdmin is no longer part of the stack (it was public with a default password). To inspect the database:
`docker exec -it raiseup-db-1 psql -U <user> -d <db>`.

## Reverse proxy

Use `deploy/nginx/raiseup.conf` for `/opt/nginx/conf.d/raiseup.conf`: it resolves the container per request
(no 502 after a redeploy) and passes WebSocket upgrades for live messages.
The site calls its API on its own domain (`/api`), so the API subdomains are no longer needed.

## GitHub secrets

| Secret | Use |
|---|---|
| `OVH_HOST`, `OVH_USER`, `SSH_PRIVATE_KEY` | SSH to the VM |
| `GHCR_TOKEN` | Pull images on the VM |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Database (must stay the same: stored in the existing volume) |
| `JWT_SECRET` | Optional. If missing, `deploy.sh` generates one once and keeps it in `~/raiseup/.env` |

Optional variable `RAISEUP_CLIENT_BIND=127.0.0.1` closes port 3000 to the outside once the proxy uses the container name.
