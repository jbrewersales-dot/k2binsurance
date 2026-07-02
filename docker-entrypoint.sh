#!/bin/sh
set -e

echo "→ Applying database migrations (prisma migrate deploy)…"
node migrate/node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma

echo "→ Starting K2B Insurance server on port ${PORT:-3000}…"
exec node server.js
