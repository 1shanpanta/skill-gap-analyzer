import type { Job } from '../db/queries/jobs';

export async function handleJob(job: Job): Promise<Record<string, any>> {
  switch (job.type) {
    case 'run_analysis': {
      const { runAnalysisPipeline } = await import('../services/analysisOrchestrator');
      return runAnalysisPipeline((job.payload as Record<string, any>).analysis_id);
    }
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}
