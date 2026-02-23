import { prisma } from '../prisma';

export async function updateResumeExtractedData(
  resumeId: string,
  extractedData: Record<string, any>
): Promise<void> {
  await prisma.resume.update({
    where: { id: resumeId },
    data: { extracted_data: extractedData },
  });
}
