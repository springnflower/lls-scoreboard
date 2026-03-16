/**
 * 스코어보드 대시보드용 엑셀 양식 생성
 * 실행: node scripts/generate-scoreboard-template.cjs
 * 출력: public/스코어보드_엑셀_양식.xlsx (또는 현재 디렉터리)
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const SHEET_NAMES = {
  sales: 'raw1 (매출)',
  settlements: 'raw2(정산)',
  purchases: 'raw3(매입)',
  adSpends: 'raw4(광고비)',
  inventory: 'raw5(재고)',
  inventoryMatrix: '재고량'
};

function addSheet(wb, name, rows, opts = {}) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  if (opts.colWidths) ws['!cols'] = opts.colWidths.map((w) => ({ wch: w }));
  wb.SheetNames.push(name);
  wb.Sheets[name] = ws;
}

function buildWorkbook() {
  const wb = { SheetNames: [], Sheets: {} };

  // ----- raw1 (매출): 1~2행 헤더, 3행부터 데이터. A=채널, B=주문번호, C=주문일, ... G=상태, ... J=상품명, K=색상, L=수량, M=카테고리, N=주소, O=소비자가
  const salesHeaders = [
    ['채널', '주문번호', '주문일', '', '', '', '상태', '', '', '상품명', '색상', '수량', '카테고리', '주소', '소비자가'],
    ['(필수)', '(필수)', 'YYYY-MM-DD', '', '', '', '배송완료 등', '', '', '(필수)', '', '', '3PORT 등', '', '금액']
  ];
  const salesData = [
    ['네이버', 'ORD001', '2025-01-15', '', '', '', '배송완료', '', '', '3-SOCKET', 'Black', 2, '3PORT', '서울시 강남구', 79800],
    ['쿠팡', 'ORD002', '2025-01-16', '', '', '', '배송완료', '', '', 'USB-C', 'Blue', 1, 'USB-C', '경기 성남시', 45000]
  ];
  addSheet(wb, SHEET_NAMES.sales, [...salesHeaders, ...salesData], { colWidths: [12, 14, 12, 6, 6, 6, 10, 6, 6, 14, 8, 8, 10, 18, 12] });

  // ----- raw2(정산): 1~2행 헤더. A=파트너, B=월, C=정산일, D=정산ID, E=거래유형, F=상품명, ... I=공급가, J=수수료, ... M=정산금액, N=수량, ... R=매칭, S=취소유형
  const settleHeaders = [
    ['파트너', '월', '정산일', '정산ID', '거래유형', '상품명', '', '', '공급가', '수수료', '', '', '정산금액', '수량', '', '', '', '매칭', '취소유형'],
    ['채널', '', 'YYYY-MM-DD', '(필수)', '', '(필수)', '', '', '', '', '', '', '(필수)', '', '', '', '', 'O/X', '']
  ];
  const settleData = [
    ['네이버', 1, '2025-02-05', 'ST001', '판매', '3-SOCKET', '', '', 35000, 3500, '', '', 31500, 2, '', '', '', 'O', ''],
    ['쿠팡', 1, '2025-02-06', 'ST002', '판매', 'USB-C', '', '', 22000, 2200, '', '', 19800, 1, '', '', '', 'O', '']
  ];
  addSheet(wb, SHEET_NAMES.settlements, [...settleHeaders, ...settleData], { colWidths: [12, 6, 12, 12, 10, 14, 6, 6, 10, 10, 6, 6, 12, 8, 6, 6, 6, 6, 6, 10] });

  // ----- raw3(매입): 1행 헤더. A=계정유형, B=회계연도, C=매입일, D=거래처, E=품목, F=수량, G=공급가, H=부가세포함, ... K=지급여부, L=비고
  const purchaseHeaders = [['계정유형', '회계연도', '매입일', '거래처', '품목', '수량', '공급가', '부가세포함', '', '', '지급여부', '비고']];
  const purchaseData = [
    ['매입', '2025', '2025-01-10', 'OO공장', '3-SOCKET', 100, 30000, 33000, '', '', true, ''],
    ['매입', '2025', '2025-01-12', 'OO전자', 'USB-C', 50, 20000, 22000, '', '', true, '']
  ];
  addSheet(wb, SHEET_NAMES.purchases, [...purchaseHeaders, ...purchaseData], { colWidths: [10, 10, 12, 14, 14, 8, 10, 12, 6, 6, 10, 12] });

  // ----- raw4(광고비): 1행 헤더. A=채널, B=미디어, C=월, D=금액, E=비고
  const adHeaders = [['채널', '미디어', '월(YYYY-MM)', '금액', '비고']];
  const adData = [
    ['네이버', '네이버검색', '2025-01', 500000, '1월 검색광고'],
    ['메타', '페이스북', '2025-01', 300000, '1월 SNS']
  ];
  addSheet(wb, SHEET_NAMES.adSpends, [...adHeaders, ...adData], { colWidths: [12, 14, 14, 12, 20] });

  // ----- raw5(재고): 1행 헤더. A=SKU키워드, B=카테고리, C=재고수량, D=예약수량, E=단가, F=비고 (재고량 시트 쓸 경우 비워두면 됨)
  const invHeaders = [['SKU키워드', '카테고리', '재고수량', '예약수량', '단가', '비고']];
  const invData = [
    ['3SOCKET Black', '3PORT', 100, 0, 38100, ''],
    ['USB-C Blue', 'USB-C', 50, 0, 22000, '']
  ];
  addSheet(wb, SHEET_NAMES.inventory, [...invHeaders, ...invData], { colWidths: [18, 10, 10, 10, 10, 16] });

  // ----- 재고량 (매트릭스): 1행 헤더. 분류, 색상, 3SOCKET, USB-C, CABLE, COLLABO. 분류=물류센터/본사/시딩/샘플 및 협찬, 색상=BK/BL/OR/GR
  const matrixHeaders = [['분류', '색상', '3SOCKET', 'USB-C', 'CABLE', 'COLLABO']];
  const matrixData = [
    ['물류센터', 'BK', 0, 0, 0, 0],
    ['물류센터', 'BL', 0, 0, 0, 0],
    ['물류센터', 'OR', 0, 0, 0, 0],
    ['물류센터', 'GR', 0, 0, 0, 0],
    ['본사', 'BK', 0, 0, 0, 0],
    ['본사', 'BL', 0, 0, 0, 0],
    ['본사', 'OR', 0, 0, 0, 0],
    ['본사', 'GR', 0, 0, 0, 0],
    ['시딩', 'BK', 0, 0, 0, 0],
    ['시딩', 'BL', 0, 0, 0, 0],
    ['시딩', 'OR', 0, 0, 0, 0],
    ['시딩', 'GR', 0, 0, 0, 0],
    ['샘플 및 협찬', 'BK', 0, 0, 0, 0],
    ['샘플 및 협찬', 'BL', 0, 0, 0, 0],
    ['샘플 및 협찬', 'OR', 0, 0, 0, 0],
    ['샘플 및 협찬', 'GR', 0, 0, 0, 0],
    ['합계', '', 0, 0, 0, 0]
  ];
  addSheet(wb, SHEET_NAMES.inventoryMatrix, [...matrixHeaders, ...matrixData], { colWidths: [14, 8, 10, 10, 10, 10] });

  return wb;
}

function main() {
  const wb = buildWorkbook();
  const outDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, '스코어보드_엑셀_양식.xlsx');
  XLSX.writeFile(wb, outPath, { bookType: 'xlsx', type: 'buffer' });
  console.log('생성 완료:', outPath);
}

main();
