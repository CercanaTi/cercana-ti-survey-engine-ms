# Phase 14 — Engine Service: Bootstrap, Schema & Response Reception

## Objective
Bootstrap `cercana-ti-survey-engine-ms`, create its database schema, and implement response reception — the entry point where completed evaluations arrive from the admin service for async processing.

## Prerequisites
- Admin service (Phases 01–13) fully operational
- Separate Supabase PostgreSQL schema or database for the engine service
- Redis available for Bull queues

## Copilot Prompt

```
Bootstrap `cercana-ti-survey-engine-ms` — the processing backend of the SED-RD teacher evaluation system. This service receives completed evaluation responses from `cercana-ti-survey-admin-ms`, calculates scores, generates analytics, and produces reports. It operates asynchronously using Bull queues backed by Redis.

## Technology Stack
- NestJS with TypeORM
- PostgreSQL (Supabase — same instance, different schema OR same schema with prefixed tables)
- Bull + Redis for async job queues
- `@nestjs/bull` or `bullmq` for queue management
- `pdfmake` or `puppeteer` for PDF generation
- `exceljs` for Excel report generation

## PART A — PROJECT BOOTSTRAP

### package.json
Project name: `cercana-ti-survey-engine-ms`
Dependencies (in addition to NestJS base):
- `@nestjs/bull`, `bull` (job queues)
- `ioredis` (Redis client)
- `pdfmake` (PDF generation)
- `exceljs` (Excel generation)
- `@supabase/supabase-js` (report file storage)
- `axios` (HTTP client for callbacks to admin-ms)
- `nestjs-pino`, `pino`, `pino-pretty`
- `class-validator`, `class-transformer`
- `typeorm`, `@nestjs/typeorm`, `pg`
- `helmet`, `compression`
- `@nestjs/swagger`

### Folder Structure
```
src/
├── modules/
│   ├── responses/      # Receive and validate evaluation responses
│   ├── scoring/        # Score calculation engine
│   ├── analytics/      # Statistical aggregation
│   ├── reports/        # PDF/Excel report generation
│   ├── results/        # Results storage and access
│   ├── queue/          # Bull queue definitions and workers
│   └── admin-client/   # HTTP client to call admin-ms callbacks
├── common/
│   ├── filters/
│   ├── interceptors/
│   ├── guards/
│   └── utils/
├── config/
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── logger.config.ts
│   └── app.config.ts
└── main.ts
```

### main.ts
Same pattern as admin-ms. Additionally:
- Global `ValidationPipe`
- Swagger at `/api/docs`
- Internal API secured by API key: all routes require `X-Internal-Api-Key` header matching `INTERNAL_API_KEY` env var (except `/health`)
- Create a custom `InternalApiKeyGuard` that checks this header

### .env.example
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
INTERNAL_API_KEY=super-secret-internal-key
ADMIN_SERVICE_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
STORAGE_BUCKET_REPORTS=sed-rd-reports
BULL_CONCURRENCY_SCORING=5
BULL_CONCURRENCY_REPORTS=2
REPORT_EXPIRATION_HOURS=24
```

---

## PART B — DATABASE SCHEMA (Engine Service)

Create TypeORM entities in their respective module folders:

### `src/modules/responses/entities/`

**`evaluation-response.entity.ts`**
Table: `evaluation_responses`
Columns: id (uuid pk), evaluatedUserId (uuid, not null — FK to admin-ms evaluated_users table, stored as plain uuid, no FK constraint cross-service), evaluatorUserId (uuid, not null), evaluatedPersonId (uuid, not null), surveyId (uuid, not null), surveyVersion (int, not null), status (varchar 20, default 'RECIBIDA' — enum: BORRADOR, RECIBIDA, PROCESANDO, PROCESADA, ERROR), submittedAt (timestamptz nullable), ipAddress (varchar 45 nullable), userAgent (varchar 500 nullable), durationSeconds (int nullable), attempt (int, default 1), errorMessage (text nullable), createdAt, updatedAt
Indexes: on evaluatedPersonId, evaluatorUserId, surveyId, status

**`question-response.entity.ts`**
Table: `question_responses`
Columns: id (uuid pk), evaluationResponseId (uuid, FK evaluation_responses.id, cascade delete), questionId (uuid, not null), sectionId (uuid, not null), questionType (varchar 30, not null), textValue (text nullable), numericValue (decimal 10,2 nullable), selectedOptionIds (jsonb nullable — array of UUIDs), fileUrl (varchar 500 nullable), rubricScores (jsonb nullable — `[{ criteriaIndex: number, levelIndex: number, score: number }]`)

### `src/modules/results/entities/`

**`evaluation-result.entity.ts`**
Table: `evaluation_results`
Columns: id (uuid pk), evaluationResponseId (uuid, unique, FK evaluation_responses.id), evaluatorUserId (uuid, not null), evaluatedPersonId (uuid, not null), surveyId (uuid, not null), hierarchyNodeId (uuid, not null — the center of the evaluated person), totalScore (decimal 10,2, not null), maxPossibleScore (decimal 10,2, not null), percentageScore (decimal 10,2, not null), isPassing (boolean nullable), classificationLabel (varchar 50 nullable), classificationColor (varchar 7 nullable), status (varchar 30, default 'CALCULADO' — enum: CALCULADO, PENDIENTE_REVISION, REVISADO, PUBLICADO, ARCHIVADO), calculatedAt (timestamptz), publishedAt (timestamptz nullable), period (varchar 20, not null — e.g. '2025'), createdAt, updatedAt
Indexes: on evaluatedPersonId, evaluatorUserId, surveyId, hierarchyNodeId, status, period

**`section-result.entity.ts`**
Table: `section_results`
Columns: id (uuid pk), evaluationResultId (uuid, FK evaluation_results.id, cascade delete), sectionId (uuid), sectionName (varchar 255), score (decimal 10,2), maxScore (decimal 10,2), percentage (decimal 10,2)

**`manual-review-task.entity.ts`**
Table: `manual_review_tasks`
Columns: id (uuid pk), evaluationResultId (uuid, FK evaluation_results.id, cascade delete), questionId (uuid), questionText (text), responseValue (text), assignedTo (uuid nullable — userId of reviewer), score (decimal 10,2 nullable), comment (text nullable), reviewedAt (timestamptz nullable), status (varchar 20, default 'PENDIENTE' — enum: PENDIENTE, REVISADA)

### `src/modules/analytics/entities/`

**`node-analytics-summary.entity.ts`**
Table: `node_analytics_summaries`
Columns: id (uuid pk), hierarchyNodeId (uuid, not null), surveyId (uuid, not null), period (varchar 20, not null), totalAssigned (int, default 0), totalCompleted (int, default 0), completionRate (decimal 5,2, default 0), avgScore (decimal 10,2 nullable), distributionJson (jsonb nullable — `{ excelente: N, bueno: N, regular: N, deficiente: N }`), topStrengths (jsonb nullable — `[{ sectionName, avgScore }]`), topWeaknesses (jsonb nullable), calculatedAt (timestamptz), createdAt, updatedAt
Unique: [hierarchyNodeId, surveyId, period]
Indexes: on hierarchyNodeId, surveyId, period

**`teacher-progress-summary.entity.ts`**
Table: `teacher_progress_summaries`
Columns: id (uuid pk), userId (uuid, not null), surveyId (uuid, not null), period (varchar 20, not null), score (decimal 10,2), percentile (decimal 5,2 nullable), sectionScores (jsonb nullable — `{ [sectionId]: score }`), updatedAt (timestamptz)
Unique: [userId, surveyId, period]

### `src/modules/reports/entities/`

**`report-request.entity.ts`**
Table: `report_requests`
Columns: id (uuid pk), requestedBy (uuid, not null), reportType (varchar 50, not null), parameters (jsonb, not null), status (varchar 20, default 'PENDING' — enum: PENDING, GENERATING, READY, FAILED, EXPIRED), fileUrl (varchar 500 nullable), fileSize (int nullable), expiresAt (timestamptz nullable), errorMessage (text nullable), requestedAt (timestamptz, default now()), completedAt (timestamptz nullable), createdAt
Indexes: on requestedBy, status

### Generate Migration
Run `migration:generate` for the engine service and execute it.

---

## PART C — RESPONSE RECEPTION MODULE

`src/modules/responses/responses.module.ts`
`src/modules/responses/responses.service.ts`

**`receive(dto: ReceiveEvaluationDto): Promise<{ responseId: string; status: 'queued' }>`**
```typescript
interface ReceiveEvaluationDto {
  evaluatedUserId: string;    // ID from admin-ms evaluated_users
  evaluatorUserId: string;
  evaluatedPersonId: string;
  surveyId: string;
  surveyVersion: number;
  attempt: number;
  submittedAt: string;        // ISO timestamp
  durationSeconds?: number;
  ipAddress?: string;
  userAgent?: string;
  answers: QuestionAnswerDto[];
}
interface QuestionAnswerDto {
  questionId: string;
  sectionId: string;
  questionType: string;
  textValue?: string;
  numericValue?: number;
  selectedOptionIds?: string[];
  fileUrl?: string;
  rubricScores?: { criteriaIndex: number; levelIndex: number; score: number }[];
}
```
1. Validate all required fields are present
2. Verify evaluatedUserId is not already in status PROCESADA with same attempt (idempotency check)
3. Create EvaluationResponse with status `RECIBIDA`
4. Bulk insert QuestionResponse records
5. Enqueue job in `scoring` Bull queue with `{ responseId }`
6. Return `{ responseId, status: 'queued' }`
Never throw if job queue is unavailable — save to DB and retry later via a cron job.

**`saveDraft(dto: SaveDraftDto): Promise<{ responseId: string }>`**
Save partial answers as BORRADOR (in-progress). Upsert by evaluatedUserId + attempt.

**`getStatus(responseId: string): Promise<{ status: string; result?: any }>`**
Return current processing status.

`src/modules/responses/responses.controller.ts`
`@Controller('engine')`, protected by `InternalApiKeyGuard`
- `POST /engine/responses` — receive completed evaluation
- `POST /engine/responses/draft` — save draft
- `GET /engine/responses/:id/status` — get processing status

### InternalApiKeyGuard
`src/common/guards/internal-api-key.guard.ts`
```typescript
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-internal-api-key'];
    if (key !== process.env.INTERNAL_API_KEY) {
      throw new UnauthorizedException('Invalid internal API key');
    }
    return true;
  }
}
```
Apply globally to all engine routes (except /health).

### Unit Tests
`src/modules/responses/responses.service.spec.ts`
- Test: receive valid DTO creates EvaluationResponse + QuestionResponses + enqueues scoring job
- Test: receive duplicate (same evaluatedUserId + attempt) is idempotent — returns existing responseId
- Test: receive with missing required field throws BadRequestException
- Test: saveDraft upserts on second call with same evaluatedUserId
```

## Expected Deliverables
- Complete `cercana-ti-survey-engine-ms` project structure
- All entity files and migration executed
- `src/modules/responses/responses.module.ts`, `responses.service.ts`, `responses.controller.ts`
- `src/common/guards/internal-api-key.guard.ts`
- `.env.example` for engine service
- `src/modules/responses/responses.service.spec.ts`

## Acceptance Criteria
- `npm run start:dev` starts engine service on port 3001 without errors
- `GET /health` returns 200
- `POST /engine/responses` without API key returns 401
- `POST /engine/responses` with valid API key and valid DTO returns `{ responseId, status: 'queued' }`
- Duplicate response is handled idempotently
- All unit tests pass
