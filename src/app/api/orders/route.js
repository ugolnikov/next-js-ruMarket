import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Получение списка заказов пользователя
export async function GET(request) {
    const session = await getServerSession(authOptions)
    
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const orders = await db.getUserOrders(session.user.id)
        return NextResponse.json(orders || [])
    } catch (error) {
        console.error('Error getting orders:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Создание нового заказа
export async function POST(request) {
    const session = await getServerSession(authOptions)
    
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const orderData = await request.json()
        
        if (!orderData.items || !orderData.shipping_address) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Валидация данных
        if (!orderData.shipping_address.fullName || 
            !orderData.shipping_address.email || 
            !orderData.shipping_address.phone || 
            !orderData.shipping_address.address) {
            return NextResponse.json(
                { error: 'Missing shipping address fields' },
                { status: 400 }
            )
        }

        const order = await db.createOrder(session.user.id, orderData)
        return NextResponse.json({ orders: [order] }, { status: 201 })
    } catch (error) {
        console.error('Error creating order:', error)
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        )
    }
} 