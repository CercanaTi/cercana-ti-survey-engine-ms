import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { EvaluationResultStatus } from '../enums/evaluation-result-status.enum';

@Entity('evaluation_results')
@Unique(['evaluationResponseId'])
@Index('idx_evaluation_results_evaluated_person', ['evaluatedPersonId'])
@Index('idx_evaluation_results_evaluator', ['evaluatorUserId'])
@Index('idx_evaluation_results_survey', ['surveyId'])
@Index('idx_evaluation_results_hierarchy_node', ['hierarchyNodeId'])
@Index('idx_evaluation_results_status', ['status'])
@Index('idx_evaluation_results_period', ['period'])
export class EvaluationResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  evaluationResponseId: string;

  @Column({ type: 'uuid', nullable: false })
  evaluatorUserId: string;

  @Column({ type: 'uuid', nullable: false })
  evaluatedPersonId: string;

  @Column({ type: 'uuid', nullable: false })
  surveyId: string;

  @Column({ type: 'uuid', nullable: false })
  hierarchyNodeId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  totalScore: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  maxPossibleScore: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  percentageScore: number;

  @Column({ type: 'boolean', nullable: true })
  isPassing: boolean | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  classificationLabel: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  classificationColor: string | null;

  @Column({ type: 'varchar', length: 30, default: EvaluationResultStatus.CALCULADO })
  status: EvaluationResultStatus;

  @Column({ type: 'timestamptz', nullable: true })
  calculatedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: false })
  period: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
