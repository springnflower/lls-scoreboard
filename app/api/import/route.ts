import { NextResponse } from 'next/server';
import { appendFileSync } from 'fs';
import { join } from 'path';
import { importScoreboardWorkbook } from '@/lib/server/import-scoreboard';

const DEBUG_LOG = join(process.cwd(), 'import-debug.log');

function log(msg: string) {
  const line = `[${new Date().toISOString()}] [api/import] ${msg}\n`;
  process.stderr.write(line);
  try {
    appendFileSync(DEBUG_LOG, line);
  } catch {
    // ignore
  }
}

export async function POST(request: Request) {
  log('POST 시작');
  try {
    log('formData 파싱 중...');
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ message: '업로드 파일이 없습니다.' }, { status: 400 });
    }
    log(`파일: ${file.name} ${file.size} bytes`);

    log('arrayBuffer 읽는 중...');
    const buffer = await file.arrayBuffer();

    log('importScoreboardWorkbook 호출 중...');
    const result = await importScoreboardWorkbook(file.name, buffer);

    log(`성공 batchId=${(result as { batchId?: string })?.batchId}`);
    log('JSON 직렬화 중...');
    const body = JSON.stringify(result);
    log('응답 반환');
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    log('실패 메시지: ' + message);
    if (stack) log('스택:\n' + stack);
    return NextResponse.json(
      { message: '스코어보드 import 실패', detail: message },
      { status: 500 }
    );
  }
}
