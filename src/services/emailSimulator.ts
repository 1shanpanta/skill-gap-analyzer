import { logger } from '../lib/logger';

export function simulateEmailNotification(
  email: string,
  analysisId: string,
  overallScore: number
): void {
  logger.info({ email, analysisId, overallScore }, 'Email notification sent (simulated)');
}
