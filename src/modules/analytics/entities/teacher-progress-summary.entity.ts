import { Column, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('teacher_progress_summaries')
@Unique(['userId', 'surveyId', 'period'])
export class TeacherProgressSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'uuid', nullable: false })
  surveyId: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  period: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  score: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentile: number | null;

  @Column({ type: 'jsonb', nullable: true })
  sectionScores: Record<string, number> | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
