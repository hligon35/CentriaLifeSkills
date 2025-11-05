# Edge Caddy deployment (single-box front door for many apps)

This guide makes the internet-facing server host both FlashPost and BuddyBoard (and future apps) behind one Caddy on ports 80/443.

## Prereqs

- Router forwards TCP 80 and 443 to THIS server
- Docker and Docker Compose installed
- Shared Docker network exists (created by FlashPost): `flashpost_default`
- DNS A record for `buddyboard.getsparqd.com` points to the public IP of this server (already set to 68.54.208.207)

## 1) Start BuddyBoard on the edge server

Option A (use this repo):

```powershell
# On the edge server (PowerShell or bash), in this repo folder
docker compose -f docker-compose.edge.yml build app
docker compose -f docker-compose.edge.yml up -d app
```

Sanity checks:

```powershell
docker ps
docker network inspect flashpost_default
```

You should see `buddyboard-app` attached to `flashpost_default`.

## 2) Add a site block to Caddy (edge server)

If your Caddyfile imports a sites directory, copy this file:

`deploy/caddy/sites/buddyboard.caddy` → `/etc/caddy/sites/buddyboard.caddy`

Ensure the main `/etc/caddy/Caddyfile` includes:

```text
import /etc/caddy/sites/*.caddy
```

Reload Caddy:

```powershell
caddy fmt --overwrite /etc/caddy/Caddyfile
caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

Alternatively, append the site block directly to your Caddyfile:

```text
buddyboard.getsparqd.com {
    encode zstd gzip
    @www host www.buddyboard.getsparqd.com
    redir @www https://buddyboard.getsparqd.com{uri}
    reverse_proxy buddyboard-app:3000
}
```

## 3) Verify publicly

Use a phone on cellular (Wi‑Fi off):

- <http://buddyboard.getsparqd.com> → 308 redirect to HTTPS
- <https://buddyboard.getsparqd.com/api/health> → 200 JSON

In `docker logs` for Caddy, you should see ACME solving and then:
`certificate obtained successfully` for `buddyboard.getsparqd.com`.

## Notes

- Keep `buddyboard-app` off host ports; Caddy reaches it via the Docker network.
- Add more apps by dropping one site file and running a new container on the same network.
- Optional: set an ACME email in the global block of your Caddyfile for notices.
