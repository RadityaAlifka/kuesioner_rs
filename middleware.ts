// file: middleware.ts

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // --- MULAI BLOK DEBUG ---
  console.log('--- Middleware Dijalankan ---');
  console.log('URL Supabase terbaca:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Ada' : '❌ Kosong');
  console.log('Anon Key Supabase terbaca:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Ada' : '❌ Kosong');
  // --- AKHIR BLOK DEBUG ---

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // --- BLOK DEBUG TAMBAHAN ---
  if (session) {
    console.log('✅ Sesi ditemukan untuk:', session.user.email);
  } else {
    console.log('❌ Tidak ada sesi yang ditemukan oleh middleware.');
  }
  console.log('--------------------------\n');
  // --- AKHIR BLOK DEBUG TAMBAHAN ---

  if (!session && req.nextUrl.pathname.startsWith('/admin/dashboard')) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
  
  if (session && req.nextUrl.pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/login'],
}