import { NextResponse } from 'next/server'

export async function GET(request) {
  return NextResponse.json({ 
    version: 'Next.js API v1'
  })
} 