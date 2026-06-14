import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Command, CommandRunner } from 'nest-commander';
import { DataSource, EntityManager } from 'typeorm';
import { EvaluationResponse } from '../../modules/responses/entities/evaluation-response.entity';
import { QuestionResponse } from '../../modules/responses/entities/question-response.entity';
import { EvaluationResponseStatus } from '../../modules/responses/enums/evaluation-response-status.enum';
import { EvaluationResult } from '../../modules/results/entities/evaluation-result.entity';
import { SectionResult } from '../../modules/results/entities/section-result.entity';
import { EvaluationResultStatus } from '../../modules/results/enums/evaluation-result-status.enum';
import { SEED_BATCH } from './seed-batch.constant';

interface EvaluatedUserRow {
  id: string;
  evaluator_assignment_id: string;
  evaluated_user_id: string;
  evaluator_user_id: string;
  survey_id: string;
  hierarchy_node_id: string;
  survey_version: number;
}

interface SurveyQuestionRow {
  id: string;
  section_id: string;
  question_type: string;
  question_order: number;
  max_score: string | null;
  survey_id: string;
  option_ids: string[];
}

const TEXTOS_REALISTAS = [
  'El docente demuestra dominio del contenido y lo transmite de forma clara y organizada.',
  'Se observa buena gestión del aula, aunque podría mejorar el manejo del tiempo en algunas actividades.',
  'Utiliza recursos didácticos variados que favorecen la participación activa de los estudiantes.',
  'Muestra disposición para atender las necesidades individuales de los estudiantes.',
  'Se recomienda fortalecer las estrategias de evaluación formativa durante la clase.',
  'Mantiene una comunicación efectiva con el equipo docente y la dirección del centro.',
  'Las planificaciones presentadas están alineadas con el currículo vigente.',
  'Es necesario reforzar el uso de las tecnologías de la información en las clases.',
  'El docente promueve un ambiente de respeto y convivencia positiva entre los estudiantes.',
  'Se destaca el compromiso con el desarrollo profesional continuo.',
];

const SCORE_PER_QUESTION = 4;

@Injectable()
export class ResponseSeeder {
  async run(manager: EntityManager): Promise<{ totalResponses: number; totalResults: number }> {
    const evaluatedUsers: EvaluatedUserRow[] = await manager.query(
      `SELECT eu.id, eu."evaluatorAssignmentId" as evaluator_assignment_id, eu."evaluatedUserId" as evaluated_user_id,
              ea."evaluatorUserId" as evaluator_user_id, ea."surveyId" as survey_id, ea."hierarchyNodeId" as hierarchy_node_id,
              s.version as survey_version
       FROM evaluated_users eu
       JOIN evaluator_assignments ea ON eu."evaluatorAssignmentId" = ea.id
       JOIN surveys s ON ea."surveyId" = s.id
       WHERE eu.seed_batch = $1`,
      [SEED_BATCH],
    );

    const questions: SurveyQuestionRow[] = await manager.query(
      `SELECT sq.id, sq."sectionId" as section_id, sq.type as question_type, sq."order" as question_order,
              sq."maxScore" as max_score, ss."surveyId" as survey_id,
              COALESCE(
                json_agg(sqo.id ORDER BY sqo."order") FILTER (WHERE sqo.id IS NOT NULL), '[]'
              ) as option_ids
       FROM survey_questions sq
       JOIN survey_sections ss ON sq."sectionId" = ss.id
       JOIN surveys s ON ss."surveyId" = s.id
       LEFT JOIN survey_question_options sqo ON sqo."questionId" = sq.id
       WHERE s.seed_batch = $1
       GROUP BY sq.id, sq."sectionId", sq.type, sq."order", sq."maxScore", ss."surveyId"`,
      [SEED_BATCH],
    );

    const questionsBySurvey = new Map<string, SurveyQuestionRow[]>();
    for (const question of questions) {
      const list = questionsBySurvey.get(question.survey_id) ?? [];
      list.push(question);
      questionsBySurvey.set(question.survey_id, list);
    }
    for (const list of questionsBySurvey.values()) {
      list.sort((a, b) => a.question_order - b.question_order);
    }

    const responseRepo = manager.getRepository(EvaluationResponse);
    const questionResponseRepo = manager.getRepository(QuestionResponse);
    const resultRepo = manager.getRepository(EvaluationResult);
    const sectionResultRepo = manager.getRepository(SectionResult);

    const responseIds: string[] = [];
    const resultIds: string[] = [];

    for (let i = 0; i < evaluatedUsers.length; i++) {
      const eu = evaluatedUsers[i];
      const mod = i % 10;
      const status = mod < 3 ? 'PENDIENTE' : mod < 8 ? 'COMPLETADA' : 'EN_PROGRESO';

      await manager.query(`UPDATE evaluated_users SET status = $1 WHERE id = $2`, [status, eu.id]);

      if (status === 'PENDIENTE') {
        continue;
      }

      const surveyQuestions = questionsBySurvey.get(eu.survey_id) ?? [];
      const submittedAt = this.randomSubmittedAt(i);

      if (status === 'COMPLETADA') {
        const response = await responseRepo.save(
          responseRepo.create({
            evaluatedUserId: eu.evaluated_user_id,
            evaluatorUserId: eu.evaluator_user_id,
            evaluatedPersonId: eu.evaluated_user_id,
            surveyId: eu.survey_id,
            surveyVersion: eu.survey_version,
            status: EvaluationResponseStatus.PROCESADA,
            submittedAt,
            durationSeconds: 300 + (i % 3300),
            attempt: 1,
          }),
        );
        responseIds.push(response.id);

        let totalScore = 0;
        for (const question of surveyQuestions) {
          const { textValue, numericValue, selectedOptionIds, fileUrl } = this.buildAnswer(
            question,
            i,
          );

          await questionResponseRepo.save(
            questionResponseRepo.create({
              evaluationResponseId: response.id,
              questionId: question.id,
              sectionId: question.section_id,
              questionType: question.question_type,
              textValue,
              numericValue,
              selectedOptionIds,
              fileUrl,
              rubricScores: null,
            }),
          );

          if (numericValue !== null) {
            totalScore += numericValue;
          }
        }

        const maxPossibleScore = surveyQuestions.length * SCORE_PER_QUESTION;
        const percentageScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
        const { label, color } = this.classify(percentageScore);
        const calculatedAt = new Date(submittedAt.getTime() + 5 * 60 * 1000);

        const result = await resultRepo.save(
          resultRepo.create({
            evaluationResponseId: response.id,
            evaluatorUserId: eu.evaluator_user_id,
            evaluatedPersonId: eu.evaluated_user_id,
            surveyId: eu.survey_id,
            hierarchyNodeId: eu.hierarchy_node_id,
            totalScore,
            maxPossibleScore,
            percentageScore,
            isPassing: percentageScore >= 60,
            classificationLabel: label,
            classificationColor: color,
            period: '2026',
            status: EvaluationResultStatus.CALCULADO,
            calculatedAt,
          }),
        );
        resultIds.push(result.id);

        const sectionId = surveyQuestions[0]?.section_id;
        if (sectionId) {
          await sectionResultRepo.save(
            sectionResultRepo.create({
              evaluationResultId: result.id,
              sectionId,
              sectionName: 'Sección Principal',
              score: totalScore,
              maxScore: maxPossibleScore,
              percentage: percentageScore,
            }),
          );
        }
      } else {
        const response = await responseRepo.save(
          responseRepo.create({
            evaluatedUserId: eu.evaluated_user_id,
            evaluatorUserId: eu.evaluator_user_id,
            evaluatedPersonId: eu.evaluated_user_id,
            surveyId: eu.survey_id,
            surveyVersion: eu.survey_version,
            status: EvaluationResponseStatus.BORRADOR,
            submittedAt: null,
            attempt: 1,
          }),
        );
        responseIds.push(response.id);

        const partialQuestions = surveyQuestions.slice(0, 3);
        for (const question of partialQuestions) {
          const { textValue, numericValue, selectedOptionIds, fileUrl } = this.buildAnswer(
            question,
            i,
          );

          await questionResponseRepo.save(
            questionResponseRepo.create({
              evaluationResponseId: response.id,
              questionId: question.id,
              sectionId: question.section_id,
              questionType: question.question_type,
              textValue,
              numericValue,
              selectedOptionIds,
              fileUrl,
              rubricScores: null,
            }),
          );
        }
      }
    }

    if (responseIds.length > 0) {
      await manager.query(
        `UPDATE evaluation_responses SET seed_batch = $1 WHERE id = ANY($2::uuid[])`,
        [SEED_BATCH, responseIds],
      );
    }
    if (resultIds.length > 0) {
      await manager.query(
        `UPDATE evaluation_results SET seed_batch = $1 WHERE id = ANY($2::uuid[])`,
        [SEED_BATCH, resultIds],
      );
    }

    return { totalResponses: responseIds.length, totalResults: resultIds.length };
  }

  private buildAnswer(
    question: SurveyQuestionRow,
    index: number,
  ): {
    textValue: string | null;
    numericValue: number | null;
    selectedOptionIds: string[] | null;
    fileUrl: string | null;
  } {
    switch (question.question_type) {
      case 'LIKERT':
        return {
          textValue: null,
          numericValue: 1 + (index % 4),
          selectedOptionIds: null,
          fileUrl: null,
        };
      case 'SINGLE_CHOICE':
        return {
          textValue: null,
          numericValue: null,
          selectedOptionIds: question.option_ids.length
            ? [question.option_ids[index % question.option_ids.length]]
            : [],
          fileUrl: null,
        };
      case 'MULTIPLE_CHOICE':
        return {
          textValue: null,
          numericValue: null,
          selectedOptionIds: question.option_ids.slice(0, 1 + (index % 3)),
          fileUrl: null,
        };
      case 'YES_NO':
        return {
          textValue: index % 2 === 0 ? 'SI' : 'NO',
          numericValue: null,
          selectedOptionIds: null,
          fileUrl: null,
        };
      case 'LONG_TEXT':
        return {
          textValue: TEXTOS_REALISTAS[index % TEXTOS_REALISTAS.length],
          numericValue: null,
          selectedOptionIds: null,
          fileUrl: null,
        };
      case 'FILE_UPLOAD':
        return {
          textValue: null,
          numericValue: null,
          selectedOptionIds: null,
          fileUrl: `evidencia_docente_${String(index).padStart(3, '0')}.pdf`,
        };
      case 'NUMERIC':
        return {
          textValue: null,
          numericValue: 1 + (index % 10),
          selectedOptionIds: null,
          fileUrl: null,
        };
      default:
        return { textValue: null, numericValue: null, selectedOptionIds: null, fileUrl: null };
    }
  }

  private classify(percentageScore: number): { label: string; color: string } {
    if (percentageScore >= 90) {
      return { label: 'Excelente', color: '#27AE60' };
    }
    if (percentageScore >= 75) {
      return { label: 'Bueno', color: '#2980B9' };
    }
    if (percentageScore >= 60) {
      return { label: 'Satisfactorio', color: '#F39C12' };
    }
    return { label: 'Necesita Mejora', color: '#E74C3C' };
  }

  private randomSubmittedAt(index: number): Date {
    const start = new Date('2026-01-15T00:00:00Z').getTime();
    const end = new Date('2026-11-30T00:00:00Z').getTime();
    const span = end - start;
    const offset = (index * 86_400_000 * 37) % span;
    return new Date(start + offset);
  }
}

@Command({ name: 'mock-data-engine', description: 'Seed mock evaluation responses and results' })
export class MockDataEngineCommand extends CommandRunner {
  private readonly logger = new Logger(MockDataEngineCommand.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly responseSeeder: ResponseSeeder,
  ) {
    super();
  }

  async run(): Promise<void> {
    const existing: unknown[] = await this.dataSource.query(
      `SELECT 1 FROM evaluation_responses WHERE seed_batch = $1 LIMIT 1`,
      [SEED_BATCH],
    );
    if (existing.length > 0) {
      this.logger.warn(
        `Seed batch '${SEED_BATCH}' ya existe en evaluation_responses. Ejecuta cleanup primero.`,
      );
      return;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { totalResponses, totalResults } = await this.responseSeeder.run(queryRunner.manager);
      await queryRunner.commitTransaction();
      this.logger.log(
        `✓ Respuestas y resultados (respuestas=${totalResponses}, resultados=${totalResults})`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
