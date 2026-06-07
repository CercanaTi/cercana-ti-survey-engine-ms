export interface ScaleRange {
  min: number;
  max: number;
  label: string;
  color: string;
}

export interface QuestionOption {
  id: string;
  value: number;
}

export interface QuestionConfig {
  id: string;
  text: string;
  type: string;
  maxScore: number;
  manualReview?: boolean;
  options?: QuestionOption[];
  minValue?: number;
  maxValue?: number;
  maxLevelScore?: number;
}

export interface SectionStructure {
  id: string;
  name: string;
  weight: number;
  questions: QuestionConfig[];
}

export interface SurveyStructure {
  id: string;
  name: string;
  maxScore: number;
  /** Active campaign period for this survey, e.g. '2025'. Carried on the structure response
   * because EvaluationResponse does not store it (see Phase 15 spec). */
  period: string;
  passingPercentage?: number | null;
  scaleRanges: ScaleRange[];
  sections: SectionStructure[];
  /** Maps evaluatedPersonId -> their center hierarchyNodeId. The engine has no hierarchy
   * table, so this is resolved via the survey structure response rather than a separate call. */
  evaluatedPersonNodes: Record<string, string>;
}
