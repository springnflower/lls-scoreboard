import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export async function persistUploadedWorkbook(fileName: string, bytes: Uint8Array) {
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  if (process.env.SUPABASE_STORAGE_BUCKET && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });
    const storagePath = `scoreboards/${safeName}`;
    const { error } = await supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET).upload(storagePath, bytes, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true
    });
    if (error) throw error;
    return { storagePath: `supabase://${process.env.SUPABASE_STORAGE_BUCKET}/${storagePath}` };
  }

  try {
    const uploadDir = path.join(process.cwd(), 'storage', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const absolutePath = path.join(uploadDir, safeName);
    await writeFile(absolutePath, bytes);
    return { storagePath: `local://storage/uploads/${safeName}` };
  } catch (e) {
    console.warn('[storage] 로컬 파일 저장 실패, storagePath 없이 진행:', e);
    return { storagePath: null };
  }
}
