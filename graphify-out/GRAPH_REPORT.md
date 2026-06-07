# Graph Report - cercana-ti-survey-engine-ms  (2026-06-07)

## Corpus Check
- 63 files · ~14,517 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 392 nodes · 501 edges · 40 communities (32 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `65054ba6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]

## God Nodes (most connected - your core abstractions)
1. `cercana-ti Backend — NestJS Template` - 22 edges
2. `compilerOptions` - 17 edges
3. `ResponsesService` - 15 edges
4. `scripts` - 14 edges
5. `EvaluationResponse` - 12 edges
6. `LoggerService` - 11 edges
7. `AppService` - 9 edges
8. `QuestionAnswerDto` - 9 edges
9. `ReceiveEvaluationDto` - 9 edges
10. `SaveDraftDto` - 9 edges

## Surprising Connections (you probably didn't know these)
- `ReportRequest` --references--> `ReportRequestStatus`  [EXTRACTED]
  src/modules/reports/entities/report-request.entity.ts → src/modules/reports/enums/report-request-status.enum.ts
- `ReceiveEvaluationDto` --references--> `QuestionAnswerDto`  [EXTRACTED]
  src/modules/responses/dto/receive-evaluation.dto.ts → src/modules/responses/dto/question-answer.dto.ts
- `SaveDraftDto` --references--> `QuestionAnswerDto`  [EXTRACTED]
  src/modules/responses/dto/save-draft.dto.ts → src/modules/responses/dto/question-answer.dto.ts
- `EvaluationResponse` --references--> `EvaluationResponseStatus`  [EXTRACTED]
  src/modules/responses/entities/evaluation-response.entity.ts → src/modules/responses/enums/evaluation-response-status.enum.ts
- `QuestionResponse` --references--> `EvaluationResponse`  [EXTRACTED]
  src/modules/responses/entities/question-response.entity.ts → src/modules/responses/entities/evaluation-response.entity.ts

## Import Cycles
- None detected.

## Communities (40 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (10): 17. Security, 20. License, 2. Tech Stack, 3. Project Structure, 5. Requirements, 9. Available Scripts, cercana-ti Backend — NestJS Template, Folder Responsibilities (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (30): dependencies, axios, bullmq, class-transformer, class-validator, compression, dd-trace, dotenv (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (21): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, jest, @nestjs/cli, @nestjs/schematics (+13 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (17): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (14): CommonModule, appConfig, DatabaseConfig, loggerConfig, redisConfig, Public(), ErrorResponse, GlobalExceptionFilter (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (29): author, description, jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment (+21 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (14): QuestionAnswerDto, RubricScoreDto, ReceiveEvaluationDto, ResponseStatusDto, SaveDraftDto, EvaluationResponse, QuestionResponse, RubricScoreEntry (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (11): 🚦 **API Endpoints**, 🏗️ **Architecture & Structure**, 📋 Changes Made, 🔍 **Code Validation Checklist**, 🔧 **Core Features Implemented**, 📚 **Documentation**, 🗂️ **File Changes Summary**, 📦 **Libraries Added** (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (12): 10. API Documentation, Authentication, Base URL, Customer Endpoints, Error Handling, `GET /customers` — Paginated Response, Health Endpoints, Interactive Swagger UI (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (8): Best Practices, Code Style, General Rules, Output Requirements, PD Engineering Rules, Security & Maintainability, Structure & Quality, Testing

### Community 10 - "Community 10"
Cohesion: 0.22
Nodes (9): 15. Docker & Deployment, Branch Protection Rules (Enforced by CI), Build & Run, CI/CD Pipeline, Docker Compose, Jobs, Multi-Stage Dockerfile, Security Hardening (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (8): 12. Database, Customer, Engine, Entities, Migrations, ORM, Provider Modes, SSL

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (8): 18. Troubleshooting, Application fails to start — `Missing DATABASE_URL`, Pino logs not colorized, Port already in use, Supabase connection refused, Swagger UI not showing, `synchronize` warnings in staging/production, TypeORM entity not recognized

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (6): Acceptance Criteria, Copilot Prompt, Expected Deliverables, Objective, Phase 14 — Engine Service: Bootstrap, Schema & Response Reception, Prerequisites

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (6): Acceptance Criteria, Copilot Prompt, Expected Deliverables, Objective, Phase 15 — Engine: Scoring, Analytics, Reports & Results, Prerequisites

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (6): 1. Clone the Repository, 2. Install Dependencies, 3. Configure Environment Variables, 4. Database Setup, 5. Verify Installation, 7. Installation

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (6): 8. Running the Project, Debug Mode, Development (watch mode), Docker, Local (single run), Production

### Community 18 - "Community 18"
Cohesion: 0.40
Nodes (5): 16. Code Quality, Conventions, ESLint, Prettier, TypeScript

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (5): 19. Contributing, Branch Strategy, Commit Conventions, PR Checklist (Summary), Pull Request Process

### Community 20 - "Community 20"
Cohesion: 0.40
Nodes (5): 1. Overview, Architecture Overview, High-Level Flow, Objective, Problem It Solves

### Community 21 - "Community 21"
Cohesion: 0.40
Nodes (5): 4. Architecture, Key Design Patterns, Layers, Pattern, Request Execution Flow

### Community 22 - "Community 22"
Cohesion: 0.50
Nodes (3): eslint, prettierRecommended, tseslint

### Community 23 - "Community 23"
Cohesion: 0.50
Nodes (3): http, options, request

### Community 27 - "Community 27"
Cohesion: 0.42
Nodes (5): EvaluationResult, ManualReviewTask, SectionResult, EvaluationResultStatus, ManualReviewStatus

### Community 28 - "Community 28"
Cohesion: 0.48
Nodes (4): NodeAnalyticsSummary, ScoreDistribution, SectionScoreSummary, TeacherProgressSummary

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (7): 6. Environment Variables, Application, Database, Datadog APM (Optional), Logging, Rate Limiting, Security

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (6): 14. Logging & Monitoring, Datadog APM (Optional), Health Check Endpoints, Logging Stack, Pino HTTP Logger, Request Correlation

### Community 33 - "Community 33"
Cohesion: 0.40
Nodes (5): 13. Testing, Coverage Configuration, Running Tests, Strategy, Test Structure Example

### Community 37 - "Community 37"
Cohesion: 0.67
Nodes (3): 11. Authentication & Authorization, Planned Authentication, Request Context (`@ClientContext`)

## Knowledge Gaps
- **216 isolated node(s):** `PreToolUse`, `allow`, `eslint`, `tseslint`, `prettierRecommended` (+211 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cercana-ti Backend — NestJS Template` connect `Community 0` to `Community 33`, `Community 37`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 29`, `Community 31`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 1` to `Community 5`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 2` to `Community 5`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `PreToolUse`, `allow`, `eslint` to the rest of the system?**
  _216 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._