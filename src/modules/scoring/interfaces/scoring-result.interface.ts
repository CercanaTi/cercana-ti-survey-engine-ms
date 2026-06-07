export interface SectionScoreResult {
  sectionId: string;
  sectionName: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface ManualReviewCandidate {
  questionId: string;
  questionText: string;
  responseValue: string | null;
}

export interface ScoringResult {
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  isPassing: boolean | null;
  classificationLabel: string | null;
  classificationColor: string | null;
  sectionResults: SectionScoreResult[];
  needsManualReview: boolean;
  manualReviewCandidates: ManualReviewCandidate[];
}
