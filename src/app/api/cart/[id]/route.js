import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { db } from '@/lib/db'

// Обновление количества
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const cartId = parseInt(params.id)

    const cartItem = await prisma.cart.findUnique({
      where: { id: cartId }
    })

    if (!cartItem || cartItem.userId !== session.user.id) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    await prisma.cart.update({
      where: { id: cartId },
      data: { quantity: data.quantity }
    })

    return NextResponse.json({ message: 'Cart updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Удаление из корзины
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await db.removeFromCart(session.user.id, parseInt(params.id))
    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 