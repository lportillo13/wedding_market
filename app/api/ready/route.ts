import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/requireAdmin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isR2Configured } from '@/lib/r2';

export const dynamic = 'force-dynamic';

/** Private dependency readiness; /api/health remains inexpensive liveness. */
export async function GET() {
  if (!await requireAdminUser()) return NextResponse.json({ error:'Unauthorized.' },{status:401});
  const admin = createSupabaseAdminClient();
  let database = false;
  if (admin) {
    try {
      const { error } = await admin.from('profiles').select('id',{head:true}).limit(0).abortSignal(AbortSignal.timeout(5000));
      database = !error;
    } catch { database = false; }
  }
  const storageConfigured = isR2Configured();
  const ready = database && storageConfigured;
  return NextResponse.json({status:ready?'ready':'degraded',database,storageConfigured},
    {status:ready?200:503,headers:{'Cache-Control':'no-store'}});
}
