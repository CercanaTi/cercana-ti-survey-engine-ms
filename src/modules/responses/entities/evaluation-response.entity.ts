import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EvaluationResponseStatus } from '../enums/evaluation-response-status.enum';

@Entity('evaluation_responses')
@Index('idx_evaluation_responses_evaluated_person', ['evaluatedPersonId'])
@Index('idx_evaluation_responses_evaluator', ['evaluatorUserId'])
@Index('idx_evaluation_responses_survey', ['surveyId'])
@Index('idx_evaluation_responses_status', ['status'])
export class EvaluationResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  evaluatedUserId: string;

  @Column({ type: 'uuid', nullable: false })
  evaluatorUserId: string;

  @Column({ type: 'uuid', nullable: false })
  evaluatedPersonId: string;

  @Column({ type: 'uuid', nullable: false })
  surveyId: string;

  @Column({ type: 'int', nullable: false })
  surveyVersion: number;

  @Column({ type: 'varchar', length: 20, default: EvaluationResponseStatus.RECIBIDA })
  status: EvaluationResponseStatus;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number | null;

  @Column({ type: 'int', default: 1 })
  attempt: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
