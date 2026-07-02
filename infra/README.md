# K2B Insurance — Infrastructure (AWS CDK v2, TypeScript)

Infrastructure-as-code that deploys the containerized Next.js app to **AWS App Runner**
backed by **RDS PostgreSQL 16**, all inside a private VPC.

## What gets provisioned

- **VPC** — 2 AZs, 1 NAT gateway. Public subnets (NAT), private-with-egress subnets
  (App Runner VPC connector), isolated subnets (RDS).
- **ECR repository** (`k2b-insurance`) — image scanning on push, keeps the last 10 images.
  Skipped if you pass `-c existingEcrRepoName=<name>`.
- **RDS PostgreSQL 16** — `db.t4g.micro`, isolated subnets, encrypted storage,
  20 GB autoscaling to 100 GB, 7-day backups, not publicly accessible. Credentials are
  generated into Secrets Manager (user `k2badmin`, database `k2b`).
- **Secrets Manager**
  - `k2b/db-credentials` — RDS-generated JSON credentials.
  - `k2b/database-url` — the **full** `DATABASE_URL` connection string, composed by CDK.
  - `k2b/auth-secret` — a random 48-char `AUTH_SECRET` (no punctuation).
- **App Runner service** (`k2b-insurance`) — deploys the ECR image on port 3000, injects
  `NODE_ENV=production`, `PORT=3000`, `DATABASE_URL`, `AUTH_SECRET`; runs on a VPC connector
  so it can reach private RDS; auto-deployments disabled; HTTP health check on `/`.

## Key design notes

- **L1 constructs for App Runner.** We use the stable `CfnService` / `CfnVpcConnector` from
  `aws-cdk-lib/aws-apprunner` instead of the `@aws-cdk/aws-apprunner-alpha` module to avoid
  alpha-module version drift.
- **How `DATABASE_URL` is assembled.** App Runner's `RuntimeEnvironmentSecrets` can only
  inject a *whole* secret value per env var — it can't compose a URL from separate fields.
  So CDK builds `postgresql://k2badmin:<password>@<host>:<port>/k2b?schema=public` and stores
  it as the dedicated secret `k2b/database-url`. The password is spliced in as a CloudFormation
  **dynamic reference** to the RDS secret, resolved server-side at deploy — the literal password
  never lands in the template. (The RDS-generated password excludes URL-hostile characters, so
  it is safe to embed unescaped.)
- **Security-group direction.** The RDS SG has an **ingress** rule allowing the App Runner
  connector SG as the source on TCP 5432 (traffic flows App Runner → RDS).
- **NAT tradeoff.** App Runner's VPC egress routes *all* outbound traffic through the connector
  subnets, so NAT is required for the app's internet access. We use 1 NAT gateway to save cost;
  set `natGateways: 2` in the stack for production HA.

## Deploy — ordered steps

### 1. Install dependencies

```bash
cd infra && npm install
```

### 2. Bootstrap the environment (once per account/region)

```bash
npx cdk bootstrap
```

Region defaults to `us-east-1`; override with `CDK_DEFAULT_REGION` or `-c region=<region>`.

### 3. First deploy of the infrastructure (creates ECR, RDS, secrets, App Runner)

```bash
npx cdk deploy
```

> **Two-phase note:** App Runner needs an image in ECR to become healthy. On the very first
> deploy the ECR repo is empty, so the App Runner service may report a failed/degraded first
> deployment. That is expected — deploy the infra, then push an image (step 4), then start a
> deployment (step 5) and it converges. The rest of the stack (VPC, RDS, secrets, ECR) is created
> regardless.

Copy the `EcrRepositoryUri` output for the next step.

### 4. Build & push the image

Run from the **repo root** (where the Dockerfile lives). Replace `<ACCOUNT>` / `<REGION>` or,
easier, use the `EcrRepositoryUri` stack output as `ECR_URI`.

```bash
export AWS_REGION=us-east-1
export ECR_URI=<EcrRepositoryUri output, e.g. 123456789012.dkr.ecr.us-east-1.amazonaws.com/k2b-insurance>

# Authenticate Docker to ECR
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "${ECR_URI%/*}"

# Build (linux/amd64 — App Runner runs x86_64), tag, push
docker build --platform linux/amd64 -t k2b-insurance:latest .
docker tag k2b-insurance:latest "$ECR_URI:latest"
docker push "$ECR_URI:latest"
```

### 5. Deploy / start an App Runner deployment

Auto-deployments are **disabled**, so trigger a deployment after each push. Either re-run CDK:

```bash
npx cdk deploy
```

…or start a deployment directly against the existing service (faster; use the
`AppRunnerServiceArn` output):

```bash
aws apprunner start-deployment --service-arn <AppRunnerServiceArn output> --region "$AWS_REGION"
```

Once it stabilizes, open the `AppRunnerServiceUrl` output.

### 6. Database migrations

Migrations run **automatically on container start**: the Dockerfile CMD runs
`prisma migrate deploy` before `node server.js`. Because `DATABASE_URL` is injected from the
`k2b/database-url` secret and App Runner egresses through the VPC connector to RDS, each new
deployment applies any pending migrations before serving traffic. No manual migration step needed.

## Useful commands

| Command | Description |
| --- | --- |
| `npm run build` | Compile TypeScript (type-check) |
| `npm run synth` | Emit the CloudFormation template |
| `npm run diff` | Diff deployed stack vs. local |
| `npm run deploy` | Deploy the stack |
| `npm run destroy` | Tear down the stack |

## Context flags

- `-c region=<region>` / `-c account=<id>` — target env (else read from `CDK_DEFAULT_*`).
- `-c existingEcrRepoName=<name>` — reuse an existing ECR repo instead of creating one.
- `-c imageTag=<tag>` — image tag App Runner deploys (default `latest`).
- `-c deletionProtection=true` — enable RDS deletion protection (default off; when off, the DB
  is destroyed on `cdk destroy`).

## Teardown

```bash
npx cdk destroy
```

With the defaults (deletion protection off), this removes RDS and empties/deletes the ECR repo.
Secrets are scheduled for deletion by Secrets Manager (recovery window applies).
