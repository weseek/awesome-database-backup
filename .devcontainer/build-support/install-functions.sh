#!/bin/bash

# Function to run apt-get clean
clean_apt() {
  apt-get clean
}

# Function to run rm -rf /var/lib/apt/lists/*
clean_apt_lists() {
  rm -rf /var/lib/apt/lists/*
}

# Function to install bzip2, curl
install_bzip2_curl() {
  local do_clean_apt=${1:-false}
  local do_clean_lists=${2:-false}

  apt-get update \
    && apt-get install -y bzip2 curl

  if [ "$do_clean_apt" = true ]; then
    clean_apt
  fi

  if [ "$do_clean_lists" = true ]; then
    clean_apt_lists
  fi
}

# Function to install mongo shell
install_mongo_shell() {
  local do_clean_apt=${1:-false}
  local do_clean_lists=${2:-false}

  apt-get update \
    && curl https://downloads.mongodb.com/compass/mongodb-mongosh_1.3.1_amd64.deb -o mongodb-mongosh.deb \
    && apt-get install -y ./mongodb-mongosh.deb \
    && rm ./mongodb-mongosh.deb

  if [ "$do_clean_apt" = true ]; then
    clean_apt
  fi

  if [ "$do_clean_lists" = true ]; then
    clean_apt_lists
  fi
}

# Function to install mongo tools
install_mongo_tools() {
  local mongo_tool_version=${1:-"100.10.0"}
  local do_clean_apt=${2:-false}
  local do_clean_lists=${3:-false}

  apt-get update \
    && curl https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian10-x86_64-${mongo_tool_version}.deb -o mongodb-database-tools.deb \
    && apt-get install -y ./mongodb-database-tools.deb \
    && rm ./mongodb-database-tools.deb

  if [ "$do_clean_apt" = true ]; then
    clean_apt
  fi

  if [ "$do_clean_lists" = true ]; then
    clean_apt_lists
  fi
}

# Function to install PostgreSQL tools
install_postgresql_tools() {
  local postgresql_client_version=${1:-"17"}
  local do_clean_apt=${2:-false}
  local do_clean_lists=${3:-false}

  echo "deb http://apt.postgresql.org/pub/repos/apt $(cat /etc/os-release | grep VERSION_CODENAME | cut -d = -f 2)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && apt-get update \
    && apt-get install -y postgresql-common postgresql-client-${postgresql_client_version} --no-install-recommends

  if [ "$do_clean_apt" = true ]; then
    clean_apt
  fi

  if [ "$do_clean_lists" = true ]; then
    clean_apt_lists
  fi
}

# Function to install MariaDB tools
install_mariadb_tools() {
  local mariadb_client_version=${1:-"11.7.2"}
  local do_clean_apt=${2:-false}
  local do_clean_lists=${3:-false}

  curl -sSL https://downloads.mariadb.com/MariaDB/mariadb_repo_setup | bash -s -- --mariadb-server-version=${mariadb_client_version} \
    && apt-get update \
    && apt-get install -y mariadb-common mariadb-client --no-install-recommends

  if [ "$do_clean_apt" = true ]; then
    clean_apt
  fi

  if [ "$do_clean_lists" = true ]; then
    clean_apt_lists
  fi
}

# Function to install AWS CLI
install_aws_cli() {
  local do_clean_tmp=${1:-false}

  curl https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o /tmp/awscli.zip \
    && unzip -q /tmp/awscli.zip -d /tmp \
    && /tmp/aws/install

  if [ "$do_clean_tmp" = true ]; then
    rm /tmp/awscli.zip
  fi
}

# Function to install Google Cloud CLI
install_gcloud_cli() {
  local do_clean_apt=${1:-false}
  local do_clean_lists=${2:-false}

  echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" >> /etc/apt/sources.list.d/google-cloud-sdk.list \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - \
    && apt-get update \
    && apt-get install -y google-cloud-cli

  if [ "$do_clean_apt" = true ]; then
    clean_apt
  fi

  if [ "$do_clean_lists" = true ]; then
    clean_apt_lists
  fi
}
