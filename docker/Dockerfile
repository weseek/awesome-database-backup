ARG dbType

FROM node:18-slim AS base

##
## Prepare a subset of this monorepo
##
FROM base AS pruned-package

ARG packageScope
ENV optDir /opt
WORKDIR ${optDir}

COPY . .

### "prune" command does not extract "bin" directory, so copy it
RUN npx turbo prune --scope="${packageScope}" --docker \
    && cp --parents */*/bin/* out/json/


##
## deps-resolver
##
FROM base AS deps-resolver

ENV optDir /opt
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
ENV NODE_ENV production
ENV optDir /opt
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
      && apt-get install -y bzip2 \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

FROM tool-common AS mongodb-tools

ADD https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian10-x86_64-100.5.2.deb .
RUN apt-get update \
      && apt-get install -y ./mongodb-database-tools-debian10-x86_64-100.5.2.deb \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

FROM tool-common AS postgresql-tools

RUN apt-get update \
      && apt-get install -y postgresql-common postgresql-client --no-install-recommends \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

FROM tool-common AS mariadb-tools

RUN apt-get update \
      && apt-get install -y mariadb-common mariadb-client --no-install-recommends \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

##
## release
## dbType is one of "mongodb", "postgresql", "mariadb"
##
FROM ${dbType}-tools AS release

ARG distDir="dist"
ARG packageScope
ARG packagePath
ENV NODE_ENV production
ENV optDir /opt
ENV appDir /app
WORKDIR ${appDir}/${packagePath}

COPY --from=builder --chown=node:node \
  ${optDir}/ ${appDir}/
COPY ./docker/entrypoint.sh ${appDir}/

ENV PATH $PATH:${appDir}/${packagePath}/node_modules/.bin

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["backup", "list", "prune"]
