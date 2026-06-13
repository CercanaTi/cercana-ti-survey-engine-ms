import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeedBatchColumnAllTables1780800000001 implements MigrationInterface {
  name = 'AddSeedBatchColumnAllTables1780800000001';

  private readonly tables = [
    'users',
    'hierarchy_nodes',
    'survey_campaigns',
    'surveys',
    'evaluator_assignments',
    'evaluated_users',
    'evaluation_responses',
    'evaluation_results',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN "seed_batch" character varying(50) NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "seed_batch"`);
    }
  }
}
