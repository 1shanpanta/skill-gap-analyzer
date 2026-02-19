import { Pool } from 'pg';
import type { Job } from '../db/queries/jobs.js';

// Placeholder — analysisOrchestrator will be imported in Phase 6
export async function handleJob(job: Job, pool: Pool): Promise<Record<string, any>> {
  switch (job.type) {
    case 'run_analysis':
      // Dynamic import to avoid circular dependency issues during phased build
      const { runAnalysisPipeline } = await import('../services/analysisOrchestrator.js');
      return runAnalysisPipeline(job.payload.analysis_id, pool);
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}
