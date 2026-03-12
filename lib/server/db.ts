// Next.js가 .env를 안 읽었을 수 있으므로, Prisma 사용 전에 로드
if (!process.env.DATABASE_URL) {
  try {
    const { readFileSync } = require('fs');
    const { resolve } = require('path');
    const path = resolve(process.cwd(), '.env');
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // .env 없거나 읽기 실패 시 무시
  }
}

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn']
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
