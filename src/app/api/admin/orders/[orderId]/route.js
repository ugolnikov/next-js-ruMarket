import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const orderId = resolvedParams.orderId
        
        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        const order = await prisma.order.findUnique({
            where: { id: BigInt(orderId) },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                User: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        })
        
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }
        
        // Serialize the data
        const serializedOrder = {
            ...order,
            id: Number(order.id),
            userId: Number(order.userId),
            totalAmount: Number(order.totalAmount),
            User: order.User ? {
                ...order.User,
                id: Number(order.User.id)
            } : null,
            items: order.items.map(item => ({
                ...item,
                id: Number(item.id),
                order_id: Number(item.order_id),
                product_id: Number(item.product_id),
                price: Number(item.price),
                product: item.product ? {
                    ...item.product,
                    id: Number(item.product.id),
                    seller_id: Number(item.product.seller_id),
                    price: Number(item.product.price)
                } : null
            })),
            createdAt: order.createdAt?.toISOString(),
            updatedAt: order.updatedAt?.toISOString()
        }
        
        return NextResponse.json(serializedOrder)
    } catch (error) {
        console.error('Error fetching order:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const orderId = resolvedParams.orderId
        console.log('Received orderId:', orderId)
        
        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        const data = await request.json()
        
        // Only allow updating certain fields
        const { status, tracking_number, notes } = data
        
        // Create update data object with only defined values
        const updateData = {}
        if (status) updateData.status = status
        
        const order = await prisma.order.update({
            where: { id: BigInt(orderId) },
            data: updateData,
            include: {
                items: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })
        
        // Serialize the data
        const serializedOrder = {
            ...order,
            id: Number(order.id),
            userId: order.userId ? Number(order.userId) : null,
            totalAmount: Number(order.totalAmount),
            user: order.user ? {
                ...order.user,
                id: Number(order.user.id)
            } : null,
            items: order.items.map(item => ({
                ...item,
                id: Number(item.id),
                orderId: item.orderId ? Number(item.orderId) : null,
                productId: item.productId ? Number(item.productId) : null,
                price: Number(item.price)
            })),
            createdAt: order.createdAt?.toISOString(),
            updatedAt: order.updatedAt?.toISOString()
        }
        
        return NextResponse.json(serializedOrder)
    } catch (error) {
        console.error('Error updating order:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}