ARG packageScope=""


##
## Prepare a subset of this monorepo
##
FROM node:16-slim as pruned-package

ARG packageScope
ENV optDir /opt
WORKDIR ${optDir}

COPY . .

RUN ls -al
RUN npx turbo prune --scope="${packageScope}" --docker


##
## deps-resolver
##
FROM pruned-package AS deps-resolver

ENV optDir /opt
WORKDIR ${optDir}

COPY --from=pruned-package --chown=node:node \
  ${optDir}/out/json/ .
COPY --from=pruned-package --chown=node:node \
  ${optDir}/out/yarn.lock ./yarn.lock
RUN yarn --frozen-lockfile --production


##
## release
##
FROM pruned-package

ARG packageScope
ENV NODE_ENV production
ENV optDir /opt
ENV appDir /app

COPY --from=deps-resolver --chown=node:node \
  ${optDir} ${appDir}/
COPY --from=pruned-package --chown=node:node \
  ${optDir}/out/full/ ${appDir}/
COPY .gitignore .gitignore

RUN npx turbo run build --scope="${packageScope}" --includeDependencies --no-deps
