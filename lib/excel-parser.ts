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

/** 시트 상단 몇 행에서 YYMM(2512, 2601 등) 컬럼 인덱스 → YYYY-MM 매핑 추출. 25→2025, 26→2026 */
function detectMonthColumns(rows: unknown[][]): Map<number, string> {
  const map = new Map<number, string>();
  for (let r = 0; r < Math.min(8, rows.length); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;
    for (let c = 0; c < Math.min(row.length, 50); c++) {
      const cell = String(row[c] ?? '').trim();
      const num = cell.replace(/,/g, '');
      const m = num.match(/^(25|26|24|27)(0[1-9]|1[0-2])$/);
      if (m) {
        const yyyy = '20' + m[1];
        const mm = m[2];
        map.set(c, `${yyyy}-${mm}`);
      }
    }
    if (map.size > 0) break;
  }
  return map;
}

/** SUMMARY 등 매트릭스: 행에 'M/TA 광고 소진비' 또는 '광고·마케팅비', 열에 2512/2511 등 월별 금액. 일자별(월별) 광고비를 광고비 내역으로 반영 */
function normalizeAdSpendsFromSummaryMatrix(rows: unknown[][]): AdSpendRow[] {
  const monthCols = detectMonthColumns(rows);
  if (monthCols.size === 0) return [];

  let foundRow = -1;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;
    const a = String(row[0] ?? '').trim();
    const b = String(row[1] ?? '').trim();
    const label = (a + ' ' + b).trim();
    if (/광고/.test(label) && (/소진비|마케팅비|소진/.test(label) || /M\/TA/.test(label))) {
      foundRow = r;
      break;
    }
    if (/광고\s*·\s*마케팅비|광고·마케팅비/.test(a) || /광고\s*·\s*마케팅비|광고·마케팅비/.test(b)) {
      foundRow = r;
      break;
    }
  }
  if (foundRow < 0) return [];

  const dataRow = rows[foundRow];
  if (!Array.isArray(dataRow)) return [];

  const out: AdSpendRow[] = [];
  const channel = '전체';
  const media = 'M/TA 광고 소진비';
  for (const [colIndex, month] of monthCols.entries()) {
    const amount = toNumber(dataRow[colIndex]);
    if (amount <= 0) continue;
    out.push({ channel, media, month, spend: amount, memo: '' });
  }
  return out;
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

/** 시트 이름에서 YYMM 추출. 예: "2511_sales detail" -> "2025-11", "2512" -> "2025-12" */
function monthFromSheetName(sheetName: string): string | null {
  const t = String(sheetName).trim();
  const m = t.match(/^(25|26|24|27)(0[1-9]|1[0-2])/);
  if (!m) return null;
  return `20${m[1]}-${m[2]}`;
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

/** "2511_sales detail" 등 월별 시트: 'META 광고소요액', '광고소요액' 등 행을 찾아 일자별 숫자 합산 → 해당 월 광고비 (채널별 여러 건 가능) */
function adSpendsFromMonthSheet(rows: unknown[][], month: string): AdSpendRow[] {
  const out: AdSpendRow[] = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;
    const a = String(row[0] ?? '').trim();
    const b = String(row[1] ?? '').trim();
    const label = (a || b || '').trim();
    let channel = '전체';
    let media = '광고소요액';
    if (!/광고소요액|광고\s*소요액|광고\s*소진/.test(label)) continue;
    if (/META\s*광고소요액|META\s*광고\s*소요액/.test(label)) {
      channel = 'META';
      media = 'META 광고';
    } else if (/네이버\s*광고소요액|네이버\s*광고/.test(label)) {
      channel = '네이버';
      media = '네이버 광고';
    } else if (/카카오\s*광고/.test(label)) {
      channel = '카카오';
      media = '카카오 광고';
    }
    let sum = 0;
    for (let c = 1; c < row.length; c++) {
      sum += toNumber(row[c]);
    }
    if (sum > 0) out.push({ channel, media, month, spend: sum, memo: '' });
  }
  return out;
}

const COLOR_MATRIX: Record<string, string> = { BK: 'Black', BL: 'Blue', OR: 'Orange', GR: 'Green' };
const VALID_COLOR_CODES = new Set<string>(['BK', 'BL', 'OR', 'GR']);
/** 재고량이 아닌 분류(광고/물류/비용 시트 등) 제외용 */
const NON_INVENTORY_CLASSIFICATION = /광고|마케팅|물류비|물류\s*비|비용|계정과목|품목|spend|cost/i;
const PRODUCT_KEYS = ['3SOCKET', 'USB-C', 'CABLE', 'COLLABO'] as const;
const PRODUCT_CATEGORY: Record<string, string> = { '3SOCKET': '3PORT', 'USB-C': 'USB-C', 'CABLE': 'CABLE', 'COLLABO': 'COLLABO' };

/** 재고량 매트릭스에 쓸 시트: 재고량 > SUMMARY (F) 등 SUMMARY 포함 시트 순으로 탐색 */
function findInventoryMatrixSheetName(workbook: XLSX.WorkBook): string | null {
  const names = workbook.SheetNames;
  for (const name of names) {
    const t = String(name).replace(/\s+/g, ' ').trim();
    if (t === '재고량' || t.includes('재고량')) return name;
  }
  for (const name of names) {
    if (/SUMMARY/i.test(name)) return name;
  }
  return null;
}

/** 품목/제품명 문자열을 재고 매트릭스 제품 키(3SOCKET, USB-C, CABLE, COLLABO)로 매핑 */
function productKeyFromKeyword(keyword: string): string | null {
  const k = keyword.toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
  if (/3SOCKET|3PORT/.test(k)) return '3SOCKET';
  if (/USBC|USB-C/.test(k)) return 'USB-C';
  if (/CABLE/.test(k)) return 'CABLE';
  if (/COLLABO/.test(k)) return 'COLLABO';
  return null;
}

/** production cost 시트에서 제품별 단가 추출. 키: 3SOCKET, USB-C, CABLE, COLLABO */
function parseProductionCostFromWorkbook(workbook: XLSX.WorkBook): Record<string, number> {
  const costByProduct: Record<string, number> = {};
  for (const name of workbook.SheetNames) {
    if (!/production\s*cost|원가|제조비/i.test(name)) continue;
    const rows = sheetRows(workbook, name);
    let costCol = -1;
    let keywordCol = 0;
    for (let r = 0; r < Math.min(15, rows.length); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c] ?? '').trim().toLowerCase();
        if (/단가|unit\s*cost|원가|cost|소비자가/.test(cell)) costCol = c;
        if (/품목|제품|keyword|상품|품명/.test(cell)) keywordCol = c;
      }
      if (costCol >= 0) break;
    }
    if (costCol < 0) costCol = 1;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      const keyword = String(row[keywordCol] ?? row[0] ?? '').trim();
      const cost = toNumber(row[costCol] ?? (costCol === 1 ? row[1] : row[costCol]));
      if (cost <= 0) continue;
      const key = productKeyFromKeyword(keyword);
      if (key) costByProduct[key] = cost;
    }
    if (Object.keys(costByProduct).length > 0) break;
  }
  return costByProduct;
}

/**
 * 헤더 행에서 색상 컬럼·제품 컬럼 찾기. '색상'/'색'/COLOR 인식. 없으면 데이터 행에서 BK/BL/OR/GR 비율로 색상 컬럼 추정.
 */
function detectMatrixColumns(rows: unknown[][]): { colorCol: number; productCols: { key: string; category: string; colIndex: number }[] } {
  const defaultColorCol = 1;
  const defaultProductCols = [
    { key: '3SOCKET', category: '3PORT', colIndex: 2 },
    { key: 'USB-C', category: 'USB-C', colIndex: 3 },
    { key: 'CABLE', category: 'CABLE', colIndex: 4 },
    { key: 'COLLABO', category: 'COLLABO', colIndex: 5 }
  ];
  for (let r = 0; r < Math.min(15, rows.length); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;
    let colorCol = -1;
    const byKey = new Map<string, { key: string; category: string; colIndex: number }>();
    for (let c = 0; c < row.length; c++) {
      const raw = String(row[c] ?? '').trim();
      const cell = raw.toUpperCase().replace(/\s+/g, '');
      if (cell === '색상' || cell === 'COLOR' || cell === '색' || (raw.length <= 4 && raw.includes('색'))) colorCol = c;
      for (const key of PRODUCT_KEYS) {
        if (byKey.has(key)) continue;
        const keyNorm = key.replace(/-/g, '').replace(/\s+/g, '');
        if (cell.includes(key) || cell.includes(keyNorm)) byKey.set(key, { key, category: PRODUCT_CATEGORY[key] ?? key, colIndex: c });
      }
    }
    const productCols = Array.from(byKey.values());
    if (colorCol >= 0 && productCols.length >= 2) {
      return { colorCol, productCols };
    }
  }
  const inferred = inferColorColumnFromData(rows);
  const colorCol = inferred != null ? inferred : defaultColorCol;
  const productCols = [
    { key: '3SOCKET', category: '3PORT', colIndex: colorCol + 1 },
    { key: 'USB-C', category: 'USB-C', colIndex: colorCol + 2 },
    { key: 'CABLE', category: 'CABLE', colIndex: colorCol + 3 },
    { key: 'COLLABO', category: 'COLLABO', colIndex: colorCol + 4 }
  ];
  return { colorCol, productCols };
}

/** 헤더를 못 찾았을 때: 데이터 행에서 BK/BL/OR/GR가 가장 많이 나오는 컬럼을 색상 컬럼으로 추정 */
function inferColorColumnFromData(rows: unknown[][]): number | null {
  let bestCol = -1;
  let bestCount = 0;
  for (let c = 0; c <= 5; c++) {
    let count = 0;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      const val = String(row[c] ?? '').trim().toUpperCase();
      if (VALID_COLOR_CODES.has(val)) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestCol = c;
    }
  }
  return bestCount >= 2 ? bestCol : null;
}

/**
 * 재고량/SUMMARY(F) 매트릭스: 분류·색상(BK/BL/OR/GR)·제품별 수량 합산.
 * unitCostByProduct 있으면 제품별 원가 적용해 재고자산 산정.
 */
function normalizeInventoryFromMatrix(rows: unknown[][], unitCostByProduct?: Record<string, number>): InventoryPositionRow[] {
  const sumByKey = new Map<string, number>();
  const toQty = (v: unknown) => Math.max(0, toNumber(v));
  const { colorCol, productCols } = detectMatrixColumns(rows);
  const classificationCol = Math.max(0, colorCol - 1);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const classification = String(row[classificationCol] ?? '').trim();
    const colorCode = String(row[colorCol] ?? '').trim().toUpperCase();
    if (classification === '분류' || classification === '합계' || !colorCode) continue;
    if (!VALID_COLOR_CODES.has(colorCode)) continue;
    if (NON_INVENTORY_CLASSIFICATION.test(classification)) continue;
    const colorFull = COLOR_MATRIX[colorCode];
    for (const p of productCols) {
      const qty = toQty(row[p.colIndex]);
      if (qty <= 0) continue;
      const key = `${p.key}|${colorFull}`;
      sumByKey.set(key, (sumByKey.get(key) ?? 0) + qty);
    }
  }

  const out: InventoryPositionRow[] = [];
  for (const [key, qty] of sumByKey.entries()) {
    if (qty <= 0) continue;
    const [productKey, colorFull] = key.split('|');
    const p = productCols.find((x) => x.key === productKey);
    const unitCost = unitCostByProduct?.[productKey] ?? unitCostByProduct?.[p?.category ?? ''] ?? 0;
    out.push({
      skuKeyword: `${productKey} ${colorFull}`,
      category: p?.category ?? productKey,
      onHandQty: qty,
      reservedQty: 0,
      unitCost,
      memo: unitCostByProduct && unitCost > 0 ? 'production cost 반영' : '재고량 시트'
    });
  }
  return out;
}

/** 재고 시트(raw5): [0]SKU키워드 [1]카테고리 [2]재고수량 [3]예약수량 [4]단가 [5]비고. 광고/물류비 등 비재고 행 제외. */
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
    }))
    .filter((row) => !NON_INVENTORY_CLASSIFICATION.test(row.skuKeyword) && !NON_INVENTORY_CLASSIFICATION.test(row.category));
}

/** 재고량 매트릭스 시트(분류·색상·제품별). 있으면 raw5 대신 재고로 사용 */
export const INVENTORY_MATRIX_SHEET_NAME = '재고량';

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
  inventory: { exists: boolean; rawRows: number; parsedCount: number; sample: Record<string, unknown> | null; source?: '재고량' | 'raw5(재고)' };
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

  const adSpendSheetNameForValidation = findAdSpendSheetName(sheetNamesInFile) ?? SCOREBOARD_SHEET_NAMES.adSpends;
  const adSpendRows = sheetRows(workbook, adSpendSheetNameForValidation);
  const inventoryRows = sheetRows(workbook, SCOREBOARD_SHEET_NAMES.inventory);
  let adSpends = normalizeAdSpends(adSpendRows);
  if (adSpends.length === 0 && sheetNamesInFile.includes(SPEND_SHEET_NAME)) {
    const spendRows = sheetRows(workbook, SPEND_SHEET_NAME);
    adSpends = normalizeAdSpendsFromSpendSheet(spendRows, detectYearFromSheetNames(sheetNamesInFile));
  }
  if (adSpends.length === 0) {
    for (const name of sheetNamesInFile) {
      const summaryRows = sheetRows(workbook, name);
      const fromSummary = normalizeAdSpendsFromSummaryMatrix(summaryRows);
      if (fromSummary.length > 0) {
        adSpends = fromSummary;
        break;
      }
    }
  }
  if (adSpends.length === 0) {
    for (const name of sheetNamesInFile) {
      const month = monthFromSheetName(name);
      if (!month) continue;
      const rows = sheetRows(workbook, name);
      const fromMonth = adSpendsFromMonthSheet(rows, month);
      adSpends.push(...fromMonth);
    }
  }
  let inventoryPositions: InventoryPositionRow[];
  let inventorySource: '재고량' | 'raw5(재고)' = 'raw5(재고)';
  const costMap = parseProductionCostFromWorkbook(workbook);
  const matrixSheetName = findInventoryMatrixSheetName(workbook);
  if (matrixSheetName) {
    const matrixRows = sheetRows(workbook, matrixSheetName);
    const fromMatrix = normalizeInventoryFromMatrix(matrixRows, costMap);
    if (fromMatrix.length > 0) {
      inventoryPositions = fromMatrix;
      inventorySource = '재고량';
    } else {
      inventoryPositions = normalizeInventory(inventoryRows);
    }
  } else {
    inventoryPositions = normalizeInventory(inventoryRows);
  }

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
      exists: !!findAdSpendSheetName(sheetNamesInFile) || sheetNamesInFile.includes(SPEND_SHEET_NAME),
      rawRows: adSpendRows.length,
      parsedCount: adSpends.length,
      sample: firstRowAsSample(adSpendRows, 6)
    },
    inventory: {
      exists: sheetNamesInFile.includes(SCOREBOARD_SHEET_NAMES.inventory) || !!matrixSheetName,
      rawRows: matrixSheetName ? sheetRows(workbook, matrixSheetName).length : inventoryRows.length,
      parsedCount: inventoryPositions.length,
      sample: firstRowAsSample(inventoryRows, 6),
      source: inventorySource
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

/** raw4(광고비) 또는 raw4 (광고비) 등 공백/괄호 변형 시트명 찾기 */
function findAdSpendSheetName(sheetNames: string[]): string | null {
  const exact = SCOREBOARD_SHEET_NAMES.adSpends;
  if (sheetNames.includes(exact)) return exact;
  const found = sheetNames.find((n) => /raw4\s*\(?\s*광고비\s*\)?/.test(n.trim()));
  return found ?? null;
}

export function parseScoreboardBuffer(buffer: ArrayBuffer): ScoreboardData {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNamesInFile = workbook.SheetNames;
  const sales = normalizeSales(sheetRows(workbook, SCOREBOARD_SHEET_NAMES.sales));
  const settlements = normalizeSettlements(sheetRows(workbook, SCOREBOARD_SHEET_NAMES.settlements));
  const purchases = normalizePurchases(sheetRows(workbook, SCOREBOARD_SHEET_NAMES.purchases));
  const adSpendSheetName = findAdSpendSheetName(sheetNamesInFile) ?? SCOREBOARD_SHEET_NAMES.adSpends;
  let adSpends = normalizeAdSpends(sheetRows(workbook, adSpendSheetName));
  if (adSpends.length === 0 && sheetNamesInFile.includes(SPEND_SHEET_NAME)) {
    const spendRows = sheetRows(workbook, SPEND_SHEET_NAME);
    const year = detectYearFromSheetNames(sheetNamesInFile);
    adSpends = normalizeAdSpendsFromSpendSheet(spendRows, year);
  }
  if (adSpends.length === 0) {
    for (const name of sheetNamesInFile) {
      const summaryRows = sheetRows(workbook, name);
      const fromSummary = normalizeAdSpendsFromSummaryMatrix(summaryRows);
      if (fromSummary.length > 0) {
        adSpends = fromSummary;
        break;
      }
    }
  }
  if (adSpends.length === 0) {
    for (const name of sheetNamesInFile) {
      const month = monthFromSheetName(name);
      if (!month) continue;
      const rows = sheetRows(workbook, name);
      adSpends.push(...adSpendsFromMonthSheet(rows, month));
    }
  }
  const inventoryRows = sheetRows(workbook, SCOREBOARD_SHEET_NAMES.inventory);
  let inventoryPositions: InventoryPositionRow[];
  const costMap = parseProductionCostFromWorkbook(workbook);
  const matrixSheetName = findInventoryMatrixSheetName(workbook);
  if (matrixSheetName) {
    const fromMatrix = normalizeInventoryFromMatrix(sheetRows(workbook, matrixSheetName), costMap);
    inventoryPositions = fromMatrix.length > 0 ? fromMatrix : normalizeInventory(inventoryRows);
  } else {
    inventoryPositions = normalizeInventory(inventoryRows);
  }
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

/**
 * 엑셀 내 commission 시트(이름에 "commission" 포함)에서 입점처/채널별 수수료율(%) 파싱.
 * 반환: 채널명(키) -> 수수료율 0~1 (예: 15% -> 0.15)
 */
export function parseCommissionRatesFromBuffer(buffer: ArrayBuffer): Record<string, number> {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const out: Record<string, number> = {};

  for (const sheetName of workbook.SheetNames) {
    if (!/commission/i.test(sheetName)) continue;
    const rows = sheetRows(workbook, sheetName);
    if (rows.length < 2) continue;

    let channelCol = -1;
    let rateCol = -1;
    let dataStartRow = 0;

    for (let r = 0; r < Math.min(15, rows.length); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c] ?? '').trim().toLowerCase();
        if (/채널|입점처|파트너|channel|store|매장/.test(cell)) channelCol = c;
        if (/수수료|%|rate|commission|수수료율|비율/.test(cell) || (cell.endsWith('%') && cell.length <= 6)) rateCol = c;
      }
      if (channelCol >= 0 && rateCol >= 0) {
        dataStartRow = r + 1;
        break;
      }
    }

    if (channelCol < 0) channelCol = 0;
    if (rateCol < 0) rateCol = channelCol + 1;
    if (dataStartRow >= rows.length) continue;

    for (let r = dataStartRow; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      const channel = String(row[channelCol] ?? '').trim();
      if (!channel) continue;
      const rawRate = row[rateCol];
      let rate = toNumber(rawRate);
      if (rate > 1) rate = rate / 100;
      if (rate < 0 || rate > 1) rate = 0;
      out[channel] = rate;
    }
  }

  return out;
}

/** 재고 전용: 엑셀에서 재고량/SUMMARY(F) 시트 + production cost 시트 파싱. 재고수량·제품별 원가로 재고자산 산정 */
export function parseInventoryFromBuffer(buffer: ArrayBuffer): InventoryPositionRow[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const names = workbook.SheetNames;
  const costMap = parseProductionCostFromWorkbook(workbook);

  const matrixSheetName = findInventoryMatrixSheetName(workbook);
  if (matrixSheetName) {
    const fromMatrix = normalizeInventoryFromMatrix(sheetRows(workbook, matrixSheetName), costMap);
    if (fromMatrix.length > 0) return fromMatrix;
  }

  const raw5Rows = sheetRows(workbook, SCOREBOARD_SHEET_NAMES.inventory);
  if (raw5Rows.length > 0) {
    const fromRaw5 = normalizeInventory(raw5Rows);
    if (fromRaw5.length > 0) return fromRaw5;
  }

  for (const name of names) {
    const rows = sheetRows(workbook, name);
    if (rows.length < 2) continue;
    const fromMatrix = normalizeInventoryFromMatrix(rows, costMap);
    if (fromMatrix.length > 0) return fromMatrix;
  }

  return [];
}
