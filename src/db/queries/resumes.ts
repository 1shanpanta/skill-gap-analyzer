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

export async function listSavedResumes(userId: string) {
  return prisma.resume.findMany({
    where: { user_id: userId, is_saved: true },
    orderBy: { updated_at: 'desc' },
    select: {
      id: true,
      name: true,
      created_at: true,
      updated_at: true,
      _count: { select: { analyses: true } },
    },
  });
}

export async function findResumeByIdAndUser(id: string, userId: string) {
  return prisma.resume.findFirst({
    where: { id, user_id: userId },
  });
}

export async function saveResume(
  id: string,
  userId: string,
  data: { name?: string; is_saved?: boolean }
) {
  return prisma.resume.updateMany({
    where: { id, user_id: userId },
    data: { ...data, updated_at: new Date() },
  });
}

export async function deleteResume(id: string, userId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const resume = await tx.resume.findFirst({
      where: { id, user_id: userId },
    });

    if (!resume) return false;

    // Check if any analyses reference this resume
    const usageCount = await tx.analysis.count({
      where: { resume_id: id },
    });

    if (usageCount > 0) {
      // Unsave instead of deleting since analyses reference it
      await tx.resume.update({
        where: { id },
        data: { is_saved: false, updated_at: new Date() },
      });
    } else {
      await tx.resume.delete({ where: { id } });
    }

    return true;
  });
}
