import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EvaluationResult } from './evaluation-result.entity';

@Entity('section_results')
export class SectionResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  evaluationResultId: string;

  @ManyToOne(() => EvaluationResult, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'evaluationResultId' })
  evaluationResult: EvaluationResult;

  @Column({ type: 'uuid', nullable: false })
  sectionId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  sectionName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  score: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  maxScore: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  percentage: number;
}
