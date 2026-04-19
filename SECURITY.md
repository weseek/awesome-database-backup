# Security Policy

## Supported Versions

Security updates are provided for the **latest patch release** of each minor version within the `1.x` line.
Older major versions are not actively maintained with security patches.

| Version | Supported          |
| ------- | ------------------ |
| 1.x (latest patch of each minor) | :white_check_mark: |
| < 1.0   | :x:                |

### Database Tool Version Support

This project ships Docker images that bundle specific versions of database CLI tools
(e.g., `mongodump`, `pg_dump`, `mariadb-dump`).
Each image tag encodes the bundled DB tool version, for example:

```
weseek/awesome-mongodb-backup:1.2.3-mongodb-100.5.4
```

Security fixes are applied to the latest image tag for each actively maintained DB tool version.
For the full compatibility matrix between image versions and supported database server versions, see:

> https://github.com/weseek/awesome-database-backup/wiki/DB-tool-version-and-compatibility

Database server versions that have reached end-of-life (EOL) according to their upstream vendors
are **not** covered by the security support window of this project.

## Reporting a Vulnerability

We take security issues seriously. If you discover a security vulnerability in this project,
please report it through **GitHub's private vulnerability reporting** so it can be addressed
before public disclosure.

**How to report:**

1. Go to the [Security Advisories page](https://github.com/weseek/awesome-database-backup/security/advisories).
2. Click **"Report a vulnerability"**.
3. Fill in the details: affected component(s), reproduction steps, potential impact, and any suggested fix.

**What to expect:**

- If the vulnerability is confirmed, we will work on a fix and coordinate a release. We will credit you in the release notes unless you prefer to remain anonymous.
- If the report is declined, we will explain why in the advisory thread.

**Please do not** open a public GitHub issue for security vulnerabilities, as this may expose users
to risk before a fix is available.
