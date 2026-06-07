import { ScoringService } from '../scoring.service';
import { QuestionResponse } from '../../responses/entities/question-response.entity';
import { SurveyStructure } from '../../admin-client/interfaces';

const buildResponse = (overrides: Partial<QuestionResponse>): QuestionResponse =>
  ({
    id: 'response-1',
    evaluationResponseId: 'evaluation-response-1',
    questionId: 'question-1',
    sectionId: 'section-1',
    questionType: 'LIKERT',
    textValue: null,
    numericValue: null,
    selectedOptionIds: null,
    fileUrl: null,
    rubricScores: null,
    ...overrides,
  }) as QuestionResponse;

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
  });

  describe('calculateQuestionScore()', () => {
    it('returns the matching option value for a LIKERT question', () => {
      const response = buildResponse({ questionType: 'LIKERT', selectedOptionIds: ['option-4'] });
      const score = service.calculateQuestionScore(response, {
        id: 'question-1',
        text: 'How satisfied are you?',
        type: 'LIKERT',
        maxScore: 5,
        options: [
          { id: 'option-1', value: 1 },
          { id: 'option-4', value: 4 },
        ],
      });

      expect(score).toBe(4);
    });

    it('sums selected option values for MULTIPLE_CHOICE, capped at maxScore', () => {
      const response = buildResponse({
        questionType: 'MULTIPLE_CHOICE',
        selectedOptionIds: ['a', 'b', 'c'],
      });
      const score = service.calculateQuestionScore(response, {
        id: 'question-2',
        text: 'Select all that apply',
        type: 'MULTIPLE_CHOICE',
        maxScore: 5,
        options: [
          { id: 'a', value: 2 },
          { id: 'b', value: 2 },
          { id: 'c', value: 3 },
        ],
      });

      expect(score).toBe(5);
    });

    it('averages all rubric criteria scores for RUBRIC questions', () => {
      const response = buildResponse({
        questionType: 'RUBRIC',
        rubricScores: [
          { criteriaIndex: 0, levelIndex: 1, score: 3 },
          { criteriaIndex: 1, levelIndex: 2, score: 5 },
        ],
      });
      const score = service.calculateQuestionScore(response, {
        id: 'question-3',
        text: 'Rubric question',
        type: 'RUBRIC',
        maxScore: 10,
        maxLevelScore: 5,
      });

      // mean = (3 + 5) / 2 = 4 -> (4 / 5) * 10 = 8
      expect(score).toBe(8);
    });

    it('returns 0 for SHORT_TEXT questions (manual review)', () => {
      const response = buildResponse({ questionType: 'SHORT_TEXT', textValue: 'free text answer' });
      const score = service.calculateQuestionScore(response, {
        id: 'question-4',
        text: 'Describe your experience',
        type: 'SHORT_TEXT',
        maxScore: 10,
        manualReview: true,
      });

      expect(score).toBe(0);
    });

    it('normalizes NUMERIC values within the configured min-max range', () => {
      const response = buildResponse({ questionType: 'NUMERIC', numericValue: 75 });
      const score = service.calculateQuestionScore(response, {
        id: 'question-5',
        text: 'How many years of experience?',
        type: 'NUMERIC',
        maxScore: 10,
        minValue: 50,
        maxValue: 100,
      });

      // (75 - 50) / (100 - 50) * 10 = 5
      expect(score).toBe(5);
    });
  });

  describe('calculateScore()', () => {
    const buildSurvey = (): SurveyStructure => ({
      id: 'survey-1',
      name: 'Teacher Evaluation',
      maxScore: 100,
      period: '2025',
      passingPercentage: 70,
      scaleRanges: [
        { min: 0, max: 59.99, label: 'Deficiente', color: '#ef4444' },
        { min: 60, max: 79.99, label: 'Regular', color: '#eab308' },
        { min: 80, max: 100, label: 'Excelente', color: '#22c55e' },
      ],
      sections: [
        {
          id: 'section-1',
          name: 'Planificación',
          weight: 60,
          questions: [
            {
              id: 'q1',
              text: 'Question 1',
              type: 'LIKERT',
              maxScore: 5,
              options: [{ id: 'opt-5', value: 5 }],
            },
          ],
        },
        {
          id: 'section-2',
          name: 'Ejecución',
          weight: 40,
          questions: [
            {
              id: 'q2',
              text: 'Question 2',
              type: 'LIKERT',
              maxScore: 5,
              options: [{ id: 'opt-2', value: 2 }],
            },
          ],
        },
      ],
      evaluatedPersonNodes: { 'person-1': 'node-1' },
    });

    it('calculates the correct weighted total across sections with different weights', () => {
      const responses = [
        buildResponse({ questionId: 'q1', sectionId: 'section-1', selectedOptionIds: ['opt-5'] }),
        buildResponse({ questionId: 'q2', sectionId: 'section-2', selectedOptionIds: ['opt-2'] }),
      ];

      const result = service.calculateScore(responses, buildSurvey());

      // section 1: 5/5 = 100% * 60% weight = 60
      // section 2: 2/5 = 40% * 40% weight = 16
      // total percentage = 76
      expect(result.sectionResults[0]).toMatchObject({ score: 5, maxScore: 5, percentage: 100 });
      expect(result.sectionResults[1]).toMatchObject({ score: 2, maxScore: 5, percentage: 40 });
      expect(result.percentageScore).toBeCloseTo(76);
      expect(result.totalScore).toBeCloseTo(76);
      expect(result.maxPossibleScore).toBe(100);
    });

    it('flags SHORT_TEXT/LONG_TEXT/FILE_UPLOAD questions with manualReview as needing manual review', () => {
      const survey = buildSurvey();
      survey.sections[0].questions.push({
        id: 'q3',
        text: 'Explain your methodology',
        type: 'SHORT_TEXT',
        maxScore: 5,
        manualReview: true,
      });

      const responses = [
        buildResponse({ questionId: 'q1', sectionId: 'section-1', selectedOptionIds: ['opt-5'] }),
        buildResponse({ questionId: 'q2', sectionId: 'section-2', selectedOptionIds: ['opt-2'] }),
        buildResponse({
          questionId: 'q3',
          sectionId: 'section-1',
          questionType: 'SHORT_TEXT',
          textValue: 'My methodology is...',
        }),
      ];

      const result = service.calculateScore(responses, survey);

      expect(result.needsManualReview).toBe(true);
      expect(result.manualReviewCandidates).toEqual([
        {
          questionId: 'q3',
          questionText: 'Explain your methodology',
          responseValue: 'My methodology is...',
        },
      ]);
    });
  });

  describe('applyScaleClassification()', () => {
    const scaleRanges = [
      { min: 0, max: 59.99, label: 'Deficiente', color: '#ef4444' },
      { min: 60, max: 79.99, label: 'Regular', color: '#eab308' },
      { min: 80, max: 89.99, label: 'Bueno', color: '#3b82f6' },
      { min: 90, max: 100, label: 'Excelente', color: '#22c55e' },
    ];

    it.each([
      [45, 'Deficiente', '#ef4444'],
      [65, 'Regular', '#eab308'],
      [85, 'Bueno', '#3b82f6'],
      [95, 'Excelente', '#22c55e'],
    ])('classifies a score of %i as %s', (percentage, label, color) => {
      expect(service.applyScaleClassification(percentage, scaleRanges)).toEqual({ label, color });
    });

    it('returns null when no range matches', () => {
      expect(service.applyScaleClassification(150, scaleRanges)).toBeNull();
    });
  });
});
