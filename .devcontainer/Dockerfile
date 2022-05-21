# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.217.2/containers/typescript-node/.devcontainer/base.Dockerfile

# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 16, 14, 12, 16-bullseye, 14-bullseye, 12-bullseye, 16-buster, 14-buster, 12-buster
ARG VARIANT="16"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

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

RUN mkdir -p /awesome-backup/node_modules

# [Optional] Update UID/GID if needed
RUN if [ "$USER_GID" != "1000" ] || [ "$USER_UID" != "1000" ]; then \
        groupmod --gid $USER_GID $USERNAME \
        && usermod --uid $USER_UID --gid $USER_GID $USERNAME; \
    fi
RUN chown -R $USER_UID:$USER_GID /home/$USERNAME /awesome-backup;

# [Optional] Install tools if needed
## bzip2 command
RUN apt-get update \
      && apt-get install -y bzip2 \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*
## mongo shell
ADD https://downloads.mongodb.com/compass/mongodb-mongosh_1.3.1_amd64.deb .
RUN apt-get update \
      && apt-get install -y ./mongodb-mongosh_1.3.1_amd64.deb \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*
## mongo tools
ADD https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian10-x86_64-100.5.2.deb .
RUN apt-get update \
      && apt-get install -y ./mongodb-database-tools-debian10-x86_64-100.5.2.deb \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*
## PostgreSQL tools
RUN echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
      && apt-get install -y curl ca-certificates gnupg \
      && curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
      && apt-get update \
      && apt-get install -y postgresql-common postgresql-client-14 --no-install-recommends \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*
## MariaDB tools
RUN apt-get update \
      && apt-get install -y mariadb-common mariadb-client --no-install-recommends \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

## AWS cli
ADD https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip /tmp/awscliv2.zip
RUN unzip /tmp/awscliv2.zip -d /tmp \
      && /tmp/aws/install
## Google cloud CLI (also gsutil)
## ref: https://cloud.google.com/sdk/docs?hl=en#install_the_latest_cloud_tools_version_cloudsdk_current_version
RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" >> /etc/apt/sources.list.d/google-cloud-sdk.list \
      && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - \
      && apt-get update \
      && apt-get install google-cloud-cli \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*
