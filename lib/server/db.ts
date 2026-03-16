// Next.js가 .env를 안 읽었을 수 있으므로, Prisma 사용 전에 로드
if (!process.env.DATABASE_URL) {
  try {
    const { readFileSync, existsSync } = require('fs');
    const { resolve } = require('path');
    const path = resolve(process.cwd(), '.env');
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf8');
      for (const line of content.split('\n')) {
        const m = line.match(/^\s*([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // .env 없거나 읽기 실패 시 무시
  }
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL이 설정되지 않았습니다. v7 폴더에 .env 파일을 만들고 .env.example을 참고해 DATABASE_URL을 넣어주세요. ' +
      'PostgreSQL이 localhost:5433에서 실행 중이어야 하며, "npm run prisma:migrate"로 마이그레이션을 적용해주세요.'
    );
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
