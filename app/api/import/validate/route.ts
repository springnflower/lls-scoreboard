import { NextResponse } from 'next/server';
import { validateScoreboardBuffer, SCOREBOARD_SHEET_NAMES } from '@/lib/excel-parser';

/**
 * POST: 엑셀 파일을 DB에 저장하지 않고 파싱만 해서
 * 시트 존재 여부, 행 수, 첫 데이터 행 샘플, 기대 컬럼 스펙을 반환합니다.
 * 스코어보드 "각 항목별 결과값"이 틀릴 때 엑셀 구조가 맞는지 확인용입니다.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ message: '업로드 파일이 없습니다.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const { data, validation } = validateScoreboardBuffer(buffer);

    const salesSum = data.sales.reduce((s, r) => s + r.consumerPrice, 0);
    const settlementSum = data.settlements.reduce((s, r) => s + r.settlementAmount, 0);
    const adSpendSum = (data.adSpends ?? []).reduce((s, r) => s + r.spend, 0);
    const inventoryCount = (data.inventoryPositions ?? []).length;
    const inventoryAsset = (data.inventoryPositions ?? []).reduce((s, r) => s + r.onHandQty * r.unitCost, 0);

    return NextResponse.json({
      message: '검증 완료 (DB 미저장)',
      requiredSheetNames: SCOREBOARD_SHEET_NAMES,
      validation,
      parsedTotals: {
        sales: { count: data.sales.length, sumConsumerPrice: salesSum },
        settlements: { count: data.settlements.length, sumSettlementAmount: settlementSum },
        purchases: { count: data.purchases.length },
        adSpends: { count: (data.adSpends ?? []).length, sumSpend: adSpendSum },
        inventory: { count: inventoryCount, assetSum: inventoryAsset }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: '검증 실패', detail: message },
      { status: 500 }
    );
  }
}
