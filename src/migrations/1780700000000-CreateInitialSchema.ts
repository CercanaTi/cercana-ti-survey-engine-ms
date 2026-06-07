import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1780700000000 implements MigrationInterface {
  name = 'CreateInitialSchema1780700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TABLE "evaluation_responses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evaluatedUserId" uuid NOT NULL, "evaluatorUserId" uuid NOT NULL, "evaluatedPersonId" uuid NOT NULL, "surveyId" uuid NOT NULL, "surveyVersion" integer NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'RECIBIDA', "submittedAt" TIMESTAMP WITH TIME ZONE, "ipAddress" character varying(45), "userAgent" character varying(500), "durationSeconds" integer, "attempt" integer NOT NULL DEFAULT 1, "errorMessage" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_evaluation_responses_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_evaluation_responses_evaluated_person" ON "evaluation_responses" ("evaluatedPersonId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_evaluation_responses_evaluator" ON "evaluation_responses" ("evaluatorUserId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_evaluation_responses_survey" ON "evaluation_responses" ("surveyId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_evaluation_responses_status" ON "evaluation_responses" ("status") `,
    );

    await queryRunner.query(
      `CREATE TABLE "question_responses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evaluationResponseId" uuid NOT NULL, "questionId" uuid NOT NULL, "sectionId" uuid NOT NULL, "questionType" character varying(30) NOT NULL, "textValue" text, "numericValue" numeric(10,2), "selectedOptionIds" jsonb, "fileUrl" character varying(500), "rubricScores" jsonb, CONSTRAINT "PK_question_responses_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_responses" ADD CONSTRAINT "FK_question_responses_evaluation_response" FOREIGN KEY ("evaluationResponseId") REFERENCES "evaluation_responses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "evaluation_results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evaluationResponseId" uuid NOT NULL, "evaluatorUserId" uuid NOT NULL, "evaluatedPersonId" uuid NOT NULL, "surveyId" uuid NOT NULL, "hierarchyNodeId" uuid NOT NULL, "totalScore" numeric(10,2) NOT NULL, "maxPossibleScore" numeric(10,2) NOT NULL, "percentageScore" numeric(10,2) NOT NULL, "isPassing" boolean, "classificationLabel" character varying(50), "classificationColor" character varying(7), "status" character varying(30) NOT NULL DEFAULT 'CALCULADO', "calculatedAt" TIMESTAMP WITH TIME ZONE, "publishedAt" TIMESTAMP WITH TIME ZONE, "period" character varying(20) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_evaluation_results_response" UNIQUE ("evaluationResponseId"), CONSTRAINT "PK_evaluation_results_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_evaluation_results_evaluated_person" ON "evaluation_results" ("evaluatedPersonId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_evaluation_results_evaluator" ON "evaluation_results" ("evaluatorUserId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_evaluation_results_survey" ON "evaluation_results" ("surveyId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_evaluation_results_hierarchy_node" ON "evaluation_results" ("hierarchyNodeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_evaluation_results_status" ON "evaluation_results" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_evaluation_results_period" ON "evaluation_results" ("period") `,
    );

    await queryRunner.query(
      `CREATE TABLE "section_results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evaluationResultId" uuid NOT NULL, "sectionId" uuid NOT NULL, "sectionName" character varying(255) NOT NULL, "score" numeric(10,2) NOT NULL, "maxScore" numeric(10,2) NOT NULL, "percentage" numeric(10,2) NOT NULL, CONSTRAINT "PK_section_results_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "section_results" ADD CONSTRAINT "FK_section_results_evaluation_result" FOREIGN KEY ("evaluationResultId") REFERENCES "evaluation_results"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "manual_review_tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evaluationResultId" uuid NOT NULL, "questionId" uuid NOT NULL, "questionText" text NOT NULL, "responseValue" text, "assignedTo" uuid, "score" numeric(10,2), "comment" text, "reviewedAt" TIMESTAMP WITH TIME ZONE, "status" character varying(20) NOT NULL DEFAULT 'PENDIENTE', CONSTRAINT "PK_manual_review_tasks_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "manual_review_tasks" ADD CONSTRAINT "FK_manual_review_tasks_evaluation_result" FOREIGN KEY ("evaluationResultId") REFERENCES "evaluation_results"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "node_analytics_summaries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hierarchyNodeId" uuid NOT NULL, "surveyId" uuid NOT NULL, "period" character varying(20) NOT NULL, "totalAssigned" integer NOT NULL DEFAULT 0, "totalCompleted" integer NOT NULL DEFAULT 0, "completionRate" numeric(5,2) NOT NULL DEFAULT 0, "avgScore" numeric(10,2), "distributionJson" jsonb, "topStrengths" jsonb, "topWeaknesses" jsonb, "calculatedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_node_analytics_node_survey_period" UNIQUE ("hierarchyNodeId", "surveyId", "period"), CONSTRAINT "PK_node_analytics_summaries_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_node_analytics_hierarchy_node" ON "node_analytics_summaries" ("hierarchyNodeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_node_analytics_survey" ON "node_analytics_summaries" ("surveyId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_node_analytics_period" ON "node_analytics_summaries" ("period") `,
    );

    await queryRunner.query(
      `CREATE TABLE "teacher_progress_summaries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "surveyId" uuid NOT NULL, "period" character varying(20) NOT NULL, "score" numeric(10,2), "percentile" numeric(5,2), "sectionScores" jsonb, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_teacher_progress_user_survey_period" UNIQUE ("userId", "surveyId", "period"), CONSTRAINT "PK_teacher_progress_summaries_id" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "report_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requestedBy" uuid NOT NULL, "reportType" character varying(50) NOT NULL, "parameters" jsonb NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'PENDING', "fileUrl" character varying(500), "fileSize" integer, "expiresAt" TIMESTAMP WITH TIME ZONE, "errorMessage" text, "requestedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_report_requests_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_report_requests_requested_by" ON "report_requests" ("requestedBy") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_report_requests_status" ON "report_requests" ("status") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "report_requests"`);
    await queryRunner.query(`DROP TABLE "teacher_progress_summaries"`);
    await queryRunner.query(`DROP TABLE "node_analytics_summaries"`);
    await queryRunner.query(
      `ALTER TABLE "manual_review_tasks" DROP CONSTRAINT "FK_manual_review_tasks_evaluation_result"`,
    );
    await queryRunner.query(`DROP TABLE "manual_review_tasks"`);
    await queryRunner.query(
      `ALTER TABLE "section_results" DROP CONSTRAINT "FK_section_results_evaluation_result"`,
    );
    await queryRunner.query(`DROP TABLE "section_results"`);
    await queryRunner.query(`DROP TABLE "evaluation_results"`);
    await queryRunner.query(
      `ALTER TABLE "question_responses" DROP CONSTRAINT "FK_question_responses_evaluation_response"`,
    );
    await queryRunner.query(`DROP TABLE "question_responses"`);
    await queryRunner.query(`DROP TABLE "evaluation_responses"`);
  }
}
