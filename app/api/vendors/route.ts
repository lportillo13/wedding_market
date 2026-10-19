import { NextResponse } from 'next/server';
import { searchVendorDirectory } from '@/lib/vendor-directory';

export async function GET(request: Request) {
  try {
    const params=Object.fromEntries(new URL(request.url).searchParams);
    return NextResponse.json(await searchVendorDirectory(params),{
      headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=60'},
    });
  } catch {
    return NextResponse.json({items:[],total:0,error:'The vendor directory is temporarily unavailable.'},
      {status:503,headers:{'Cache-Control':'no-store'}});
  }
}
