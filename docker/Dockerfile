FROM node:16-slim AS base

##
## Prepare a subset of this monorepo
##
FROM base AS pruned-package

ARG packageScope
ENV optDir /opt
WORKDIR ${optDir}

COPY . .

RUN npx turbo prune --scope="${packageScope}" --docker


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
## release
##
FROM base AS release

ARG packageScope
ENV NODE_ENV production
ENV optDir /opt
ENV appDir /app
WORKDIR ${appDir}

COPY --from=builder --chown=node:node \
  ${optDir}/ ${appDir}/
