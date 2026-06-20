FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

RUN npm ci

COPY . .

RUN npm run build

RUN npm prune --omit=dev

RUN find node_modules -type f \( \
    -name "*.md" -o \
    -name "*.ts" -o \
    -name "*.map" -o \
    -name "*.tsbuildinfo" -o \
    -name "LICENSE*" -o \
    -name "CHANGELOG*" -o \
    -name "*.yml" -o \
    -name "*.yaml" -o \
    -name ".eslintrc*" -o \
    -name ".prettierrc*" \
    \) -delete \
    && find node_modules -type d -name "test" -exec rm -rf {} + 2>/dev/null; : \
    && find node_modules -type d -name "tests" -exec rm -rf {} + 2>/dev/null; : \
    && find node_modules -type d -name "__tests__" -exec rm -rf {} + 2>/dev/null; : \
    && find node_modules -type d -name "example" -exec rm -rf {} + 2>/dev/null; : \
    && find node_modules -type d -name "examples" -exec rm -rf {} + 2>/dev/null; : \
    && find node_modules -type d -name ".github" -exec rm -rf {} + 2>/dev/null; : \
    && find node_modules -type d -name "docs" -exec rm -rf {} + 2>/dev/null; : \
    && find node_modules -type d -name "spec" -exec rm -rf {} + 2>/dev/null; : \
    && find node_modules -type d -name "benchmark" -exec rm -rf {} + 2>/dev/null; :


FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/migrations ./src/database/migrations

RUN mkdir -p config data

CMD ["node", "dist/index.js"]
