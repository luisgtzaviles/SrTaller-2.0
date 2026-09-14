# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE="node:24.18.0-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d"
ARG SR_BUILD_GIT_SHA

FROM ${NODE_IMAGE} AS build

ARG SOURCE_DATE_EPOCH=0
ARG SR_BUILD_GIT_SHA
ENV COREPACK_HOME=/opt/corepack
ENV PATH="${COREPACK_HOME}:${PATH}"
ENV SR_RUNTIME_GIT_SHA="${SR_BUILD_GIT_SHA}"
ENV SR_RUNTIME_SOURCE_STATE=clean
WORKDIR /workspace

RUN test -n "${SR_BUILD_GIT_SHA}" \
  && test "$(printf '%s' "${SR_BUILD_GIT_SHA}" | tr -d '0-9a-f')" = "" \
  && test "${#SR_BUILD_GIT_SHA}" = "40" \
  && mkdir -p "${COREPACK_HOME}" \
  && corepack enable --install-directory "${COREPACK_HOME}" \
  && corepack prepare pnpm@11.15.1 --activate \
  && test "$(node --version)" = "v24.18.0" \
  && test "$(pnpm --version)" = "11.15.1"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc .node-version .nvmrc supply-chain-policy.json ./
COPY apps/dev-preview-web/package.json ./apps/dev-preview-web/package.json
COPY scripts ./scripts
RUN pnpm install --frozen-lockfile

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY apps/dev-preview-web ./apps/dev-preview-web
RUN pnpm run build \
  && rm -rf node_modules apps/dev-preview-web/node_modules \
  && pnpm install --prod --frozen-lockfile --filter srtaller-2 \
  && rm -f node_modules/.modules.yaml node_modules/.pnpm-workspace-state-v1.json \
  && find package.json node_modules dist -exec touch -h -d "@${SOURCE_DATE_EPOCH}" {} +

FROM ${NODE_IMAGE} AS runtime

ARG SOURCE_DATE_EPOCH=0
ARG SR_BUILD_GIT_SHA
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PORT=3000
ENV SR_RUNTIME_GIT_SHA="${SR_BUILD_GIT_SHA}"
ENV SR_RUNTIME_SOURCE_STATE=clean
LABEL org.opencontainers.image.revision="${SR_BUILD_GIT_SHA}"
WORKDIR /app

RUN --mount=type=bind,from=build,source=/workspace,target=/build,ro \
  tar \
    --sort=name \
    --mtime="@${SOURCE_DATE_EPOCH}" \
    --owner=1000 \
    --group=1000 \
    --numeric-owner \
    -C /build \
    -cf - \
    package.json node_modules dist \
  | tar -C /app -xf - \
  && touch -d "@${SOURCE_DATE_EPOCH}" /app

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "--input-type=module", "--eval", "const response = await fetch(`http://127.0.0.1:${process.env.PORT}/readyz`, { signal: AbortSignal.timeout(2000) }); if (response.status !== 200) process.exit(1);"]

CMD ["node", "--enable-source-maps", "dist/main.js"]
