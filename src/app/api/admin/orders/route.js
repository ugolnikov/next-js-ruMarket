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
        
        // Serialize the data
        const serializedOrders = orders.map(order => ({
            ...order,
            id: Number(order.id),
            userId: order.userId ? Number(order.userId) : null,
            total_amount: Number(order.total_amount),
            user: order.user ? {
                ...order.user,
                id: Number(order.user.id)
            } : null,
            items: order.items.map(item => ({
                ...item,
                id: Number(item.id),
                orderId: item.orderId ? Number(item.orderId) : null,
                productId: item.productId ? Number(item.productId) : null,
                price: Number(item.price),
                product: item.product ? {
                    ...item.product,
                    id: Number(item.product.id),
                    seller_id: item.product.seller_id ? Number(item.product.seller_id) : null,
                    price: Number(item.product.price)
                } : null
            })),
            createdAt: order.createdAt?.toISOString(),
            updatedAt: order.updatedAt?.toISOString()
        }))
        
        return NextResponse.json(serializedOrders)
    } catch (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}