import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ReportRequestStatus } from '../enums/report-request-status.enum';

@Entity('report_requests')
@Index('idx_report_requests_requested_by', ['requestedBy'])
@Index('idx_report_requests_status', ['status'])
export class ReportRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  requestedBy: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  reportType: string;

  @Column({ type: 'jsonb', nullable: false })
  parameters: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: ReportRequestStatus.PENDING })
  status: ReportRequestStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fileUrl: string | null;

  @Column({ type: 'int', nullable: true })
  fileSize: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  requestedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
