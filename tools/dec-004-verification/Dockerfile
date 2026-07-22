# syntax=docker/dockerfile:1.7

ARG DEBIAN_IMAGE="debian:bookworm-slim@sha256:7b140f374b289a7c2befc338f42ebe6441b7ea838a042bbd5acbfca6ec875818"
FROM --platform=linux/amd64 ${DEBIAN_IMAGE}

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ARG NODE_VERSION="24.18.0"
ARG NODE_SHA256="55aa7153f9d88f28d765fcdad5ae6945b5c0f98a36881703817e4c450fa76742"
ARG COREPACK_VERSION="0.35.0"
ARG COREPACK_INTEGRITY="sha512-9BuIGHDFE7Zieor1CeRsvt7X7AJFEuJ6OnbSbsVprq83ChDFoBh1wP98NeUS9FT3ZwlzFllPElXcz/OiDf0YGw=="
ARG PNPM_VERSION="11.15.1"

RUN apt-get update \
    && apt-get install --yes --no-install-recommends \
      ca-certificates \
      coreutils \
      curl \
      findutils \
      git \
      grep \
      procps \
      sed \
      util-linux \
      xz-utils \
    && rm -rf /var/lib/apt/lists/*

RUN node_archive="node-v${NODE_VERSION}-linux-x64.tar.xz" \
    && curl --fail --silent --show-error --location \
      "https://nodejs.org/dist/v${NODE_VERSION}/${node_archive}" \
      --output "/tmp/${node_archive}" \
    && printf '%s  %s\n' "${NODE_SHA256}" "/tmp/${node_archive}" \
      | sha256sum --check --strict - \
    && mkdir --parents /opt/node \
    && tar --extract --xz --file "/tmp/${node_archive}" \
      --directory /opt/node --strip-components=1 \
    && rm "/tmp/${node_archive}"

ENV PATH="/opt/node/bin:${PATH}"
ENV COREPACK_HOME="/opt/corepack"

RUN corepack_archive="corepack-${COREPACK_VERSION}.tgz" \
    && curl --fail --silent --show-error --location \
      "https://registry.npmjs.org/corepack/-/${corepack_archive}" \
      --output "/tmp/${corepack_archive}" \
    && expected_hex="$(printf '%s' "${COREPACK_INTEGRITY#sha512-}" \
      | base64 --decode | od -An -tx1 | tr -d ' \n')" \
    && actual_hex="$(sha512sum "/tmp/${corepack_archive}" | cut -d' ' -f1)" \
    && test "${actual_hex}" = "${expected_hex}" \
    && npm install --global --ignore-scripts "/tmp/${corepack_archive}" \
    && rm "/tmp/${corepack_archive}" \
    && corepack enable \
    && corepack prepare "pnpm@${PNPM_VERSION}" --activate \
    && test "$(node --version)" = "v${NODE_VERSION}" \
    && test "$(corepack --version)" = "${COREPACK_VERSION}" \
    && test "$(pnpm --version)" = "${PNPM_VERSION}" \
    && chmod -R a+rX /opt/node /opt/corepack

RUN useradd --create-home --home-dir /home/dec004 --uid 10001 dec004 \
    && mkdir --parents /workspace /evidence \
    && chown --recursive dec004:dec004 /workspace /evidence /home/dec004

COPY --chmod=0555 verify-container.sh /usr/local/bin/dec004-verify-container

USER dec004
WORKDIR /workspace

ENV HOME="/home/dec004"
ENV GIT_TERMINAL_PROMPT="0"
ENV PNPM_HOME="/home/dec004/.local/share/pnpm"

ENTRYPOINT ["/usr/local/bin/dec004-verify-container"]
