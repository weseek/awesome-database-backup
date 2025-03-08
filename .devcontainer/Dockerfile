# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.217.2/containers/typescript-node/.devcontainer/base.Dockerfile

# You must set same Node.js version and Linux distribution as docker/Dockerfile
# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 16, 14, 12, 16-bullseye, 14-bullseye, 12-bullseye, 16-buster, 14-buster, 12-buster
ARG VARIANT="22"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:dev-${VARIANT}-bullseye

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node packages
# RUN su node -c "npm install -g <your-package-list -here>"

ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN mkdir -p /awesome-database-backup/node_modules

# [Optional] Update UID/GID if needed
RUN if [ "$USER_GID" != "1000" ] || [ "$USER_UID" != "1000" ]; then \
        groupmod --gid $USER_GID $USERNAME \
        && usermod --uid $USER_UID --gid $USER_GID $USERNAME; \
    fi
RUN chown -R $USER_UID:$USER_GID /home/$USERNAME /awesome-database-backup;

# Setup installer function
COPY build-support/install-functions.sh /tmp/install-functions.sh

# Install tools
ARG MongoToolVersion=100.10.0
ARG PostgreSQLClientVersion=17
ARG MariaDBClientVersion=11.7.2
RUN apt-get update \
    && apt-get install -y bzip2 curl \
    . /tmp/install-functions.sh && \
    install_mongo_shell && \
    install_mongo_tools "${MongoToolVersion}" && \
    install_postgresql_tools "${PostgreSQLClientVersion}" && \
    install_mariadb_tools "${MariaDBClientVersion}" && \
    install_aws_cli && \
    install_gcloud_cli
