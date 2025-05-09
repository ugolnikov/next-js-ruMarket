import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// Serialize BigInt values
const serializeOrder = (order) => {
    if (!order) return null
    return {
        ...order,
        id: Number(order.id),
        userId: order.userId ? Number(order.userId) : null,
        totalAmount: Number(order.totalAmount),
        payment_id: order.payment_id || null,
        paid: order.paid || false,
        createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
        updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
        items: order.items.map(item => ({
            ...item,
            id: Number(item.id),
            orderId: Number(item.orderId),
            productId: Number(item.productId),
            price: Number(item.price),
            createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
            updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
            product: item.product ? {
                ...item.product,
                id: Number(item.product.id),
                price: Number(item.product.price),
                seller_id: item.product.seller_id ? Number(item.product.seller_id) : null,
                createdAt: item.product.createdAt ? new Date(item.product.createdAt).toISOString() : null,
                updatedAt: item.product.updatedAt ? new Date(item.product.updatedAt).toISOString() : null
            } : null
        }))
    }
}

// Получение заказа
export async function GET(request, context) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get and validate the order number from params
        const params = await context.params
        const orderNumber = params.orderNumber
        if (!orderNumber) {
            return NextResponse.json({ error: 'Order number is required' }, { status: 400 })
        }

        // Get order by order number
        const order = await db.getOrder(orderNumber)

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Check if user has access to this order
        const userId = BigInt(session.user.id)
        if (session.user.role !== 'admin' && order.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const serializedOrder = serializeOrder(order)
        return NextResponse.json(serializedOrder)
    } catch (error) {
        console.error('Error fetching order:', error.message || error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Обновление статуса заказа
export async function PUT(request, context) {
    try {
        const session = await auth()
        
        if (!session?.user?.id || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get and validate the order number from params
        const params = await context.params
        const orderNumber = params.orderNumber
        if (!orderNumber) {
            return NextResponse.json({ error: 'Order number is required' }, { status: 400 })
        }

        const data = await request.json()
        const order = await db.getOrder(orderNumber)
        
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const updatedOrder = await db.updateOrder(orderNumber, data)
        return NextResponse.json(serializeOrder(updatedOrder))
    } catch (error) {
        console.error('Error updating order:', error.message || error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}