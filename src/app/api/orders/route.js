import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// Serialize BigInt values
const serializeOrder = (order) => {
    return {
        ...order,
        id: Number(order.id),
        userId: order.userId ? Number(order.userId) : null,
        totalAmount: Number(order.totalAmount),
        items: order.items.map(item => ({
            ...item,
            id: Number(item.id),
            orderId: Number(item.orderId),
            productId: Number(item.productId),
            price: Number(item.price),
            product: item.product ? {
                ...item.product,
                id: Number(item.product.id),
                price: Number(item.product.price),
                seller_id: item.product.seller_id ? Number(item.product.seller_id) : null
            } : null
        }))
    }
}

// Получение всех заказов
export async function GET() {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Если админ - возвращаем все заказы, если нет - только заказы пользователя
        const orders = session.user.role === 'admin' 
            ? await db.getAllOrders()
            : await db.getUserOrders(session.user.id)

        return NextResponse.json(orders.map(serializeOrder))
    } catch (error) {
        console.error('Error getting orders:', error.message || 'Unknown error')
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Создание заказа
export async function POST(request) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const orderData = await request.json()
        
        if (!orderData?.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
            return NextResponse.json({ error: 'Invalid order data: items array is required' }, { status: 400 })
        }

        if (!orderData?.shipping_address) {
            return NextResponse.json({ error: 'Invalid order data: shipping_address is required' }, { status: 400 })
        }

        // Add payment information to the order data
        const paymentInfo = {
            payment_id: orderData.payment_id || null,
            paid: orderData.paid || false
        }

        const order = await db.createOrder(session.user.id, {
            ...orderData,
            ...paymentInfo
        })

        if (!order) {
            throw new Error('Failed to create order')
        }

        return NextResponse.json({ order: serializeOrder(order) })
    } catch (error) {
        const errorMessage = error.message || 'Unknown error'
        console.error('Error creating order:', errorMessage)
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}