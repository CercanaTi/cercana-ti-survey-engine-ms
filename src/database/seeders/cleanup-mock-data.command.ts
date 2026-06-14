import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Command, CommandRunner } from 'nest-commander';
import { DataSource, EntityManager } from 'typeorm';
import { SEED_BATCH } from './seed-batch.constant';

@Command({
  name: 'cleanup-mock-data-engine',
  description: 'Remove mock evaluation responses and results',
})
export class CleanupMockDataEngineCommand extends CommandRunner {
  private readonly logger = new Logger(CleanupMockDataEngineCommand.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async run(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      await this.deleteAndLog(
        manager,
        '1. section_results',
        `DELETE FROM section_results
         WHERE "evaluationResultId" IN (SELECT id FROM evaluation_results WHERE seed_batch = $1) RETURNING id`,
      );

      await this.deleteAndLog(
        manager,
        '2. evaluation_results',
        `DELETE FROM evaluation_results WHERE seed_batch = $1 RETURNING id`,
      );

      await this.deleteAndLog(
        manager,
        '3. question_responses',
        `DELETE FROM question_responses
         WHERE "evaluationResponseId" IN (SELECT id FROM evaluation_responses WHERE seed_batch = $1) RETURNING id`,
      );

      await this.deleteAndLog(
        manager,
        '4. evaluation_responses',
        `DELETE FROM evaluation_responses WHERE seed_batch = $1 RETURNING id`,
      );

      const reset: [unknown[], number] = await manager.query(
        `UPDATE evaluated_users SET status = 'PENDIENTE' WHERE seed_batch = $1 RETURNING id`,
        [SEED_BATCH],
      );
      this.logger.log(`5. evaluated_users (status reseteado): ${reset[1]} filas actualizadas`);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async deleteAndLog(manager: EntityManager, label: string, sql: string): Promise<void> {
    const result: [unknown[], number] = await manager.query(sql, [SEED_BATCH]);
    this.logger.log(`${label}: ${result[1]} filas eliminadas`);
  }
}
