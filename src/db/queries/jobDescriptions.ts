import { prisma } from '../prisma.js';

export async function updateJDExtractedData(
  jdId: string,
  extractedData: Record<string, any>
): Promise<void> {
  await prisma.jobDescription.update({
    where: { id: jdId },
    data: { extracted_data: extractedData },
  });
}
