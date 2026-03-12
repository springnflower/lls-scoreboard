import * as XLSX from 'xlsx';
import type { AdSpendRow, InventoryPositionRow, PurchaseRow, SalesRow, ScoreboardData, SettlementRow } from './types';
import { toDateString, toMonthKey, toNumber } from './utils';

function sheetRows(workbook: XLSX.WorkBook, name: string): unknown[][] {
  const sheet = workbook.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: null }) as unknown[][];
}

function normalizeSales(rows: unknown[][]): SalesRow[] {
  return rows
    .slice(2)
    .filter((row) => row[1] && row[9])
    .map((row) => {
      const orderDate = toDateString(row[2]);
      return {
        source: 'sales' as const,
        channel: String(row[0] ?? '').trim(),
        orderId: String(row[1] ?? '').trim(),
        orderDate,
        month: toMonthKey(orderDate),
        status: String(row[6] ?? '').trim(),
        productName: String(row[9] ?? '').trim(),
        color: String(row[10] ?? '').trim(),
        category: String(row[12] ?? '').trim() || '미분류',
        qty: toNumber(row[11]),
        consumerPrice: toNumber(row[14]),
        address: String(row[13] ?? '').trim()
      };
    });
}

function normalizeSettlements(rows: unknown[][]): SettlementRow[] {
  return rows
    .slice(2)
    .filter((row) => row[3] && row[5])
    .map((row) => ({
      source: 'settlement' as const,
      partner: String(row[0] ?? '').trim(),
      monthNumber: row[1] ? toNumber(row[1]) : null,
      settledAt: toDateString(row[2]),
      settlementId: String(row[3] ?? '').trim(),
      transactionType: String(row[4] ?? '').trim(),
      productName: String(row[5] ?? '').trim(),
      color: String(row[6] ?? '').trim(),
      category: String(row[7] ?? '').trim() || '미분류',
      grossSales: toNumber(row[8]),
      fee: toNumber(row[9]),
      adjustment: toNumber(row[10]),
      settlementAmount: toNumber(row[12]),
      qty: toNumber(row[13]),
      isMatched: String(row[17] ?? '').trim() === 'O',
      cancelType: String(row[18] ?? '').trim()
    }));
}

function normalizePurchases(rows: unknown[][]): PurchaseRow[] {
  return rows
    .slice(1)
    .filter((row) => row[1] && row[7])
    .map((row) => ({
      source: 'purchase' as const,
      accountType: String(row[0] ?? '').trim(),
      fiscalYear: String(row[1] ?? '').trim(),
      purchaseDate: toDateString(row[2]),
      vendor: String(row[3] ?? '').trim(),
      item: String(row[4] ?? '').trim(),
      qty: toNumber(row[5]),
      supplyCost: toNumber(row[6]),
      totalWithVat: toNumber(row[7]),
      paid: Boolean(row[10]),
      note: String(row[11] ?? '').trim()
    }));
}

/** 광고비 시트(raw4): [0]채널 [1]미디어 [2]월(YYYY-MM) [3]금액 [4]비고. 1행 헤더, 2행부터 데이터 */
function normalizeAdSpends(rows: unknown[][]): AdSpendRow[] {
  return rows
    .slice(1)
    .filter((row) => row[0] != null && row[3] != null)
    .map((row) => {
      const monthRaw = row[2];
      const month = typeof monthRaw === 'string' && /^\d{4}-\d{2}$/.test(monthRaw.trim())
        ? monthRaw.trim()
        : toMonthKey(toDateString(monthRaw));
      return {
        channel: String(row[0] ?? '').trim(),
        media: String(row[1] ?? '').trim() || '기타',
        month,
        spend: toNumber(row[3]),
        memo: String(row[4] ?? '').trim()
      };
    });
}

/** LLS spend 시트(월 별 매입 비용): 계정과목=광고・마케팅비, 품목=META/네이버 등, 1月~12月 금액. row2=헤더, row4~ 데이터. yearPrefix 예: "2026" */
function normalizeAdSpendsFromSpendSheet(rows: unknown[][], yearPrefix: string): AdSpendRow[] {
  const out: AdSpendRow[] = [];
  const MONTH_COLS = [17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39]; // 1月~12月 금액 열
  let inAdSection = false;
  for (let i = 4; i < rows.length; i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;
    const account = String(r[3] ?? '').trim();
    const item = String(r[4] ?? '').trim();
    if (account === '광고・마케팅비') {
      inAdSection = true;
    } else if (inAdSection && account && account !== '광고・마케팅비') {
      inAdSection = false;
    }
    if (!inAdSection) continue;
    const media = item || (account === '광고・마케팅비' ? '' : account);
    if (!media) continue;
    const channel = media.includes('네이버') ? '네이버' : media.includes('META') || media.includes('페이스북') ? 'META' : media.includes('카카오') ? '카카오' : '전체';
    for (let m = 0; m < 12; m++) {
      const amount = toNumber(r[MONTH_COLS[m]]);
      if (amount <= 0) continue;
      const month = `${yearPrefix}-${String(m + 1).padStart(2, '0')}`;
      out.push({ channel, media, month, spend: amount, memo: '' });
    }
  }
  return out;
}

/** 시트 이름 목록에서 FY 연도 추출 (예: 2612, 2601 -> 2026) */
function detectYearFromSheetNames(sheetNames: string[]): string {
  const y = new Date().getFullYear();
  for (const name of sheetNames) {
    const m = name.match(/^(25|26|27|24)\d{2}$/);
    if (m) return '20' + m[1];
  }
  return String(y);
}

/** 재고 시트: [0]SKU키워드 [1]카테고리 [2]재고수량 [3]예약수량 [4]단가 [5]비고. 1행 헤더, 2행부터 데이터 */
function normalizeInventory(rows: unknown[][]): InventoryPositionRow[] {
  return rows
    .slice(1)
    .filter((row) => row[0] != null && (row[2] != null || row[4] != null))
    .map((row) => ({
      skuKeyword: String(row[0] ?? '').trim(),
      category: String(row[1] ?? '').trim() || '미분류',
      onHandQty: Math.max(0, toNumber(row[2])),
      reservedQty: Math.max(0, toNumber(row[3])),
      unitCost: toNumber(row[4]),
      memo: String(row[5] ?? '').trim()
    }));
}

/** 스코어보드 엑셀에서 기대하는 시트 이름 (정확히 일치해야 함). raw4·raw5 없으면 해당 항목은 빈 배열 */
export const SCOREBOARD_SHEET_NAMES = {
  sales: 'raw1 (매출)',
  settlements: 'raw2(정산)',
  purchases: 'raw3(매입)',
  adSpends: 'raw4(광고비)',
  inventory: 'raw5(재고)'
} as const;

/** 파싱 검증 결과: 시트 존재 여부, 행 수, 샘플 행 */
export type ParseValidation = {
  sheetNamesInFile: string[];
  sales: { exists: boolean; rawRows: number; parsedCount: number; sample: Record<string, unknown> | null };
  settlements: { exists: boolean; rawRows: number; parsedCount: number; sample: Record<string, unknown> | null };
  purchases: { exists: boolean; rawRows: number; parsedCount: number; sample: Record<string, unknown> | null };
  adSpends: { exists: boolean; rawRows: number; parsedCount: number; sample: Record<string, unknown> | null };
  inventory: { exists: boolean; rawRows: number; parsedCount: number; sample: Record<string, unknown> | null };
  columnSpec: string;
};

function firstRowAsSample(rows: unknown[][], maxCol: number): Record<string, unknown> | null {
  const row = rows[2]; // 데이터 1행 (0,1=헤더, 2=첫 데이터)
  if (!row || !Array.isArray(row)) return null;
  const out: Record<string, unknown> = {};
  for (let i = 0; i < maxCol; i++) out[`col${i}`] = row[i] ?? null;
  return out;
}

export function validateScoreboardBuffer(buffer: ArrayBuffer): { data: ScoreboardData; validation: ParseValidation } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNamesInFile = workbook.SheetNames;

  const salesRows = sheetRows(workbook, SCOREBOARD_SHEET_NAMES.sales);
  const settlementRows = sheetRows(workbook, SCOREBOARD_SHEET_NAMES.settlements);
  const purchaseRows = sheetRows(workbook, SCOREBOARD_SHEET_NAMES.purchases);

  const sales = normalizeSales(salesRows);
  const settlements = normalizeSettlements(settlementRows);
  const purchases = normalizePurchases(purchaseRows);

  const adSpendRows = sheetRows(workbook, SCOREBOARD_SHEET_NAMES.adSpends);
  const inventoryRows = sheetRows(workbook, SCOREBOARD_SHEET_NAMES.inventory);
  let adSpends = normalizeAdSpends(adSpendRows);
  if (adSpends.length === 0 && sheetNamesInFile.includes(SPEND_SHEET_NAME)) {
    const spendRows = sheetRows(workbook, SPEND_SHEET_NAME);
    adSpends = normalizeAdSpendsFromSpendSheet(spendRows, detectYearFromSheetNames(sheetNamesInFile));
  }
  const inventoryPositions = normalizeInventory(inventoryRows);

  const validation: ParseValidation = {
    sheetNamesInFile,
    sales: {
      exists: sheetNamesInFile.includes(SCOREBOARD_SHEET_NAMES.sales),
      rawRows: salesRows.length,
      parsedCount: sales.length,
      sample: firstRowAsSample(salesRows, 20)
    },
    settlements: {
      exists: sheetNamesInFile.includes(SCOREBOARD_SHEET_NAMES.settlements),
      rawRows: settlementRows.length,
      parsedCount: settlements.length,
      sample: firstRowAsSample(settlementRows, 20)
    },
    purchases: {
      exists: sheetNamesInFile.includes(SCOREBOARD_SHEET_NAMES.purchases),
      rawRows: purchaseRows.length,
      parsedCount: purchases.length,
      sample: firstRowAsSample(purchaseRows, 15)
    },
    adSpends: {
      exists: sheetNamesInFile.includes(SCOREBOARD_SHEET_NAMES.adSpends),
      rawRows: adSpendRows.length,
      parsedCount: adSpends.length,
      sample: firstRowAsSample(adSpendRows, 6)
    },
    inventory: {
      exists: sheetNamesInFile.includes(SCOREBOARD_SHEET_NAMES.inventory),
      rawRows: inventoryRows.length,
      parsedCount: inventoryPositions.length,
      sample: firstRowAsSample(inventoryRows, 6)
    },
    columnSpec: '매출: [0]채널,[1]주문번호,[2]주문일,[6]상태,[9]상품명,[10]색상,[11]수량,[12]카테고리,[13]주소,[14]소비자가 | 정산: [0]파트너,[2]정산일,[3]정산ID,[5]상품명,[8]공급가,[9]수수료,[12]정산금액,[13]수량,[17]매칭,[18]취소유형 | 매입: [2]매입일,[5]수량,[6]공급가,[7]부가세포함 | 광고비: [0]채널,[1]미디어,[2]월,[3]금액,[4]비고 | 재고: [0]SKU키워드,[1]카테고리,[2]재고수량,[3]예약수량,[4]단가,[5]비고'
  };

  return {
    data: { sales, settlements, purchases, adSpends, inventoryPositions },
    validation
  };
}

/** LLS FY26 등에서 광고비가 들어 있는 비용 시트 이름. raw4(광고비) 없을 때 이 시트에서 광고・마케팅비 행을 파싱 */
export const SPEND_SHEET_NAME = 'spend';

export function parseScoreboardBuffer(buffer: ArrayBuffer): ScoreboardData {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sales = normalizeSales(sheetRows(workbook, SCOREBOARD_SHEET_NAMES.sales));
  const settlements = normalizeSettlements(sheetRows(workbook, SCOREBOARD_SHEET_NAMES.settlements));
  const purchases = normalizePurchases(sheetRows(workbook, SCOREBOARD_SHEET_NAMES.purchases));
  let adSpends = normalizeAdSpends(sheetRows(workbook, SCOREBOARD_SHEET_NAMES.adSpends));
  if (adSpends.length === 0 && workbook.SheetNames.includes(SPEND_SHEET_NAME)) {
    const spendRows = sheetRows(workbook, SPEND_SHEET_NAME);
    const year = detectYearFromSheetNames(workbook.SheetNames);
    adSpends = normalizeAdSpendsFromSpendSheet(spendRows, year);
  }
  const inventoryPositions = normalizeInventory(sheetRows(workbook, SCOREBOARD_SHEET_NAMES.inventory));
  return {
    sales,
    settlements,
    purchases,
    adSpends,
    inventoryPositions
  };
}

export async function parseScoreboardFile(file: File): Promise<ScoreboardData> {
  const buffer = await file.arrayBuffer();
  return parseScoreboardBuffer(buffer);
}
