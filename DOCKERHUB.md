# Snaplake

Self-hosted database snapshot management platform. Captures point-in-time snapshots from PostgreSQL and MySQL databases as Parquet files, stores them locally or on S3, and lets you query and compare snapshots with SQL powered by DuckDB.

![Dashboard](https://raw.githubusercontent.com/clroot/snaplake/main/docs/screenshots/features/dashboard.png)

## Features

- **Database Snapshots** — Capture full table snapshots as Apache Parquet files
- **SQL Query Engine** — Write SQL queries across any snapshot using DuckDB
- **Snapshot Comparison** — Row-level diff with color-coded highlighting
- **Scheduled Snapshots** — Cron-based automatic snapshots per datasource
- **Retention Policies** — Daily/monthly retention limits to manage storage
- **Flexible Storage** — Local filesystem or S3-compatible object storage
- **Setup Wizard** — Guided initial setup for admin account, storage, and first datasource
- **Dark Mode** — Full dark/light theme support

## Quick Start

```bash
docker run -d \
  --name snaplake \
  -p 8080:8080 \
  -v snaplake-data:/app/data \
  -e SNAPLAKE_JWT_SECRET=your-secret-key \
  -e SNAPLAKE_ENCRYPTION_KEY=your-encryption-key \
  abcdkh1209/snaplake:latest
```

> **Note:** Replace `your-secret-key` and `your-encryption-key` with your own secure values. These are used for JWT signing and datasource password encryption respectively. If omitted, random keys are auto-generated on each restart, which will invalidate existing sessions and encrypted data.

Open [http://localhost:8080](http://localhost:8080) and follow the setup wizard.

## Docker Compose

```yaml
services:
  snaplake:
    image: abcdkh1209/snaplake:latest
    ports:
      - "8080:8080"
    volumes:
      - snaplake-data:/app/data
    environment:
      SNAPLAKE_DATA_DIR: /app/data
      SNAPLAKE_JWT_SECRET: your-secret-key
      SNAPLAKE_ENCRYPTION_KEY: your-encryption-key
    restart: unless-stopped

volumes:
  snaplake-data:
```

### Try with Sample Database

```yaml
services:
  snaplake:
    image: abcdkh1209/snaplake:latest
    ports:
      - "8080:8080"
    volumes:
      - snaplake-data:/app/data
    environment:
      SNAPLAKE_DATA_DIR: /app/data
      SNAPLAKE_JWT_SECRET: your-secret-key
      SNAPLAKE_ENCRYPTION_KEY: your-encryption-key
    restart: unless-stopped

  sample-db:
    image: postgres:17
    environment:
      POSTGRES_DB: sampledb
      POSTGRES_USER: demo
      POSTGRES_PASSWORD: demo1234
    ports:
      - "15432:5432"
    restart: unless-stopped

volumes:
  snaplake-data:
```

Connect to sample database during setup:

| Field | Value |
|---|---|
| Host | `sample-db` |
| Port | `5432` |
| Database | `sampledb` |
| Username | `demo` |
| Password | `demo1234` |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SNAPLAKE_DATA_DIR` | `/app/data` | Directory for SQLite metadata DB and local snapshots |
| `SNAPLAKE_PORT` | `8080` | Server port |
| `SNAPLAKE_JWT_SECRET` | (auto-generated) | JWT signing secret |
| `SNAPLAKE_ENCRYPTION_KEY` | (auto-generated) | AES key for encrypting datasource passwords |

## Volumes

| Path | Description |
|---|---|
| `/app/data` | SQLite metadata database and local snapshot storage |

## Supported Platforms

- `linux/amd64`
- `linux/arm64`

## Links

- [GitHub](https://github.com/clroot/snaplake)
- [Documentation](https://github.com/clroot/snaplake#readme)
- [Setup Guide](https://github.com/clroot/snaplake/blob/main/docs/setup-guide.md)

## License

[MIT License](https://github.com/clroot/snaplake/blob/main/LICENSE)
