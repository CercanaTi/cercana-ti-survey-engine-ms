import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EvaluationResult } from './evaluation-result.entity';
import { ManualReviewStatus } from '../enums/manual-review-status.enum';

@Entity('manual_review_tasks')
export class ManualReviewTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  evaluationResultId: string;

  @ManyToOne(() => EvaluationResult, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'evaluationResultId' })
  evaluationResult: EvaluationResult;

  @Column({ type: 'uuid', nullable: false })
  questionId: string;

  @Column({ type: 'text', nullable: false })
  questionText: string;

  @Column({ type: 'text', nullable: true })
  responseValue: string | null;

  @Column({ type: 'uuid', nullable: true })
  assignedTo: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  score: number | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'varchar', length: 20, default: ManualReviewStatus.PENDIENTE })
  status: ManualReviewStatus;
}
