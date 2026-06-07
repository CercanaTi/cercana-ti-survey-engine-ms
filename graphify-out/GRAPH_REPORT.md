# Graph Report - cercana-ti-survey-engine-ms  (2026-06-07)

## Corpus Check
- 95 files · ~22,573 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 571 nodes · 1061 edges · 43 communities (36 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ae56028`
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
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]

## God Nodes (most connected - your core abstractions)
1. `EvaluationResult` - 39 edges
2. `cercana-ti Backend — NestJS Template` - 22 edges
3. `LoggerService` - 21 edges
4. `AnalyticsService` - 21 edges
5. `QuestionResponse` - 21 edges
6. `SectionResult` - 21 edges
7. `AdminClientService` - 20 edges
8. `ReportsService` - 20 edges
9. `EvaluationResponse` - 19 edges
10. `ScoringService` - 17 edges

## Surprising Connections (you probably didn't know these)
- `HierarchyNodesResponse` --references--> `HierarchyNodeInfo`  [EXTRACTED]
  src/modules/admin-client/admin-client.service.ts → src/modules/admin-client/interfaces/hierarchy-node-info.interface.ts
- `PersonProfilesResponse` --references--> `PersonProfile`  [EXTRACTED]
  src/modules/admin-client/admin-client.service.ts → src/modules/admin-client/interfaces/person-profile.interface.ts
- `QuestionResponse` --references--> `EvaluationResponse`  [EXTRACTED]
  src/modules/responses/entities/question-response.entity.ts → src/modules/responses/entities/evaluation-response.entity.ts
- `NodeSummaryComputation` --references--> `ScoreDistribution`  [EXTRACTED]
  src/modules/analytics/analytics.service.ts → src/modules/analytics/entities/node-analytics-summary.entity.ts
- `NodeSummaryComputation` --references--> `SectionScoreSummary`  [EXTRACTED]
  src/modules/analytics/analytics.service.ts → src/modules/analytics/entities/node-analytics-summary.entity.ts

## Import Cycles
- None detected.

## Communities (43 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (13): 11. Authentication & Authorization, 17. Security, 20. License, 2. Tech Stack, 3. Project Structure, 5. Requirements, 9. Available Scripts, cercana-ti Backend — NestJS Template (+5 more)

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
Cohesion: 0.05
Nodes (17): CommonModule, appConfig, DatabaseConfig, loggerConfig, redisConfig, Public(), ErrorResponse, GlobalExceptionFilter (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (14): scripts, build, format, format:check, lint, start, start:debug, start:dev (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (12): QuestionAnswerDto, RubricScoreDto, ReceiveEvaluationDto, ResponseStatusDto, SaveDraftDto, EvaluationResponse, RubricScoreEntry, EvaluationResponseStatus (+4 more)

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
Cohesion: 0.08
Nodes (22): AdminClientModule, AnalyticsModule, AnalyticsService, NodeSummaryComputation, DISTRIBUTION_KEYS, HIERARCHY_NODE_TYPES, NationalOverviewDto, RegionalOverview (+14 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (13): MANUAL_REVIEW_QUESTION_TYPES, QUESTION_TYPES, QuestionResponse, ManualReviewCandidate, ScoringResult, SectionScoreResult, QuestionConfig, QuestionOption (+5 more)

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (7): 6. Environment Variables, Application, Database, Datadog APM (Optional), Logging, Rate Limiting, Security

### Community 30 - "Community 30"
Cohesion: 0.08
Nodes (12): AdminClientService, AncestorsResponse, DescendantsResponse, HierarchyNodesResponse, PersonProfilesResponse, CacheEntry, TtlCache, AnalyticsJobData (+4 more)

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (6): 14. Logging & Monitoring, Datadog APM (Optional), Health Check Endpoints, Logging Stack, Pino HTTP Logger, Request Correlation

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (17): CLASSIFICATION_FILL_COLORS, REPORT_TYPE_VALUES, REPORT_TYPES, RequestReportDto, ReportRequest, ReportRequestStatus, ReportsController, GeneratedFile (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.40
Nodes (5): 13. Testing, Coverage Configuration, Running Tests, Strategy, Test Structure Example

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (9): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.29
Nodes (6): author, description, license, name, private, version

## Knowledge Gaps
- **231 isolated node(s):** `PreToolUse`, `allow`, `eslint`, `tseslint`, `prettierRecommended` (+226 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `EvaluationResult` connect `Community 27` to `Community 32`, `Community 28`, `Community 37`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `cercana-ti Backend — NestJS Template` connect `Community 0` to `Community 33`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 29`, `Community 31`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `LoggerService` connect `Community 30` to `Community 32`, `Community 4`, `Community 6`, `Community 27`, `Community 28`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `PreToolUse`, `allow`, `eslint` to the rest of the system?**
  _231 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._