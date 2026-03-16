import { NextResponse } from 'next/server';
import { appendFileSync } from 'fs';
import { join } from 'path';
import { importScoreboardWorkbook } from '@/lib/server/import-scoreboard';
import { fetchWorkbookFromUrl } from '@/lib/server/fetch-workbook-from-url';

const DEBUG_LOG = join(process.cwd(), 'import-debug.log');

function log(msg: string) {
  const line = `[${new Date().toISOString()}] [api/import/from-url] ${msg}\n`;
  try {
    appendFileSync(DEBUG_LOG, line);
  } catch {
    // ignore
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    if (!url) {
      return NextResponse.json({ message: 'url이 필요합니다.' }, { status: 400 });
    }

    log(`POST url=${url.slice(0, 80)}...`);
    const { buffer, fileName } = await fetchWorkbookFromUrl(url);
    log(`fetch ok fileName=${fileName} size=${buffer.byteLength}`);

    const result = await importScoreboardWorkbook(fileName, buffer);
    log(`import ok batchId=${(result as { batchId?: string })?.batchId}`);

    return NextResponse.json(result, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    log(`실패: ${message}`);
    if (stack) log(`스택: ${stack}`);
    return NextResponse.json(
      { message: 'URL에서 가져오기 실패', detail: message },
      { status: 500 }
    );
  }
}
