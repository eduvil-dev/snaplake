> [한국어](README.ko.md)

# Snaplake

Self-hosted database snapshot management platform. Captures point-in-time snapshots from PostgreSQL and MySQL databases as Parquet files, stores them locally or on S3, and lets you query and compare snapshots with SQL powered by DuckDB.

![Dashboard](docs/screenshots/features/dashboard.png)

## Features

### Database Snapshots

Capture full table snapshots as Apache Parquet files. Browse snapshot contents with filtering, sorting, and CSV/JSON export.

![Snapshot Browser](docs/screenshots/features/snapshots.png)

### SQL Query Engine

Write SQL queries across any snapshot using DuckDB. Join tables, aggregate data, and export results.

![SQL Query](docs/screenshots/features/query.png)

### Snapshot Comparison

Compare two snapshots side-by-side with row-level diff. Instantly see added, removed, and modified rows with color-coded highlighting.

![Compare Diff](docs/screenshots/features/compare-diff.png)

### And More

- **Scheduled Snapshots** — Cron-based automatic snapshots per datasource
- **Retention Policies** — Daily/monthly retention limits to manage storage automatically
- **Flexible Storage** — Local filesystem or S3-compatible object storage (AWS S3, MinIO, etc.)
- **Setup Wizard** — Guided initial setup for admin account, storage, and first datasource
- **Dark Mode** — Full dark/light theme support

## Quick Start

### Docker (Recommended)

```bash
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080) and follow the setup wizard.

### Try with Sample Database

A demo compose file is included with a pre-configured PostgreSQL database:

```bash
docker compose -f docker-compose.demo.yml up --build
```

This starts Snaplake alongside a PostgreSQL instance loaded with sample data (customers, products, orders). Connect to it during setup:

| Field | Value |
|---|---|
| Host | `sample-db` |
| Port | `5432` |
| Database | `sampledb` |
| Username | `demo` |
| Password | `demo1234` |

### Local Development

**Prerequisites:** Java 21, [Bun](https://bun.sh)

```bash
# Start backend (port 8080)
./gradlew bootRun

# Start frontend dev server (port 5173, proxied to backend)
cd frontend && bun install && bun run dev
```

## Setup Guide

On first launch, the setup wizard walks you through initial configuration. See the [Setup Guide](docs/setup-guide.md) for details.

## Configuration

All configuration is done via environment variables:

| Variable | Default | Description |
|---|---|---|
| `SNAPLAKE_DATA_DIR` | `./data` | Directory for SQLite metadata DB and local snapshots |
| `SNAPLAKE_PORT` | `8080` | Server port |
| `SNAPLAKE_JWT_SECRET` | (auto-generated) | JWT signing secret |
| `SNAPLAKE_ENCRYPTION_KEY` | (auto-generated) | AES key for encrypting datasource passwords |

Storage (Local or S3) is configured through the web UI during setup.

## Architecture

Hexagonal Architecture with clear separation of concerns:

```
adapter/inbound     (Web, CLI, Scheduler)
        |
application/port    (UseCase interfaces, Port interfaces)
application/service (UseCase implementations)
        |
domain/model        (Pure Kotlin domain models)
        |
adapter/outbound    (JPA, DuckDB, S3, Local Storage)
```

Dependency direction: `adapter -> application -> domain`

### Extension Points

- **DatabaseDialect** — Add support for new database types (currently PostgreSQL, MySQL)
- **StorageProvider** — Add new storage backends (currently Local, S3)

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Kotlin, Spring Boot 3.4, Java 21 |
| Metadata DB | SQLite |
| Query Engine | DuckDB |
| Snapshot Format | Apache Parquet |
| Frontend | React 19, TypeScript, Vite |
| UI Components | Carbon Design System |
| Routing / State | TanStack Router, TanStack Query |
| Auth | JWT + Argon2 |
| Storage | Local filesystem / S3-compatible |

## Build

```bash
# Full build (backend + frontend)
./gradlew build

# Run tests
./gradlew test

# Frontend only
cd frontend && bun run build

# Frontend lint
cd frontend && bun run lint
```

## License

This project is licensed under the [MIT License](LICENSE).
