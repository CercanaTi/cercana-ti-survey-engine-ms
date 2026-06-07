# Phase 15 — Engine: Scoring, Analytics, Reports & Results

## Objective
Implement the complete processing pipeline: the scoring engine (calculates scores from raw answers), the analytics module (aggregates stats by hierarchy node), report generation (PDF/Excel), and the results API (exposes results per profile scope).

## Prerequisites
- Phase 14 completed (engine bootstrapped, response reception works, queues configured)

## Copilot Prompt

```
Implement the full processing pipeline for `cercana-ti-survey-engine-ms`. This service processes evaluation responses asynchronously via Bull queues.

## Processing Pipeline
EvaluationResponse (RECIBIDA) 
  → [scoring queue] → ScoringWorker 
  → EvaluationResult (CALCULADO) 
  → [analytics queue] → AnalyticsWorker (updates NodeAnalyticsSummary) 
  → [notification callback] → admin-ms notified 
  → Result available

## PART A — QUEUE INFRASTRUCTURE

`src/modules/queue/queue.module.ts`
```typescript
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({ redis: process.env.REDIS_URL }),
    }),
    BullModule.registerQueue(
      { name: 'scoring' },
      { name: 'analytics' },
      { name: 'reports' },
      { name: 'notifications' },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
```

Create queue name constants in `src/modules/queue/queue.constants.ts`:
```typescript
export const SCORING_QUEUE = 'scoring';
export const ANALYTICS_QUEUE = 'analytics';
export const REPORTS_QUEUE = 'reports';
export const NOTIFICATIONS_QUEUE = 'notifications';
```

---

## PART B — SCORING ENGINE

`src/modules/scoring/scoring.module.ts`
`src/modules/scoring/scoring.service.ts`
`src/modules/scoring/scoring.processor.ts` (Bull processor)

### ScoringProcessor
`@Processor(SCORING_QUEUE)` class:
```typescript
@Process('calculate')
async handleCalculate(job: Job<{ responseId: string }>): Promise<void>
```
1. Load EvaluationResponse by `job.data.responseId` — set status to `PROCESANDO`
2. Load the Survey structure from admin-ms via HTTP (GET /surveys/:surveyId/structure using internal API key). Cache response for 5 minutes in memory.
3. Call `ScoringService.calculateScore(response, surveyStructure)`
4. Save EvaluationResult
5. Create SectionResult for each section
6. Identify questions that need manual review (SHORT_TEXT, LONG_TEXT, FILE_UPLOAD with `manualReview = true`) → create ManualReviewTask records
7. If no manual review tasks: publish result immediately (`status = PUBLICADO`)
8. If manual review tasks exist: set `status = PENDIENTE_REVISION`
9. Update EvaluationResponse to `PROCESADA`
10. Enqueue analytics update job: `{ surveyId, hierarchyNodeId, period }`
11. Enqueue notification callback: `{ evaluatedPersonId, surveyId, resultId }`
12. On error: set EvaluationResponse to `ERROR`, store error message

### ScoringService
`src/modules/scoring/scoring.service.ts`

**`calculateScore(response: EvaluationResponse, survey: SurveyStructure): ScoringResult`**
```typescript
interface ScoringResult {
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  isPassing: boolean | null;
  classificationLabel: string | null;
  classificationColor: string | null;
  sectionResults: SectionScoreResult[];
  needsManualReview: boolean;
}
```

Algorithm:
```
For each Section in survey:
  sectionMaxScore = sum of question.maxScore for all questions in section
  sectionScore = 0
  
  For each Question in section:
    questionScore = calculateQuestionScore(questionResponse, question)
    sectionScore += questionScore
  
  sectionPercentage = (sectionScore / sectionMaxScore) * 100
  weightedSectionScore = sectionPercentage * (section.weight / 100)
  
totalPercentage = sum of weightedSectionScore for all sections
finalScore = (totalPercentage / 100) * survey.maxScore
```

**`calculateQuestionScore(response: QuestionAnswerDto, question: QuestionConfig): number`**
Implement per type:
- `LIKERT`: find the option matching `selectedOptionIds[0]`, return its `value`
- `SINGLE_CHOICE`: find option by ID, return `value`
- `MULTIPLE_CHOICE`: sum of values for all selected options (capped at question.maxScore)
- `YES_NO`: find option, return `value`
- `RUBRIC`: average score from rubricScores array (score = mean of all criteria scores) / maxLevelScore * maxScore
- `SHORT_TEXT`, `LONG_TEXT`, `FILE_UPLOAD`: return 0 (manual review) — flag as `needsManualReview`
- `DATE`: return maxScore if answered (binary), 0 if not
- `NUMERIC`: normalize: `(value - minValue) / (maxValue - minValue) * maxScore`

**`applyScaleClassification(percentage: number, scaleRanges: ScaleRange[]): { label: string, color: string } | null`**
Find the range where `percentage >= min && percentage <= max`. Return label and color.

---

## PART C — ANALYTICS MODULE

`src/modules/analytics/analytics.module.ts`
`src/modules/analytics/analytics.service.ts`
`src/modules/analytics/analytics.processor.ts`

### AnalyticsProcessor
`@Process('update-node')`
```typescript
async handleUpdateNode(job: Job<{ surveyId: string; hierarchyNodeId: string; period: string }>): Promise<void>
```
Calls `AnalyticsService.updateNodeSummary(...)` for the center node, then propagates up to distrito, regional, ministerio.

### AnalyticsService

**`updateNodeSummary(surveyId, nodeId, period): Promise<void>`**
1. Count all EvaluationResults for this surveyId + period where evaluatedPerson's hierarchyNodeId is a descendant of nodeId
   Note: the engine does NOT have the hierarchy table — call admin-ms `GET /hierarchy/:id/descendants` to get descendant IDs (cache for 30 minutes).
2. Compute: `totalCompleted = count(status = PUBLICADO)`, `totalAssigned = count(all)`, `completionRate`, `avgScore`
3. Compute `distributionJson`: count results by classificationLabel
4. Compute `topStrengths`: top 3 sections by avgScore across all results
5. Compute `topWeaknesses`: bottom 3 sections by avgScore
6. Upsert `NodeAnalyticsSummary`

**`getNodeAnalytics(nodeId, surveyId, period): Promise<NodeAnalyticsSummary>`**
Load pre-calculated summary.

**`getTeacherProgress(userId, surveyId, period): Promise<TeacherProgressSummary>`**
Load pre-calculated teacher summary.

**`updateTeacherProgress(userId, surveyId, period, result): Promise<void>`**
Upsert TeacherProgressSummary with latest score and section breakdown.
Calculate percentile: compare against all teacher scores for same survey+period.

**`getNationalOverview(period): Promise<NationalOverviewDto>`**
```typescript
interface NationalOverviewDto {
  totalTeachers: number;
  totalCompleted: number;
  nationalAvgScore: number;
  completionRate: number;
  byRegional: { nodeId: string; name: string; avgScore: number; completionRate: number }[];
  distributionNational: Record<string, number>;
}
```
Aggregate from all NodeAnalyticsSummary where hierarchyNodeId is a MINISTERIO or REGIONAL node.

---

## PART D — REPORTS MODULE

`src/modules/reports/reports.module.ts`
`src/modules/reports/reports.service.ts`
`src/modules/reports/reports.processor.ts`

### ReportsProcessor
`@Process('generate')`
```typescript
async handleGenerate(job: Job<{ requestId: string }>): Promise<void>
```
1. Load ReportRequest
2. Set status to `GENERATING`
3. Call appropriate generator based on `reportType`
4. Upload file to Supabase Storage at `reports/{requestId}/{filename}`
5. Set `status = READY`, `fileUrl`, `fileSize`, `expiresAt = now() + REPORT_EXPIRATION_HOURS`
6. On error: set `status = FAILED`, `errorMessage`

### ReportsService

**`requestReport(requestedBy, reportType, parameters): Promise<ReportRequest>`**
1. Create ReportRequest with status PENDING
2. Enqueue `reports` queue job `{ requestId }`
3. Return the request (the frontend polls for status)

Report types and their parameters:
- `INDIVIDUAL_RESULT`: `{ evaluationResultId }` → single teacher result PDF
- `CENTER_CONSOLIDADO`: `{ centerId, surveyId, period }` → all teachers in center
- `DISTRICT_CONSOLIDADO`: `{ districtId, surveyId, period }` → centers summary Excel
- `REGIONAL_CONSOLIDADO`: `{ regionalId, surveyId, period }` → districts summary Excel
- `NATIONAL_OVERVIEW`: `{ surveyId, period }` → national Excel
- `PARTICIPATION_REPORT`: `{ scopeNodeId, surveyId, period }` → completion rates
- `PENDING_REPORT`: `{ scopeNodeId, surveyId }` → not-yet-completed evaluations

**`generateIndividualPdf(resultId): Promise<Buffer>`**
Using pdfmake:
- Header: SED-RD logo, teacher name, cédula, center, survey name, date
- Score section: large score circle with percentage, classification label with color
- Section breakdown: horizontal bar chart per section (score vs max)
- Dimension analysis if applicable
- Footer: confidentiality notice + generated timestamp + watermark with requesting user's name

**`generateCenterExcel(centerId, surveyId, period): Promise<Buffer>`**
Using exceljs:
- Sheet 1: Summary (center name, total teachers, avg score, distribution)
- Sheet 2: Teacher list (name, cédula, score, percentage, classification, completion date)
- Conditional formatting: red for Deficiente, yellow for Regular, green for Bueno/Excelente

**`getStatus(requestId, userId): Promise<ReportRequest>`**
Load status. Verify requesting user is the one who requested it.

**`getDownloadUrl(requestId, userId): Promise<{ url: string; expiresAt: Date }>`**
1. Verify status is READY and not EXPIRED
2. Generate a signed URL from Supabase Storage (1 hour validity)
3. Return URL

**`cleanupExpiredReports(): Promise<void>`**
Cron job (every hour): find READY reports where `expiresAt < now()`, delete from Storage, set status EXPIRED.

**Controller**
`src/modules/reports/reports.controller.ts`
- `POST /engine/reports` — request report generation
- `GET /engine/reports/:id/status`
- `GET /engine/reports/:id/download` — returns signed URL

---

## PART E — RESULTS MODULE

`src/modules/results/results.module.ts`
`src/modules/results/results.service.ts`
`src/modules/results/results.controller.ts`

Results are exposed publicly to the frontend (via admin-ms proxy or directly).
Apply `InternalApiKeyGuard` on all endpoints.

**`getResult(evaluationResultId): Promise<EvaluationResult & { sections: SectionResult[] }>`**
**`getResultsForCampaign(campaignId): Promise<EvaluationResult[]>`** — paginated
**`getResultsForPerson(evaluatedPersonId, surveyId?, period?): Promise<EvaluationResult[]>`**
**`getResultsForNode(hierarchyNodeId, surveyId, period): Promise<EvaluationResult[]>`**
**`getNodeAnalytics(nodeId, surveyId, period): Promise<NodeAnalyticsSummary>`**
**`getTeacherProgress(userId, surveyId, period): Promise<TeacherProgressSummary>`**
**`getNationalOverview(surveyId, period): Promise<NationalOverviewDto>`**

Controller routes:
- `GET /engine/results/:id`
- `GET /engine/results/person/:userId`
- `GET /engine/results/node/:nodeId`
- `GET /engine/analytics/node/:nodeId`
- `GET /engine/analytics/teacher/:userId`
- `GET /engine/analytics/national`

---

## Unit Tests
`src/modules/scoring/scoring.service.spec.ts`
- Test: LIKERT question with option value 4 returns score 4
- Test: MULTIPLE_CHOICE sums selected option values, capped at maxScore
- Test: RUBRIC averages all criteria scores
- Test: SHORT_TEXT returns 0 and flags needsManualReview
- Test: NUMERIC normalizes value within min-max range
- Test: full survey with 2 sections (weights 60%/40%) calculates correct weighted total
- Test: classification applies correct label for each score range

`src/modules/analytics/analytics.service.spec.ts`
- Test: updateNodeSummary correctly counts PUBLICADO results
- Test: distributionJson correctly counts each classification
- Test: topStrengths returns 3 sections with highest avg scores
- Test: updateTeacherProgress calculates percentile correctly
```

## Expected Deliverables
- `src/modules/queue/queue.module.ts` and constants
- `src/modules/scoring/scoring.module.ts`, `scoring.service.ts`, `scoring.processor.ts`
- `src/modules/analytics/analytics.module.ts`, `analytics.service.ts`, `analytics.processor.ts`
- `src/modules/reports/reports.module.ts`, `reports.service.ts`, `reports.processor.ts`, `reports.controller.ts`
- `src/modules/results/results.module.ts`, `results.service.ts`, `results.controller.ts`
- Unit test files for scoring and analytics

## Acceptance Criteria
- Submitting a response to `/engine/responses` triggers scoring within 5 seconds (in dev)
- Scoring correctly calculates weighted section scores
- RUBRIC questions average all criteria scores
- Analytics summary is updated after each processed evaluation
- Report request returns `READY` status after generation
- Download URL is a valid signed Supabase Storage URL
- All unit tests pass
