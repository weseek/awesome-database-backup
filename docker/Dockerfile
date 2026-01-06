ARG dbType

# You should set same Node.js version and Linux distribution as .devcontainer/Dockerfile
FROM node:22.13.1-bullseye-slim AS base

##
## Prepare a subset of this monorepo
##
FROM base AS pruned-package

ARG packageFilter
ENV optDir=/opt
WORKDIR ${optDir}

COPY . .

### "prune" command does not extract "bin" directory, so copy it
RUN npx turbo@2 prune --docker "${packageFilter}" \
    && cp --parents */*/bin/* out/json/


##
## deps-resolver
##
FROM base AS deps-resolver

ENV optDir=/opt
WORKDIR ${optDir}

COPY --from=pruned-package --chown=node:node \
  ${optDir}/out/json/ .
COPY --from=pruned-package --chown=node:node \
  ${optDir}/out/yarn.lock ./yarn.lock
RUN yarn --frozen-lockfile


##
## builder
##
FROM base AS builder

ARG packageFilter
ENV NODE_ENV=production
ENV optDir=/opt
WORKDIR ${optDir}

COPY --from=deps-resolver --chown=node:node \
  ${optDir}/ ${optDir}/
COPY --from=pruned-package --chown=node:node \
  ${optDir}/out/full/ ${optDir}/
COPY .gitignore .gitignore

RUN yarn run turbo run build --filter="${packageFilter}..."


##
## tools
##
FROM base AS tool-common

RUN apt-get update \
      && apt-get install -y bzip2 zstd curl ca-certificates gnupg \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

FROM tool-common AS mongodb-tools

# YOU MUST SET dbToolVersion
ARG dbToolVersion
RUN --mount=type=bind,source=.devcontainer/build-support/install-functions.sh,dst=/tmp/install-functions.sh \
    . /tmp/install-functions.sh && \
    install_mongo_tools "${dbToolVersion}" && \
    clean_apt && clean_apt_lists

FROM tool-common AS postgresql-tools

# YOU MUST SET dbToolVersion
ARG dbToolVersion
RUN --mount=type=bind,source=.devcontainer/build-support/install-functions.sh,dst=/tmp/install-functions.sh \
    . /tmp/install-functions.sh && \
    install_postgresql_tools "${dbToolVersion}" && \
    clean_apt && clean_apt_lists

FROM tool-common AS mariadb-tools

# YOU MUST SET dbToolVersion
ARG dbToolVersion
RUN --mount=type=bind,source=.devcontainer/build-support/install-functions.sh,dst=/tmp/install-functions.sh \
    . /tmp/install-functions.sh && \
    install_mariadb_tools "${dbToolVersion}" && \
    clean_apt && clean_apt_lists

FROM tool-common AS file-tools

##
## release
## dbType is one of "mongodb", "postgresql", "mariadb", "file"
##
FROM ${dbType:-file}-tools AS release

ARG distDir="dist"
ARG packageFilter
ARG packagePath
ENV NODE_ENV=production
ENV optDir=/opt
ENV appDir=/app
WORKDIR ${appDir}/${packagePath}

COPY --from=builder --chown=node:node \
  ${optDir}/ ${appDir}/
COPY ./docker/entrypoint.sh ${appDir}/

ENV PATH=$PATH:${appDir}/${packagePath}/node_modules/.bin

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["backup", "list", "prune"]
