import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Быстрый редирект неавторизованных. Настоящая проверка прав есть в самих страницах и actions.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  try {
    if (!token) throw new Error('no session');
    await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = { matcher: ['/cabinet/:path*', '/admin/:path*'] };
