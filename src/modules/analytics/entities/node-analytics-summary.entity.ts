import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export interface ScoreDistribution {
  excelente: number;
  bueno: number;
  regular: number;
  deficiente: number;
}

export interface SectionScoreSummary {
  sectionName: string;
  avgScore: number;
}

@Entity('node_analytics_summaries')
@Unique(['hierarchyNodeId', 'surveyId', 'period'])
@Index('idx_node_analytics_hierarchy_node', ['hierarchyNodeId'])
@Index('idx_node_analytics_survey', ['surveyId'])
@Index('idx_node_analytics_period', ['period'])
export class NodeAnalyticsSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  hierarchyNodeId: string;

  @Column({ type: 'uuid', nullable: false })
  surveyId: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  period: string;

  @Column({ type: 'int', default: 0 })
  totalAssigned: number;

  @Column({ type: 'int', default: 0 })
  totalCompleted: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  avgScore: number | null;

  @Column({ type: 'jsonb', nullable: true })
  distributionJson: ScoreDistribution | null;

  @Column({ type: 'jsonb', nullable: true })
  topStrengths: SectionScoreSummary[] | null;

  @Column({ type: 'jsonb', nullable: true })
  topWeaknesses: SectionScoreSummary[] | null;

  @Column({ type: 'timestamptz', nullable: true })
  calculatedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
