# cercana-ti Backend — NestJS Template

> Enterprise-grade NestJS backend template with TypeORM, Supabase/PostgreSQL, structured logging, Datadog APM, Swagger, and multi-stage Docker builds.

![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Architecture](#4-architecture)
5. [Requirements](#5-requirements)
6. [Environment Variables](#6-environment-variables)
7. [Installation](#7-installation)
8. [Running the Project](#8-running-the-project)
9. [Available Scripts](#9-available-scripts)
10. [API Documentation](#10-api-documentation)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Database](#12-database)
13. [Testing](#13-testing)
14. [Logging & Monitoring](#14-logging--monitoring)
15. [Docker & Deployment](#15-docker--deployment)
16. [Code Quality](#16-code-quality)
17. [Security](#17-security)
18. [Troubleshooting](#18-troubleshooting)
19. [Contributing](#19-contributing)
20. [License](#20-license)

---

## 1. Overview

### Objective

`cercana-ti-backend-nestjs-template` is a **production-ready NestJS backend template** designed for rapid development of scalable REST APIs. It provides a solid foundation with opinionated defaults that follow Clean Architecture, SOLID principles, and enterprise engineering practices.

### Problem It Solves

Starting a new NestJS backend project from scratch requires setting up dozens of cross-cutting concerns: structured logging, request correlation, rate limiting, security headers, database connection management, Swagger docs, Docker packaging, and CI/CD pipelines. This template solves all of that out of the box.

### Architecture Overview

```
Client
  │
  ▼
[NestJS Application]
  │  ├── Middleware: RequestTrackingMiddleware (Correlation/Trace IDs)
  │  ├── Global Pipe: ValidationPipe (whitelist, transform)
  │  ├── Interceptor: LoggingInterceptor
  │  └── Security: Helmet · CORS · ThrottlerGuard
  │
  ├── Modules
  │     ├── CustomerModule  →  CustomerController → CustomerService → TypeORM Repository
  │     └── CompanyModule   →  (scaffold — pending implementation)
  │
  ├── Common Layer
  │     ├── HttpClientService / CommonHttpService / BaseApiService
  │     ├── LoggerService (Winston)
  │     ├── Decorators: @ApiCrudOperation, @ClientContext
  │     └── Interfaces: RequestContext, HttpRequestConfig
  │
  └── Config Layer
        ├── DatabaseConfig (TypeORM / Supabase dual-mode)
        ├── loggerConfig (nestjs-pino)
        └── initializeTracing (Datadog dd-trace)
```

### High-Level Flow

1. Each incoming HTTP request passes through `RequestTrackingMiddleware`, which injects `X-Correlation-ID`, `X-Request-ID`, and `X-Trace-ID` headers.
2. The `LoggingInterceptor` logs structured entry/exit metadata for every request.
3. `ValidationPipe` strips unknown fields and validates DTOs at the boundary.
4. Business logic is handled in domain services backed by TypeORM repositories.
5. All responses and errors are serialized consistently via NestJS exception filters.

---

## 2. Tech Stack

| Category         | Tool / Library                           | Version       |
| ---------------- | ---------------------------------------- | ------------- |
| Language         | TypeScript                               | ^5.7          |
| Runtime          | Node.js                                  | 20 (LTS)      |
| Framework        | NestJS                                   | ^11           |
| HTTP Server      | Express (via `@nestjs/platform-express`) | ^5            |
| ORM              | TypeORM                                  | ^0.3          |
| Database         | PostgreSQL (Supabase)                    | —             |
| Supabase Client  | `@supabase/supabase-js`                  | ^2            |
| HTTP Client      | Axios (`@nestjs/axios`)                  | ^4            |
| Validation       | class-validator / class-transformer      | ^0.14 / ^0.5  |
| API Docs         | Swagger (`@nestjs/swagger`)              | ^11           |
| Rate Limiting    | `@nestjs/throttler`                      | ^6            |
| Security Headers | Helmet                                   | ^8            |
| Compression      | compression                              | ^1.7          |
| Logging (HTTP)   | nestjs-pino / pino / pino-pretty         | ^4 / ^9 / ^13 |
| Logging (App)    | Winston                                  | ^3            |
| APM / Tracing    | Datadog dd-trace                         | ^5            |
| Config           | `@nestjs/config` + dotenv                | ^4 / ^16      |
| Testing          | Jest + `@nestjs/testing` + ts-jest       | ^29           |
| Linting          | ESLint + typescript-eslint               | ^9 / ^8       |
| Formatting       | Prettier                                 | ^3            |
| CI/CD            | GitHub Actions                           | —             |
| Containerization | Docker (multi-stage, Alpine)             | —             |

---

## 3. Project Structure

```
cercana-ti-backend-nestjs-template/
├── .github/
│   ├── workflows/
│   │   └── node-ci.yml          # CI pipeline (format, lint, build, test)
│   ├── pull_request_template.md # Standardized PR checklist
│   ├── copilot-instructions.yml # GitHub Copilot custom commands
│   └── agent.md
├── src/
│   ├── main.ts                  # Bootstrap: Helmet, CORS, Swagger, Pino, Tracing
│   ├── app.module.ts            # Root module: Throttler, TypeORM, ConfigModule
│   ├── app.controller.ts        # GET / and GET /health endpoints
│   ├── app.service.ts           # Health check logic
│   │
│   ├── config/
│   │   ├── database.config.ts   # TypeORM factory (TypeORM/Supabase dual-mode)
│   │   ├── logger.config.ts     # nestjs-pino configuration (serializers, levels)
│   │   ├── supabase.config.ts   # Supabase JS client singleton factory
│   │   └── tracing.config.ts    # Datadog dd-trace initialization
│   │
│   ├── common/
│   │   ├── common.module.ts     # Exports LoggingInterceptor, LoggerService
│   │   ├── axios/
│   │   │   └── common-http.service.ts  # Thin wrapper over HttpClientService
│   │   ├── config/
│   │   │   └── base-service.config.ts  # Abstract base for external service configs
│   │   ├── controllers/
│   │   │   └── base-crud.controller.ts # Abstract CRUD contract
│   │   ├── decorators/
│   │   │   ├── api-crud.decorator.ts       # @ApiCrudOperation, @ApiFindByIdentification
│   │   │   ├── api-helpers.decorator.ts
│   │   │   ├── api-responses.decorator.ts  # @ApiAnalyticsEndpoint, @ApiCrudEndpoint
│   │   │   ├── base-crud.decorator.ts      # @ApiCrudController (Swagger tags)
│   │   │   └── client-context.decorator.ts # @ClientContext param decorator
│   │   ├── http/
│   │   │   ├── http.module.ts
│   │   │   ├── interfaces/
│   │   │   │   └── http.interface.ts        # HttpRequestConfig, HttpResponse
│   │   │   └── services/
│   │   │       ├── axios-http.service.ts    # Axios implementation
│   │   │       └── http-client.service.ts   # Abstract HttpClientService
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts       # Structured request/response logging
│   │   ├── interfaces/
│   │   │   └── request-context.interface.ts # RequestContext, extractRequestContext
│   │   ├── middlewares/
│   │   │   └── correlation-id.middleware.ts # Injects Correlation/Trace/Request IDs
│   │   └── services/
│   │       ├── base-api.service.ts          # Abstract base for external API clients
│   │       └── logger.service.ts            # Winston-based LoggerService
│   │
│   └── modules/
│       ├── customer/                        # Full CRUD domain module
│       │   ├── customer.module.ts
│       │   ├── controllers/
│       │   │   └── customer.controller.ts
│       │   ├── dto/
│       │   │   ├── create-customer.dto.ts
│       │   │   └── update-customer.dto.ts
│       │   ├── entities/
│       │   │   └── customer.entity.ts       # TypeORM entity + domain validation
│       │   └── services/
│       │       └── customer.service.ts
│       └── company/                         # Scaffold — pending implementation
│           └── company.module.ts
├── Dockerfile                   # Multi-stage build (builder → deps → production)
├── .env.example                 # All environment variables documented
├── .env                         # Local overrides (git-ignored)
├── nest-cli.json
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
└── package.json
```

### Folder Responsibilities

| Folder                   | Responsibility                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `src/config/`            | Infrastructure bootstrapping: DB, logging, tracing, Supabase client                |
| `src/common/`            | Shared cross-cutting concerns: logging, HTTP client, decorators, middlewares       |
| `src/common/decorators/` | Reusable Swagger + NestJS decorators for CRUD and analytics endpoints              |
| `src/common/http/`       | Abstract HTTP client + Axios implementation for external API consumption           |
| `src/common/services/`   | `BaseApiService` (external APIs), `LoggerService` (Winston)                        |
| `src/modules/`           | Business domain modules. Each module owns its controller, service, DTO, and entity |

---

## 4. Architecture

### Pattern

This project follows a **Layered Module Architecture** inspired by Clean Architecture principles, adapted to the NestJS module system.

### Layers

```
┌─────────────────────────────────────────────────────┐
│  Transport Layer  (Controllers, Middlewares, Guards) │
├─────────────────────────────────────────────────────┤
│  Application Layer  (Services, DTOs, Decorators)    │
├─────────────────────────────────────────────────────┤
│  Domain Layer  (Entities, Domain Validation)        │
├─────────────────────────────────────────────────────┤
│  Infrastructure Layer  (TypeORM, Supabase, Axios)   │
└─────────────────────────────────────────────────────┘
```

| Layer          | Files                                                               |
| -------------- | ------------------------------------------------------------------- |
| Transport      | `*.controller.ts`, `*.middleware.ts`, `*.interceptor.ts`            |
| Application    | `*.service.ts`, `*.dto.ts`, `*.decorator.ts`                        |
| Domain         | `*.entity.ts` (includes domain validation methods)                  |
| Infrastructure | `database.config.ts`, `supabase.config.ts`, `axios-http.service.ts` |

### Key Design Patterns

| Pattern               | Where Applied                                                                 |
| --------------------- | ----------------------------------------------------------------------------- |
| Repository Pattern    | TypeORM `Repository<T>` injected via `@InjectRepository`                      |
| Abstract Service      | `BaseApiService` for external HTTP calls; `HttpClientService` abstract        |
| Decorator Composition | `@ApiCrudOperation`, `@ApiCrudController` compose multiple Swagger decorators |
| Factory Pattern       | `DatabaseConfig.createTypeOrmOptions()` — dynamic DB config at startup        |
| Middleware Chain      | `RequestTrackingMiddleware` applied globally for correlation tracking         |
| Strategy Pattern      | `DB_PROVIDER` env variable switches between TypeORM and Supabase strategies   |
| Soft Delete           | Entity-level `softDelete()` / `restore()` methods, `DeleteDateColumn`         |

### Request Execution Flow

```
Incoming Request
      │
      ▼
RequestTrackingMiddleware         ← injects X-Correlation-ID, X-Trace-ID
      │
      ▼
ThrottlerGuard                    ← rate limiting (100 req / 60s default)
      │
      ▼
LoggingInterceptor (enter)        ← logs method, url, requestId
      │
      ▼
ValidationPipe                    ← validates + strips DTO
      │
      ▼
Controller → Service → Repository
      │
      ▼
LoggingInterceptor (exit/error)   ← logs status, duration, size
      │
      ▼
Response
```

---

## 5. Requirements

| Tool       | Minimum Version               | Notes                                          |
| ---------- | ----------------------------- | ---------------------------------------------- |
| Node.js    | **18** (CI) / **20** (Docker) | Recommend Node 20 LTS locally                  |
| npm        | 9+                            | Bundled with Node 20                           |
| Docker     | 20+                           | Required for containerized runs                |
| Git        | 2.x                           | Required for branch strategy                   |
| PostgreSQL | 14+                           | Provided via Supabase; no local install needed |

> A Supabase project (free tier works) is required to supply the `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` values.

---

## 6. Environment Variables

Copy `.env.example` to `.env` and populate the required values before running the application.

```bash
cp .env.example .env
```

The application loads env files in the following priority order (first match wins):  
`.env.local` → `.env.development` → `.env.staging` → `.env.production` → `.env`

### Application

| Variable       | Description                         | Required | Default              |
| -------------- | ----------------------------------- | -------- | -------------------- |
| `NODE_ENV`     | Runtime environment                 | No       | `development`        |
| `PORT`         | HTTP port the server listens on     | No       | `3000`               |
| `SERVICE_NAME` | Logical service name (used in logs) | No       | `cercana-ti-backend` |

### Database

| Variable            | Description                                                | Required                         | Default   |
| ------------------- | ---------------------------------------------------------- | -------------------------------- | --------- |
| `DB_PROVIDER`       | Database access mode: `typeorm` or `supabase`              | No                               | `typeorm` |
| `DATABASE_URL`      | PostgreSQL connection string (required for both providers) | **Yes**                          | —         |
| `SUPABASE_URL`      | Supabase project URL                                       | Only when `DB_PROVIDER=supabase` | —         |
| `SUPABASE_ANON_KEY` | Supabase public anonymous key                              | Only when `DB_PROVIDER=supabase` | —         |

> **DB_PROVIDER modes:**
>
> - `typeorm` — uses TypeORM `Repository` API, `QueryBuilder`, and schema migrations directly.
> - `supabase` — uses the Supabase JS client (supports realtime, RLS, storage, auth). TypeORM still uses `DATABASE_URL` for schema management.

### Security

| Variable      | Description                             | Required | Default                 |
| ------------- | --------------------------------------- | -------- | ----------------------- |
| `CORS_ORIGIN` | Comma-separated list of allowed origins | No       | `http://localhost:3000` |

### Rate Limiting

| Variable           | Description                  | Required | Default |
| ------------------ | ---------------------------- | -------- | ------- |
| `RATE_LIMIT_TTL`   | Rate limit window in seconds | No       | `60`    |
| `RATE_LIMIT_LIMIT` | Maximum requests per window  | No       | `100`   |

### Logging

| Variable    | Description                                                | Required | Default |
| ----------- | ---------------------------------------------------------- | -------- | ------- |
| `LOG_LEVEL` | Pino log level (`trace`, `debug`, `info`, `warn`, `error`) | No       | `info`  |

### Datadog APM (Optional)

| Variable           | Description                          | Required                          | Default              |
| ------------------ | ------------------------------------ | --------------------------------- | -------------------- |
| `DD_TRACE_ENABLED` | Enable Datadog distributed tracing   | No                                | `false`              |
| `DD_API_KEY`       | Datadog API key                      | Only when `DD_TRACE_ENABLED=true` | —                    |
| `DD_SERVICE`       | Service name reported to Datadog     | No                                | `cercana-ti-backend` |
| `DD_ENV`           | Environment name reported to Datadog | No                                | `development`        |
| `DD_VERSION`       | Version reported to Datadog          | No                                | `1.0.0`              |

---

## 7. Installation

### 1. Clone the Repository

```bash
git clone https://github.com/cercanati/cercana-ti-backend-nestjs-template.git
cd cercana-ti-backend-nestjs-template
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL and any other required values
```

Minimum configuration required to start:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

### 4. Database Setup

This template uses Supabase as the PostgreSQL host. No local PostgreSQL installation is needed.

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database → Connection string** and copy the URI.
3. Paste it as `DATABASE_URL` in your `.env`.

> In `development`, `synchronize: true` is enabled so TypeORM will auto-create the `customers` table on startup. For staging/production, run migrations manually (see [Database](#12-database)).

### 5. Verify Installation

```bash
npm run build
```

---

## 8. Running the Project

### Development (watch mode)

```bash
npm run start:dev
```

The server hot-reloads on every file change. Logs are printed in human-readable format via `pino-pretty`.

### Local (single run)

```bash
npm run start
```

### Production

```bash
npm run build
npm run start:prod
```

Or via Docker (recommended for production — see [Docker & Deployment](#15-docker--deployment)).

### Debug Mode

```bash
npm run start:debug
```

Starts the application with Node.js `--inspect` on the default debug port (`9229`). Attach VS Code or Chrome DevTools.

### Docker

```bash
docker build -t cercana-ti-backend .
docker run -p 3000:3000 --env-file .env cercana-ti-backend
```

---

## 9. Available Scripts

| Script         | Command                                       | Description                            |
| -------------- | --------------------------------------------- | -------------------------------------- |
| `build`        | `nest build`                                  | Compile TypeScript to `dist/`          |
| `start`        | `nest start`                                  | Start the application once             |
| `start:dev`    | `nest start --watch`                          | Start with hot reload (development)    |
| `start:debug`  | `nest start --debug --watch`                  | Start with Node.js inspector           |
| `start:prod`   | `node dist/main`                              | Run compiled production build          |
| `format`       | `prettier --write "src/**/*.ts"`              | Auto-format all source files           |
| `format:check` | `prettier --check "src/**/*.ts"`              | Verify formatting (used in CI)         |
| `lint`         | `eslint "{src,apps,libs,test}/**/*.ts" --fix` | Lint and auto-fix TypeScript files     |
| `test`         | `jest`                                        | Run all unit tests                     |
| `test:watch`   | `jest --watch`                                | Run tests in interactive watch mode    |
| `test:cov`     | `jest --coverage`                             | Run tests and generate coverage report |
| `test:debug`   | `node --inspect-brk ... jest --runInBand`     | Debug tests with Node.js inspector     |
| `typeorm`      | `typeorm-ts-node-commonjs`                    | TypeORM CLI entry point for migrations |

---

## 10. API Documentation

### Base URL

```
http://localhost:3000
```

### Interactive Swagger UI

Available at **`/api/docs`** in all non-production environments:

```
http://localhost:3000/api/docs
```

> Swagger is disabled when `NODE_ENV=production` for security reasons.

### Authentication

All endpoints are documented with Bearer token support in Swagger (`addBearerAuth()`). Authentication enforcement (guards) is **not yet implemented** — this is a template placeholder.

Pass the token as:

```
Authorization: Bearer <token>
```

### Health Endpoints

| Method | Path      | Description                           | Auth |
| ------ | --------- | ------------------------------------- | ---- |
| `GET`  | `/`       | Basic health check                    | No   |
| `GET`  | `/health` | Detailed health (uptime, memory, env) | No   |

**`GET /health` response example:**

```json
{
  "status": "ok",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "service": "cercana-ti-backend-nestjs",
  "version": "1.0.0",
  "environment": "development",
  "uptime": 342.5,
  "memory": {
    "rss": 52428800,
    "heapTotal": 20971520,
    "heapUsed": 14233456
  },
  "databases": {
    "postgresql": "connected",
    "supabase": "connected"
  }
}
```

### Customer Endpoints

| Method   | Path                                        | Description                             | Auth    |
| -------- | ------------------------------------------- | --------------------------------------- | ------- |
| `POST`   | `/customers`                                | Create a new customer                   | Planned |
| `GET`    | `/customers`                                | List customers (paginated, filterable)  | Planned |
| `GET`    | `/customers/:id`                            | Get a customer by UUID                  | Planned |
| `GET`    | `/customers/identification/:identification` | Get a customer by identification number | Planned |
| `PUT`    | `/customers/:id`                            | Update a customer                       | Planned |
| `DELETE` | `/customers/:id`                            | Soft-delete a customer (204)            | Planned |
| `PATCH`  | `/customers/:id/restore`                    | Restore a soft-deleted customer         | Planned |

#### Query Parameters — `GET /customers`

| Parameter | Type     | Required | Description                                       |
| --------- | -------- | -------- | ------------------------------------------------- |
| `page`    | `number` | No       | Page number (default: `1`)                        |
| `limit`   | `number` | No       | Items per page (default: `10`)                    |
| `status`  | `enum`   | No       | Filter by status: `active`, `pending`, `inactive` |

#### `POST /customers` — Request Body

```json
{
  "identification": "1234567890",
  "name": "Juan",
  "lastname": "Pérez",
  "dateBorn": "1990-05-15",
  "gender": "male",
  "status": "active"
}
```

#### `POST /customers` — Response `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "identification": "1234567890",
  "name": "Juan",
  "lastname": "Pérez",
  "dateBorn": "1990-05-15",
  "gender": "male",
  "status": "active",
  "createDate": "2026-06-04T12:00:00.000Z",
  "updateDate": "2026-06-04T12:00:00.000Z",
  "deletedAt": null
}
```

#### `GET /customers` — Paginated Response

```json
{
  "customers": [...],
  "total": 42,
  "page": 1,
  "totalPages": 5
}
```

#### Error Handling

All errors follow NestJS's default exception format:

```json
{
  "statusCode": 404,
  "message": "Customer with ID 550e8400-... not found",
  "error": "Not Found"
}
```

| Status Code | Scenario                                    |
| ----------- | ------------------------------------------- |
| `400`       | Validation failure (missing/invalid fields) |
| `404`       | Entity not found                            |
| `409`       | Duplicate identification                    |
| `429`       | Rate limit exceeded                         |
| `500`       | Unexpected internal error                   |

### Request Tracing Headers

Every response includes the following correlation headers:

| Header             | Description                                   |
| ------------------ | --------------------------------------------- |
| `X-Correlation-ID` | Unique UUID for the request, used across logs |
| `X-Request-ID`     | Alias for `X-Correlation-ID`                  |
| `X-Trace-ID`       | Independent trace UUID                        |

---

## 11. Authentication & Authorization

> **Current state:** Authentication infrastructure is partially scaffolded but **not enforced**. The Swagger UI includes `addBearerAuth()` and the `@ClientContext` decorator extracts auth context from headers. Route guards are pending implementation.

### Request Context (`@ClientContext`)

The `@ClientContext` parameter decorator extracts the following from request headers:

| Header             | Context Field   | Description                     |
| ------------------ | --------------- | ------------------------------- |
| `X-Correlation-ID` | `correlationId` | Request correlation identifier  |
| `X-App-ID`         | `appId`         | Calling application ID          |
| `X-CAS-ID`         | `casId`         | CAS session identifier          |
| `X-Client-App`     | `clientApp`     | Client application name         |
| `Authorization`    | `authorization` | Bearer token (redacted in logs) |

**Usage in a controller:**

```typescript
@Get(':id')
async findOne(
  @Param('id') id: string,
  @ClientContext() context: RequestContext,
): Promise<Customer> {
  // context.correlationId, context.authorization, etc.
  return this.customerService.findOne(id);
}
```

### Planned Authentication

- JWT / Bearer token validation via `@nestjs/passport` and `passport-jwt`
- Role-based access control (RBAC) guards
- Supabase Auth integration (when `DB_PROVIDER=supabase`)

---

## 12. Database

### Engine

PostgreSQL hosted on **Supabase**. The same Supabase PostgreSQL instance is used regardless of `DB_PROVIDER`.

### Provider Modes

| Mode                | Access Pattern                                     | Use When                              |
| ------------------- | -------------------------------------------------- | ------------------------------------- |
| `typeorm` (default) | TypeORM `Repository` API, QueryBuilder, migrations | Standard CRUD, complex queries        |
| `supabase`          | Supabase JS client (`@supabase/supabase-js`)       | Realtime, RLS, Storage, Auth features |

Switch modes by changing `DB_PROVIDER` in `.env` — no data migration required.

### ORM

**TypeORM v0.3** — Repository pattern, entity decorators, schema synchronization.

### Entities

#### Customer

| Column           | Type          | Constraints        | Description                       |
| ---------------- | ------------- | ------------------ | --------------------------------- |
| `id`             | `uuid`        | PK, auto-generated | Primary key                       |
| `identification` | `varchar(25)` | UNIQUE, NOT NULL   | National ID / document number     |
| `name`           | `varchar(50)` | NOT NULL           | First name                        |
| `lastname`       | `varchar(50)` | NOT NULL           | Last name                         |
| `dateBorn`       | `date`        | NOT NULL           | Date of birth                     |
| `gender`         | `enum`        | Nullable           | `male` / `female` / `other`       |
| `status`         | `enum`        | Default: `pending` | `active` / `pending` / `inactive` |
| `createDate`     | `timestamptz` | Auto               | Creation timestamp                |
| `updateDate`     | `timestamptz` | Auto               | Last update timestamp             |
| `deletedAt`      | `timestamptz` | Nullable           | Soft delete timestamp             |

### Migrations

Migrations are managed via TypeORM CLI. Auto-run (`migrationsRun`) is **disabled** — migrations must be executed manually.

```bash
# Generate a migration from entity changes
npm run typeorm migration:generate -- src/migrations/MigrationName

# Run pending migrations
npm run typeorm migration:run

# Revert last migration
npm run typeorm migration:revert
```

> In `development` mode only, `synchronize: true` auto-applies schema changes on startup (not suitable for staging or production).

### SSL

SSL is automatically enabled for `NODE_ENV=production` with `rejectUnauthorized: false` (compatible with Supabase's managed PostgreSQL).

---

## 13. Testing

### Strategy

| Type       | Tool                     | Location                     |
| ---------- | ------------------------ | ---------------------------- |
| Unit Tests | Jest + `@nestjs/testing` | `src/**/__tests__/*.spec.ts` |
| Coverage   | Jest `--coverage`        | `coverage/unit/`             |

### Running Tests

```bash
# Run all unit tests once
npm test

# Run in watch mode (interactive)
npm run test:watch

# Run with coverage report
npm run test:cov

# Debug tests with Node.js inspector
npm run test:debug
```

### Coverage Configuration

- Coverage is collected from all `*.ts` files except `*.spec.ts`, `*.module.ts`, and `main.ts`.
- Output directory: `coverage/unit/`
- Coverage formats: `lcov`, `clover`, JSON, HTML

### Test Structure Example

```typescript
// src/__tests__/app.controller.spec.ts
describe('AppController', () => {
  describe('getHealth', () => {
    it('should return health status', () => {
      const result = controller.getHealth();
      expect(result.status).toBe('ok');
    });
  });
});
```

---

## 14. Logging & Monitoring

### Logging Stack

The application uses a dual-logger approach:

| Logger            | Library                   | Scope                            |
| ----------------- | ------------------------- | -------------------------------- |
| HTTP request logs | `nestjs-pino` (Pino)      | Automatic HTTP in/out logging    |
| Application logs  | `winston` (LoggerService) | Service-level structured logging |

### Pino HTTP Logger

Configured in `src/config/logger.config.ts`:

- **Development**: Pretty-printed via `pino-pretty` (colorized, human-readable).
- **Production**: Raw JSON (structured, machine-parseable, ready for log aggregators).
- Authorization header is **always redacted** in logs.
- Custom log levels by HTTP status code:
  - `4xx` → `warn`
  - `5xx` / errors → `error`
  - `3xx` / `2xx` → `info`

### Request Correlation

Every log entry includes:

```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "traceId": "...",
  "service": "cercana-ti-backend",
  "environment": "development",
  "version": "1.0.0"
}
```

### Datadog APM (Optional)

Distributed tracing via `dd-trace` — enabled when both `DD_TRACE_ENABLED=true` and `DD_API_KEY` are set.

Features when enabled:

- Distributed trace injection into logs (`logInjection: true`)
- Runtime metrics collection
- Service/environment/version tagging

### Health Check Endpoints

| Endpoint      | Purpose                                        |
| ------------- | ---------------------------------------------- |
| `GET /`       | Liveness probe (returns `{ status: "ok" }`)    |
| `GET /health` | Readiness probe with uptime, memory, DB status |

The Docker `HEALTHCHECK` calls `GET /health` every 30 seconds.

---

## 15. Docker & Deployment

### Multi-Stage Dockerfile

The Dockerfile uses a **3-stage build** for minimal production image size:

```
Stage 1: builder   — installs all deps + compiles TypeScript
Stage 2: deps      — installs production-only deps (no devDependencies)
Stage 3: production — final image (non-root user, ~150MB)
```

### Security Hardening

- Base image: `node:20-alpine` (minimal attack surface)
- Runs as non-root user: `appuser` (group: `appgroup`)
- Only compiled `dist/` and production `node_modules/` are copied to the final image

### Build & Run

```bash
# Build the image
docker build -t cercana-ti-backend:latest .

# Run with environment variables from file
docker run \
  -p 3000:3000 \
  --env-file .env \
  cercana-ti-backend:latest

# Run with explicit env vars
docker run \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  cercana-ti-backend:latest
```

### Docker Compose

> A `docker-compose.yml` is **not included** in the current template. Use the `docker run` command above, or contribute a `docker-compose.yml` for local orchestration.

### CI/CD Pipeline

**GitHub Actions** — `.github/workflows/node-ci.yml`

#### Triggers

| Event          | Branches                                       |
| -------------- | ---------------------------------------------- |
| `push`         | `integration`, `main`, `develop`               |
| `pull_request` | `integration`, `main`, `develop`, `qa`, `prod` |

#### Jobs

| Job               | Steps                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------- |
| `build-and-test`  | Checkout → Setup Node 18 → `npm install` → `format:check` → `lint` → `build` → `test` |
| `check-pr-source` | Validates PR source branch enforcement rules                                          |

#### Branch Protection Rules (Enforced by CI)

```
develop ──────────► qa ──────────► prod
                    ▲              ▲
             only from develop  only from qa
```

PRs that violate this flow are automatically failed by the `check-pr-source` job.

---

## 16. Code Quality

### ESLint

Configuration: `eslint.config.js` (flat config format)

- Extends: `eslint.configs.recommended`, `typescript-eslint.configs.recommended`, `prettier/recommended`
- Key rules relaxed for NestJS patterns:
  - `@typescript-eslint/no-explicit-any`: off
  - `@typescript-eslint/explicit-function-return-type`: off
  - `@typescript-eslint/interface-name-prefix`: off
- Ignored paths: `dist/**`, `coverage/**`

```bash
npm run lint
```

### Prettier

Configuration: `.prettierrc`

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "endOfLine": "lf"
}
```

```bash
# Check formatting
npm run format:check

# Auto-fix formatting
npm run format
```

### TypeScript

- Target: `ES2021`
- Strict null checks: disabled (`strictNullChecks: false`) — intentional for NestJS compatibility
- Decorator metadata: enabled (`emitDecoratorMetadata: true`, `experimentalDecorators: true`)
- Source maps: enabled

### Conventions

- All source files under `src/` must pass `format:check` and `lint` before merging (enforced by CI).
- Test files follow the `*.spec.ts` naming pattern and live in `__tests__/` subdirectories.
- DTOs use `class-validator` decorators for boundary validation.
- Entities may contain domain validation methods (`validateIdentification()`, `softDelete()`, etc.).

---

## 17. Security

| Concern               | Implementation                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| HTTP Security Headers | `helmet()` applied globally in `main.ts`                                                        |
| CORS                  | Configurable via `CORS_ORIGIN` env var; `credentials: true`                                     |
| Rate Limiting         | `@nestjs/throttler` — 100 requests per 60 seconds (configurable)                                |
| Input Validation      | Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` |
| Secrets in Logs       | `Authorization` header is always redacted (`[REDACTED]`) in Pino serializers                    |
| Container Security    | Non-root user (`appuser`) in Docker production image                                            |
| Database SSL          | Enforced in production (`ssl: { rejectUnauthorized: false }`)                                   |
| Env Files             | `.env` is git-ignored; only `.env.example` is committed                                         |
| Swagger Exposure      | Swagger UI disabled in `production` environment                                                 |
| Soft Delete           | Records are soft-deleted (status + `deletedAt`) rather than permanently removed                 |

### OWASP Alignment

| OWASP Category                | Mitigation                                                          |
| ----------------------------- | ------------------------------------------------------------------- |
| A01 Broken Access Control     | Route-level guards (planned); `whitelist` validation                |
| A03 Injection                 | TypeORM parameterized queries; `class-validator` input sanitization |
| A05 Security Misconfiguration | Helmet headers; CORS whitelist; Swagger prod-disabled               |
| A06 Vulnerable Components     | `npm ci` in CI/CD; pin dependencies in `package-lock.json`          |
| A09 Logging & Monitoring      | Structured logging; Datadog APM; correlation IDs                    |

---

## 18. Troubleshooting

### Application fails to start — `Missing DATABASE_URL`

Ensure `DATABASE_URL` is set in your `.env` file. Both `typeorm` and `supabase` provider modes require it.

```bash
cat .env | grep DATABASE_URL
```

### Supabase connection refused

Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set when `DB_PROVIDER=supabase`.

Obtain them from: Supabase Dashboard → Project Settings → API.

### `synchronize` warnings in staging/production

The `synchronize: true` option is intentionally disabled for non-development environments. Run migrations explicitly:

```bash
npm run typeorm migration:run
```

### Port already in use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# Unix/macOS
lsof -ti:3000 | xargs kill
```

### Pino logs not colorized

`pino-pretty` is only active when `NODE_ENV !== 'production'`. Verify your `NODE_ENV` value in `.env`.

### Swagger UI not showing

Swagger is disabled in production. Ensure `NODE_ENV` is not set to `production` for local development.

### TypeORM entity not recognized

Make sure new entities are registered in `DatabaseConfig.createTypeOrmOptions()`:

```typescript
entities: [Customer, YourNewEntity],
```

---

## 19. Contributing

### Branch Strategy

```
main        ← stable production snapshots
prod        ← production deployments
qa          ← QA / staging (PRs only from develop)
develop     ← integration branch (PRs only from feature/*)
integration ← optional additional integration layer
feature/*   ← feature branches
fix/*       ← bug fix branches
```

> PRs to `qa` must come from `develop`. PRs to `prod` must come from `qa`. This is enforced by the CI `check-pr-source` job.

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(customers): add findByIdentification endpoint
fix(database): handle SSL connection in production
chore(ci): update Node.js version to 20
refactor(common): extract BaseApiService abstraction
test(customer): add unit tests for CustomerService
docs: update README with environment variables
```

### Pull Request Process

1. Branch from `develop` using the `feature/*` or `fix/*` naming convention.
2. Implement your changes with corresponding unit tests.
3. Ensure `format:check`, `lint`, `build`, and `test` all pass locally.
4. Fill out the PR template (`.github/pull_request_template.md`).
5. Request at least one code review before merging.

### PR Checklist (Summary)

- [ ] Code passes ESLint and Prettier checks
- [ ] All new features have unit tests
- [ ] Test coverage is maintained or improved
- [ ] No secrets or credentials committed
- [ ] Swagger docs updated for new endpoints
- [ ] README updated if new env vars or scripts are added

---

## 20. License

This project is licensed under the **MIT License** — Copyright (c) 2026 CercanaTi.

See [LICENSE](./LICENSE) for the full license text.

---

<div align="center">
  <sub>Built with NestJS · TypeScript · Supabase · Datadog · GitHub Actions</sub>
</div>
