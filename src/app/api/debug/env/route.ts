import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow in development or with special header
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev) {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    variables: {
      BASALAM_CLIENT_ID: process.env.BASALAM_CLIENT_ID ? 'SET' : 'MISSING',
      BASALAM_CLIENT_SECRET: process.env.BASALAM_CLIENT_SECRET ? 'SET' : 'MISSING',
      BASALAM_REDIRECT_URI: process.env.BASALAM_REDIRECT_URI ? 'SET' : 'MISSING',
      BASALAM_API_BASE_URL: process.env.BASALAM_API_BASE_URL ? 'SET' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
    },
    // Show actual values for debugging (only in dev)
    actualValues: {
      BASALAM_REDIRECT_URI: process.env.BASALAM_REDIRECT_URI,
      BASALAM_API_BASE_URL: process.env.BASALAM_API_BASE_URL,
    }
  });
}