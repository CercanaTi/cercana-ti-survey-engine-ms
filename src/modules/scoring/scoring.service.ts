import { Injectable } from '@nestjs/common';
import { QuestionResponse } from '../responses/entities/question-response.entity';
import {
  QuestionConfig,
  ScaleRange,
  SectionStructure,
  SurveyStructure,
} from '../admin-client/interfaces';
import { MANUAL_REVIEW_QUESTION_TYPES, QUESTION_TYPES } from './constants/scoring.constants';
import { ManualReviewCandidate, ScoringResult, SectionScoreResult } from './interfaces';

interface ScaleClassification {
  label: string;
  color: string;
}

@Injectable()
export class ScoringService {
  calculateScore(questionResponses: QuestionResponse[], survey: SurveyStructure): ScoringResult {
    const responsesByQuestionId = new Map(
      questionResponses.map((response) => [response.questionId, response]),
    );
    const sectionResults: SectionScoreResult[] = [];
    const manualReviewCandidates: ManualReviewCandidate[] = [];
    let weightedPercentageTotal = 0;

    for (const section of survey.sections) {
      const { result, candidates, weightedPercentage } = this.scoreSection(
        section,
        responsesByQuestionId,
      );
      sectionResults.push(result);
      manualReviewCandidates.push(...candidates);
      weightedPercentageTotal += weightedPercentage;
    }

    const percentageScore = weightedPercentageTotal;
    const totalScore = (percentageScore / 100) * survey.maxScore;
    const classification = this.applyScaleClassification(percentageScore, survey.scaleRanges ?? []);

    return {
      totalScore,
      maxPossibleScore: survey.maxScore,
      percentageScore,
      isPassing: this.resolveIsPassing(percentageScore, survey.passingPercentage),
      classificationLabel: classification?.label ?? null,
      classificationColor: classification?.color ?? null,
      sectionResults,
      needsManualReview: manualReviewCandidates.length > 0,
      manualReviewCandidates,
    };
  }

  calculateQuestionScore(response: QuestionResponse | undefined, question: QuestionConfig): number {
    switch (question.type) {
      case QUESTION_TYPES.LIKERT:
      case QUESTION_TYPES.SINGLE_CHOICE:
      case QUESTION_TYPES.YES_NO:
        return this.scoreSingleSelection(response, question);
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return this.scoreMultipleSelection(response, question);
      case QUESTION_TYPES.RUBRIC:
        return this.scoreRubric(response, question);
      case QUESTION_TYPES.DATE:
        return this.scoreDate(response, question);
      case QUESTION_TYPES.NUMERIC:
        return this.scoreNumeric(response, question);
      case QUESTION_TYPES.SHORT_TEXT:
      case QUESTION_TYPES.LONG_TEXT:
      case QUESTION_TYPES.FILE_UPLOAD:
      default:
        return 0;
    }
  }

  applyScaleClassification(
    percentage: number,
    scaleRanges: ScaleRange[],
  ): ScaleClassification | null {
    const range = scaleRanges.find(
      (candidate) => percentage >= candidate.min && percentage <= candidate.max,
    );
    return range ? { label: range.label, color: range.color } : null;
  }

  private scoreSection(
    section: SectionStructure,
    responsesByQuestionId: Map<string, QuestionResponse>,
  ): {
    result: SectionScoreResult;
    candidates: ManualReviewCandidate[];
    weightedPercentage: number;
  } {
    const candidates: ManualReviewCandidate[] = [];
    const sectionMaxScore = section.questions.reduce((sum, question) => sum + question.maxScore, 0);
    let sectionScore = 0;

    for (const question of section.questions) {
      const response = responsesByQuestionId.get(question.id);
      sectionScore += this.calculateQuestionScore(response, question);

      if (this.requiresManualReview(question)) {
        candidates.push({
          questionId: question.id,
          questionText: question.text,
          responseValue: this.extractResponseValue(response),
        });
      }
    }

    const sectionPercentage = sectionMaxScore > 0 ? (sectionScore / sectionMaxScore) * 100 : 0;
    const weightedPercentage = sectionPercentage * (section.weight / 100);

    return {
      result: {
        sectionId: section.id,
        sectionName: section.name,
        score: sectionScore,
        maxScore: sectionMaxScore,
        percentage: sectionPercentage,
      },
      candidates,
      weightedPercentage,
    };
  }

  private scoreSingleSelection(
    response: QuestionResponse | undefined,
    question: QuestionConfig,
  ): number {
    const optionId = response?.selectedOptionIds?.[0];
    if (!optionId || !question.options) {
      return 0;
    }
    return question.options.find((option) => option.id === optionId)?.value ?? 0;
  }

  private scoreMultipleSelection(
    response: QuestionResponse | undefined,
    question: QuestionConfig,
  ): number {
    if (!response?.selectedOptionIds?.length || !question.options) {
      return 0;
    }
    const options = question.options;
    const sum = response.selectedOptionIds.reduce((total, optionId) => {
      const option = options.find((candidate) => candidate.id === optionId);
      return total + (option?.value ?? 0);
    }, 0);
    return Math.min(sum, question.maxScore);
  }

  private scoreRubric(response: QuestionResponse | undefined, question: QuestionConfig): number {
    if (!response?.rubricScores?.length || !question.maxLevelScore) {
      return 0;
    }
    const mean =
      response.rubricScores.reduce((sum, entry) => sum + entry.score, 0) /
      response.rubricScores.length;
    return (mean / question.maxLevelScore) * question.maxScore;
  }

  private scoreDate(response: QuestionResponse | undefined, question: QuestionConfig): number {
    return response?.textValue ? question.maxScore : 0;
  }

  private scoreNumeric(response: QuestionResponse | undefined, question: QuestionConfig): number {
    if (response?.numericValue == null || question.minValue == null || question.maxValue == null) {
      return 0;
    }
    const range = question.maxValue - question.minValue;
    if (range <= 0) {
      return 0;
    }
    const normalized = (Number(response.numericValue) - question.minValue) / range;
    return Math.max(0, Math.min(1, normalized)) * question.maxScore;
  }

  private requiresManualReview(question: QuestionConfig): boolean {
    return Boolean(question.manualReview) && MANUAL_REVIEW_QUESTION_TYPES.has(question.type);
  }

  private extractResponseValue(response: QuestionResponse | undefined): string | null {
    if (!response) {
      return null;
    }
    return response.textValue ?? response.fileUrl ?? null;
  }

  private resolveIsPassing(
    percentageScore: number,
    passingPercentage?: number | null,
  ): boolean | null {
    if (passingPercentage == null) {
      return null;
    }
    return percentageScore >= passingPercentage;
  }
}
