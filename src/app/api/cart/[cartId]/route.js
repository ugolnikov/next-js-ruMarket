import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// Обновление количества
export async function PUT(request, { params }) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { quantity } = await request.json()
    const id = params.id
    
    if (quantity < 1) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })
    }

    const cartItem = await db.updateCartItemQuantity(session.user.id, parseInt(id), quantity)
    return NextResponse.json(cartItem)
  } catch (error) {
    console.error('Error updating cart item:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Удаление из корзины
async function DELETE(request, { params }) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fix: Await params before accessing cartId
    const resolvedParams = await params
    const cartId = resolvedParams.cartId
    
    if (!cartId) {
      return NextResponse.json({ error: 'Cart item ID is required' }, { status: 400 })
    }

    await prisma.cart_items.delete({
      where: {
        id: parseInt(cartId),
        user_id: session.user.id
      }
    })

    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error) {
    console.error('Error removing from cart:', error.message || 'Unknown error')
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 })
  }
}

export { DELETE }
export async function PATCH(request, { params }) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { quantity } = await request.json()
    const id = params.id
    
    if (quantity < 1) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })
    }

    const cartItem = await db.updateCartItemQuantity(session.user.id, parseInt(id), quantity)
    return NextResponse.json(cartItem)
  } catch (error) {
    console.error('Error updating cart item:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}