import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EvaluationResponse } from './evaluation-response.entity';

export interface RubricScoreEntry {
  criteriaIndex: number;
  levelIndex: number;
  score: number;
}

@Entity('question_responses')
export class QuestionResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  evaluationResponseId: string;

  @ManyToOne(() => EvaluationResponse, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'evaluationResponseId' })
  evaluationResponse: EvaluationResponse;

  @Column({ type: 'uuid', nullable: false })
  questionId: string;

  @Column({ type: 'uuid', nullable: false })
  sectionId: string;

  @Column({ type: 'varchar', length: 30, nullable: false })
  questionType: string;

  @Column({ type: 'text', nullable: true })
  textValue: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  numericValue: number | null;

  @Column({ type: 'jsonb', nullable: true })
  selectedOptionIds: string[] | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fileUrl: string | null;

  @Column({ type: 'jsonb', nullable: true })
  rubricScores: RubricScoreEntry[] | null;
}
