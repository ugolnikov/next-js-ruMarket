import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Получение корзины
export async function GET(request) {
    const session = await getServerSession(authOptions)
    
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const cart = await db.getCart(session.user.id)
        return NextResponse.json(cart)
    } catch (error) {
        console.error('Error getting cart:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Добавление в корзину
export async function POST(request) {
    const session = await getServerSession(authOptions)
    
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { product_id, quantity } = await request.json()
        
        if (!product_id) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        const cartItems = await db.addToCart(session.user.id, parseInt(product_id), quantity || 1)
        return NextResponse.json(cartItems)
    } catch (error) {
        console.error('Error adding to cart:', error)
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error' 
        }, { status: 500 })
    }
}

// Очистка корзины
export async function DELETE(request) {
    const session = await getServerSession(authOptions)
    
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await db.clearCart(session.user.id)
        return NextResponse.json({ message: 'Cart cleared successfully' })
    } catch (error) {
        console.error('Error clearing cart:', error)
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error' 
        }, { status: 500 })
    }
} 