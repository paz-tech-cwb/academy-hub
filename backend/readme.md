# Academy Hub API

REST API for a YouTube-based online learning platform. Course content is sourced directly from YouTube playlists, which are imported and organized into learning units. The API provides lesson management, user progress tracking, quizzes, and certificate issuance.

Built with ASP.NET Core (.NET 10) following Clean Architecture principles.

---

## Table of Contents

- [Architecture](#architecture)
- [Endpoints](#endpoints)
- [Requirements](#requirements)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Docker](#docker)
- [Database](#database)
- [Tests](#tests)

---

## Architecture

The project is organized into four layers:

```
src/
  api/          - HTTP layer: controllers, middlewares, extensions, Program.cs
  application/  - Business logic: use cases, DTOs, DI configuration
  domain/       - Core: entities, interfaces, enums
  infra/        - Data access: EF Core repositories, services (JWT, Selenium playlist import)
tests/
  domain.tests/ - Unit tests for domain entities
```

The YouTube playlist importer uses Selenium WebDriver to extract video metadata from playlist pages.

---

## Endpoints

API documentation is available via Scalar at `/scalar` when the application is running.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/user/register` | No | Register a new user |
| POST | `/api/user/login` | No | Authenticate and receive a JWT token |
| GET | `/api/user/{username}` | No | Get public user profile |
| GET | `/api/unity` | Yes | List all learning units |
| GET | `/api/unity/{unityName}` | Yes | Get a specific learning unit |
| POST | `/api/unity/import/{playlistUrl}` | Yes | Import lessons from a YouTube playlist URL |
| GET | `/api/lesson/list/{unityName}` | Yes | List lessons within a unit |
| GET | `/api/lesson/{unityName}/{lessonName}` | Yes | Get a specific lesson |
| GET | `/api/questionnaire/{unityName}/{lessonName}` | Yes | Get the quiz for a lesson |
| POST | `/api/questionnaire/verify-answers` | Yes | Submit and validate answers |
| POST | `/api/certificate/issue?unityName={name}` | Yes | Issue a certificate for a completed unit |
| GET | `/api/certificate` | Yes | List certificates for the authenticated user |

Authenticated routes require a `Bearer` token in the `Authorization` header.

---

## Requirements

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- MySQL 8+
- Google Chrome + ChromeDriver (used by the Selenium-based playlist importer)
- Docker and Docker Compose (optional, for containerized setup)

---

## Configuration

The application reads configuration from `src/api/appsettings.json`. For local development, override values in `appsettings.Development.json` or via environment variables.

| Key | Description | Default |
|-----|-------------|---------|
| `ConnectionStrings__MySql` | MySQL connection string | `server=localhost;port=3306;database=academyhub;user=root;password=12345` |
| `JwtConfig__Key` | JWT signing key (minimum 64 characters) | — |
| `JwtConfig__Issuer` | JWT issuer | `AcademyHubApi` |
| `JwtConfig__Audience` | JWT audience | `AcademyHubUsers` |
| `JwtConfig__TokenValidityMins` | Token lifetime in minutes | `1440` (24 hours) |

**Never commit secrets.** Use environment variables or a secrets manager in production.

---

## Running Locally

**1. Start the database:**

```bash
docker compose -f .docker/compose/docker-compose.yaml up -d
```

This starts MySQL and runs the initialization scripts automatically.

**2. Configure the Cloudflare R2 credentials:**

Unit covers are stored in Cloudflare R2. The credentials are read only from environment variables (never from `appsettings`), so set them on your machine before running the API:

| Variable | Description |
|----------|-------------|
| `R2_ACCESS_KEY_ID` | Access Key ID of the R2 API token |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key of the R2 API token |

The token used locally must be scoped **only to the `academy-hub-dev` bucket**. Never use a token with access to the production bucket (`academy-hub`) on a development machine.

```powershell
# Windows (PowerShell) — persists for the current user; reopen the terminal/IDE afterwards
[Environment]::SetEnvironmentVariable("R2_ACCESS_KEY_ID", "<access-key-id>", "User")
[Environment]::SetEnvironmentVariable("R2_SECRET_ACCESS_KEY", "<secret-access-key>", "User")
```

```bash
# Linux / macOS
export R2_ACCESS_KEY_ID="<access-key-id>"
export R2_SECRET_ACCESS_KEY="<secret-access-key>"
```

Without these variables the API still starts, but uploading or removing unit covers fails.

**3. Run the API:**

```bash
dotnet run --project src/api/api.csproj
```

**4. Drop the database:**
```bash
docker compose -f .docker/compose/docker-compose.yaml down -v
```

The API will be available at:
- `http://localhost:5165`
- `https://localhost:7034`
- `https://localhost:7034/scalar` (API docs)

---

## Docker

To build and run the application container:

```bash
docker build -f .docker/dockerfiles/Dockerfile -t academy-hub-api .
docker run -p 8080:8080 academy-hub-api
```

---

## Database

Database: MySQL. Schema name: `academyhub`.

The initialization scripts in `.docker/compose/` are executed in order when the MySQL container starts:

| Script | Purpose |
|--------|---------|
| `1-create-statement.sql` | Creates all tables |
| `2-inserts.sql` | Seeds users and units |
| `3-inserts-lessons.sql` | Seeds lessons |
| `4-inserts-questions.sql` | Seeds quiz questions |
| `5-inserts-alternatives.sql` | Seeds answer alternatives |

Main tables: `users`, `unities`, `lessons`, `questions`, `alternatives`, `answers`, `certificates`.

### Seed users

For local testing, the admin user `lucasaguiar` created by the seed uses the username as its password:

| Username | Password | Role |
|----------|----------|------|
| `lucasaguiar` | `lucasaguiar` | Admin |

Seed users have fixed `public_id` values, so a JWT issued before the database is recreated (e.g. after `docker compose down` / `docker compose up`) keeps working, since the token carries the user's `public_id`. Keep these ids fixed when editing the seed: if they change, previously issued tokens fail with `Entity not found` and the user has to log in again.

---

## Tests

```bash
dotnet test tests/domain.tests/domain.tests.csproj
```

---

Last update: 2026, april 24