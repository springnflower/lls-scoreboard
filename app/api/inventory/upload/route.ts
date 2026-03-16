import { NextResponse } from 'next/server';
import { importInventoryFromBuffer } from '@/lib/server/import-scoreboard';
import { prisma } from '@/lib/server/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const batchIdParam = request.url ? new URL(request.url).searchParams.get('batchId') : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ message: '재고 엑셀 파일을 선택해 주세요.' }, { status: 400 });
    }

    let batchId = batchIdParam?.trim() || null;
    if (!batchId) {
      const latest = await prisma.importBatch.findFirst({
        orderBy: { importedAt: 'desc' },
        select: { id: true }
      });
      if (!latest) {
        return NextResponse.json(
          { message: '먼저 대시보드에서 매출/정산 엑셀을 업로드해 배치를 만든 뒤, 재고 엑셀을 업로드해 주세요.' },
          { status: 400 }
        );
      }
      batchId = latest.id;
    }

    const buffer = await file.arrayBuffer();
    const result = await importInventoryFromBuffer(batchId, buffer);
    if (!result) {
      return NextResponse.json({ message: '재고 반영에 실패했습니다.' }, { status: 500 });
    }
    const count = result?.data?.inventoryPositions?.length ?? 0;
    if (count === 0) {
      return NextResponse.json(
        {
          ...result,
          message: '파일에서 재고 데이터를 읽지 못했습니다. 시트에 분류·색상·3SOCKET/USB-C/CABLE/COLLABO 컬럼이 있는지, 또는 raw5(재고) 형식인지 확인하세요.'
        },
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.json(result, { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: '재고 엑셀 업로드 실패', detail: message },
      { status: 500 }
    );
  }
}
