export function simulateEmailNotification(
  email: string,
  analysisId: string,
  overallScore: number
): void {
  console.log(
    `\n📧 EMAIL SENT to ${email}: Analysis ${analysisId} complete. Score: ${overallScore}/100\n`
  );
}
