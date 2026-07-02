# Deploying K2B Insurance to AWS Lightsail (Ubuntu)

The whole site (Next.js app + Postgres + HTTPS) runs on a single Lightsail
Ubuntu instance with Docker Compose. Caddy terminates TLS and auto-renews
Let's Encrypt certificates for your domain.

## 1. Create the instance (Lightsail console)

1. Go to **Lightsail → Instances → Create instance**.
2. Region: pick the one closest to you (e.g. **us-east-2 (Ohio)** for Missouri).
3. Platform: **Linux/Unix** → Blueprint: **Operating system only → Ubuntu 24.04 LTS**.
4. Plan: **$12/mo (2 GB RAM, 2 vCPU)** recommended. The $5–$7 (1 GB) plans work
   too — the setup script adds 2 GB of swap so the build can complete, it's just
   slower.
5. Name it (e.g. `k2b-insurance`) and **Create instance**.

## 2. Static IP + firewall

1. **Networking → Create static IP**, attach it to the instance.
2. On the instance's **Networking** tab, add firewall rules:
   - **HTTP (TCP 80)** and **HTTPS (TCP 443)**. (SSH 22 is already there.)

## 3. Point your domain at it

At your DNS provider (or Lightsail's **Domains & DNS**), create:

| Type | Name | Value |
|------|------|-------|
| A | `@` (k2binsurance.com) | the static IP |
| A | `www` | the static IP |

HTTPS certificates are issued automatically on first request once DNS resolves.

## 4. Run the setup script

SSH in (the orange **Connect** button in the console works), then:

```bash
curl -fsSL https://raw.githubusercontent.com/jbrewersales-dot/k2binsurance/main/deploy/lightsail-setup.sh | sudo bash
```

The script will prompt for:
- **Domain** (e.g. `k2binsurance.com`)
- **Email** for HTTPS certificates
- **Agent login email + password** for the portal

It then installs Docker, clones this repo to `/opt/k2binsurance`, generates the
database password and session secret into `/opt/k2binsurance/.env`, builds and
starts the stack, runs database migrations, and seeds your agent account.

> Deploying from a branch instead of `main`? Prefix the run:
> `curl -fsSL .../deploy/lightsail-setup.sh | sudo BRANCH=claude/aws-readiness-rkpmxo bash`

## 5. Verify

- `https://k2binsurance.com` — public site + quote wizards
- `https://k2binsurance.com/portal` — agent portal (sign in with the seeded account)

## Day-2 operations (from `/opt/k2binsurance`)

```bash
# Deploy an update
sudo git pull && sudo docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# Logs
sudo docker compose -f docker-compose.prod.yml logs -f app

# Add or reset an agent account
sudo docker compose -f docker-compose.prod.yml exec \
  -e SEED_AGENT_EMAIL=new@k2binsurance.com -e SEED_AGENT_PASSWORD='...' \
  -e SEED_AGENT_NAME='New Agent' app node prisma/seed.js

# Database backup (leads live in the pgdata volume — back up regularly!)
sudo docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U k2b k2b > backup-$(date +%F).sql
```

Also consider enabling Lightsail's instance **Snapshots** (console → instance →
Snapshots) for whole-machine backups.

## Alternative: App Runner + RDS

A fully managed AWS deployment (App Runner + RDS Postgres, via CDK) is included
under [`infra/`](../infra/README.md) if the agency outgrows a single instance.
