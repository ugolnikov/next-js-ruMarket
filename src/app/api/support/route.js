import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req) {
  const { name, email, message } = await req.json()

  try {
    await prisma.supportTicket.create({
      data: {
        name,
        email,
        message,
        status: 'open',
      },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
} 