/**
 * 스프레드시트/엑셀 URL에서 워크북 바이너리를 가져옵니다.
 * - Google Sheets: 편집 URL을 export?format=xlsx URL로 변환 후 다운로드 (공개 링크여야 함)
 * - 기타: https URL이 .xlsx/.xls 파일을 반환하면 그대로 사용
 */

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const FETCH_TIMEOUT_MS = 60_000;

function toExportUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('google.com')) return null;
    // docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit ...
    const m = u.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (!m) return null;
    const id = m[1];
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;
  } catch {
    return null;
  }
}

/**
 * @param url Google Sheets 편집 URL 또는 .xlsx/.xls 직접 다운로드 URL
 * @returns { buffer, fileName } 또는 에러 시 throw
 */
export async function fetchWorkbookFromUrl(url: string): Promise<{ buffer: ArrayBuffer; fileName: string }> {
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://')) {
    throw new Error('https URL만 지원합니다.');
  }

  const fetchUrl = toExportUrl(trimmed) ?? trimmed;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(fetchUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'LLS-Scoreboard-Import/1.0' }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      if (fetchUrl.includes('google.com')) {
        if (res.status === 401) {
          throw new Error(
            'Google 스프레드시트가 비공개이거나, "링크가 있는 모든 사용자에게 공개"로 설정되지 않았습니다. ' +
            '스프레드시트에서 [공유] → [일반 액세스]를 "링크가 있는 모든 사용자"로 바꾼 뒤 다시 시도해 주세요.'
          );
        }
        if (res.status === 403) {
          throw new Error(
            'Google 스프레드시트가 "링크가 있는 모든 사용자에게 공개"로 설정되어 있는지 확인해 주세요.'
          );
        }
      }
      throw new Error(`다운로드 실패: ${res.status} ${res.statusText}`);
    }

    const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
    if (contentType.includes('text/html')) {
      throw new Error(
        '서버가 엑셀 파일 대신 HTML을 반환했습니다. Google 스프레드시트라면 "링크가 있는 모든 사용자에게 공개"로 설정해 주세요.'
      );
    }

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE_BYTES) {
      throw new Error(`파일 크기가 제한(20MB)을 초과합니다.`);
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_SIZE_BYTES) {
      throw new Error(`파일 크기가 제한(20MB)을 초과합니다.`);
    }

    let fileName = 'scoreboard.xlsx';
    const disposition = res.headers.get('content-disposition');
    if (disposition) {
      const m = disposition.match(/filename[*]?=(?:UTF-8'')?["']?([^"'\s]+)/i);
      if (m) fileName = m[1].trim();
    }
    if (!/\.(xlsx|xls)$/i.test(fileName)) {
      fileName = fetchUrl.includes('google.com') ? 'google-sheets-export.xlsx' : 'scoreboard.xlsx';
    }

    return { buffer, fileName };
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error) {
      if (e.name === 'AbortError') throw new Error('요청 시간이 초과되었습니다.');
      throw e;
    }
    throw new Error(String(e));
  }
}
