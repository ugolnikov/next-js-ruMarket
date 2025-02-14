import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Получение информации о конкретном заказе
export async function GET(request, { params }) {
    const session = await getServerSession(authOptions)
    
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const order = await db.getOrderByNumber(params.id)
        
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        if (order.user_id !== session.user.id && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json(order)
    } catch (error) {
        console.error('Error getting order:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Обновление статуса заказа (только для админов)
export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions)
    
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { status } = await request.json()
        const order = await db.getOrderByNumber(params.id)
        
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Проверяем права на обновление статуса
        if (session.user.role !== 'admin' && 
            (status === 'shipped' || status === 'cancelled')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Покупатель может только подтвердить получение
        if (session.user.role === 'customer' && status !== 'completed') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const updatedOrder = await db.updateOrderStatus(order.id, status)
        return NextResponse.json(updatedOrder)
    } catch (error) {
        console.error('Error updating order:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
} 