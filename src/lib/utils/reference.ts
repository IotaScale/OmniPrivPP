import { prisma } from '@/lib/db';

/**
 * Generate sequential deal reference like OPR-2026-000001
 */
export async function generateDealReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OPR-${year}-`;

  const count = await prisma.dealRegistration.count({
    where: {
      public_reference: {
        startsWith: prefix,
      },
    },
  });

  const nextNumber = (count + 1).toString().padStart(6, '0');
  return `${prefix}${nextNumber}`;
}

/**
 * Generate sequential lead reference like OPL-2026-000001
 */
export async function generateLeadReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OPL-${year}-`;

  const count = await prisma.lead.count({
    where: {
      public_reference: {
        startsWith: prefix,
      },
    },
  });

  const nextNumber = (count + 1).toString().padStart(6, '0');
  return `${prefix}${nextNumber}`;
}
