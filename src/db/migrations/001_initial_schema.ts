import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable().unique();
    table.string('name', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.integer('daily_analysis_count').notNullable().defaultTo(0);
    table.date('last_analysis_date').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('resumes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('raw_text').notNullable();
    table.jsonb('extracted_data').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('user_id');
  });

  await knex.schema.createTable('job_descriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('raw_text').notNullable();
    table.jsonb('extracted_data').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('user_id');
  });

  await knex.schema.createTable('analyses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('resume_id').notNullable().references('id').inTable('resumes').onDelete('CASCADE');
    table.uuid('job_description_id').notNullable().references('id').inTable('job_descriptions').onDelete('CASCADE');
    table.string('status', 20).notNullable().defaultTo('pending')
      .checkIn(['pending', 'processing', 'completed', 'failed']);
    table.decimal('overall_score', 5, 2).nullable();
    table.jsonb('score_breakdown').nullable();
    table.jsonb('skill_gaps').nullable();
    table.jsonb('github_signals').nullable();
    table.text('roadmap').nullable();
    table.text('resume_suggestions').nullable();
    table.jsonb('token_usage').nullable();
    table.string('github_url', 500).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('completed_at', { useTz: true }).nullable();

    table.index('user_id');
    table.index('status');
  });

  await knex.schema.createTable('jobs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('type', 50).notNullable();
    table.string('status', 20).notNullable().defaultTo('pending')
      .checkIn(['pending', 'processing', 'completed', 'failed']);
    table.jsonb('payload').notNullable();
    table.jsonb('result').nullable();
    table.integer('attempts').notNullable().defaultTo(0);
    table.integer('max_attempts').notNullable().defaultTo(3);
    table.integer('priority').notNullable().defaultTo(0);
    table.timestamp('scheduled_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('started_at', { useTz: true }).nullable();
    table.timestamp('completed_at', { useTz: true }).nullable();
    table.timestamp('failed_at', { useTz: true }).nullable();
    table.text('error').nullable();
    table.string('worker_id', 100).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Partial index for efficient job claiming
  await knex.raw(`
    CREATE INDEX idx_jobs_claimable
    ON jobs (priority DESC, scheduled_at ASC)
    WHERE status = 'pending'
  `);

  // Index for stale job recovery
  await knex.raw(`
    CREATE INDEX idx_jobs_stale
    ON jobs (started_at)
    WHERE status = 'processing'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('jobs');
  await knex.schema.dropTableIfExists('analyses');
  await knex.schema.dropTableIfExists('job_descriptions');
  await knex.schema.dropTableIfExists('resumes');
  await knex.schema.dropTableIfExists('users');
}
