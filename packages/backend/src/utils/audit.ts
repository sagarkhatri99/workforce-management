import prisma from './prisma';

export const logAudit = async (
  userId: string | undefined,
  action: string,
  resource: string,
  details?: string,
  ip?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details,
        ip,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
