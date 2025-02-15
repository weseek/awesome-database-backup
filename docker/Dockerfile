ARG dbType

# You should set same Node.js version and Linux distribution as .devcontainer/Dockerfile
FROM node:22.13.1-bullseye-slim AS base

##
## Prepare a subset of this monorepo
##
FROM base AS pruned-package

ARG packageScope
ENV optDir=/opt
WORKDIR ${optDir}

COPY . .

### "prune" command does not extract "bin" directory, so copy it
RUN npx turbo@1 prune --scope="${packageScope}" --docker \
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

ARG packageScope
ENV NODE_ENV=production
ENV optDir=/opt
WORKDIR ${optDir}

COPY --from=deps-resolver --chown=node:node \
  ${optDir}/ ${optDir}/
COPY --from=pruned-package --chown=node:node \
  ${optDir}/out/full/ ${optDir}/
COPY .gitignore .gitignore

RUN yarn run turbo run build --scope="${packageScope}" --include-dependencies --no-deps


##
## tools
##
FROM base AS tool-common

RUN apt-get update \
      && apt-get install -y bzip2 curl ca-certificates gnupg \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

FROM tool-common AS mongodb-tools

# YOU MUST SET dbToolVersion
ARG dbToolVersion
RUN apt-get update \
      && curl https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian10-x86_64-${dbToolVersion}.deb -o mongodb-database-tools.deb \
      && apt-get install -y ./mongodb-database-tools.deb \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/* \
      && rm ./mongodb-database-tools.deb

FROM tool-common AS postgresql-tools

# YOU MUST SET dbToolVersion
ARG dbToolVersion
RUN echo "deb http://apt.postgresql.org/pub/repos/apt $(cat /etc/os-release | grep VERSION_CODENAME | cut -d = -f 2)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
      && curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
      && apt-get update \
      && apt-get install -y postgresql-common postgresql-client-${dbToolVersion} --no-install-recommends \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

FROM tool-common AS mariadb-tools

# YOU MUST SET dbToolVersion
ARG dbToolVersion
RUN curl -sSL https://downloads.mariadb.com/MariaDB/mariadb_repo_setup | bash -s -- --mariadb-server-version=${dbToolVersion} \
      && apt-get update \
      && apt-get install -y mariadb-common mariadb-client --no-install-recommends \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

FROM tool-common AS file-tools

##
## release
## dbType is one of "mongodb", "postgresql", "mariadb", "file"
##
FROM ${dbType:-file}-tools AS release

ARG distDir="dist"
ARG packageScope
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
