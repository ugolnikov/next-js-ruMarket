import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET() {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const orders = await prisma.order.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })
        
        // Serialize the data - ensure all BigInt values are converted to Numbers
        const serializedOrders = orders.map(order => ({
            ...order,
            id: order.id ? Number(order.id) : null,
            userId: order.userId ? Number(order.userId) : null,
            totalAmount: order.totalAmount ? Number(order.totalAmount) : 0,
            user: order.user ? {
                ...order.user,
                id: order.user.id ? Number(order.user.id) : null
            } : null,
            items: order.items.map(item => ({
                ...item,
                id: item.id ? Number(item.id) : null,
                orderId: item.orderId ? Number(item.orderId) : null,
                productId: item.productId ? Number(item.productId) : null,
                price: item.price ? Number(item.price) : 0,
                product: item.product ? {
                    ...item.product,
                    id: item.product.id ? Number(item.product.id) : null,
                    seller_id: item.product.seller_id ? Number(item.product.seller_id) : null,
                    price: item.product.price ? Number(item.product.price) : 0
                } : null
            })),
            createdAt: order.createdAt ? order.createdAt.toISOString() : null,
            updatedAt: order.updatedAt ? order.updatedAt.toISOString() : null
        }))
        
        return NextResponse.json(serializedOrders)
    } catch (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}