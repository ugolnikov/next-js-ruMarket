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

        // Get user count
        const userCount = await prisma.user.count()
        
        // Get order count and total revenue
        // Fix: The aggregate query structure was incorrect
        const orderStats = await prisma.order.aggregate({
            _count: {
                id: true
            },
            _sum: {
                totalAmount: true
            }
        })
        
        // Get product count
        const productCount = await prisma.product.count()
        
        // Get recent orders
        const recentOrders = await prisma.order.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: 5,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })
        
        // Serialize the data
        const serializedOrders = recentOrders.map(order => ({
            ...order,
            id: Number(order.id),
            userId: order.userId ? Number(order.userId) : null,
            totalAmount: Number(order.totalAmount),
            createdAt: order.createdAt?.toISOString(),
            updatedAt: order.updatedAt?.toISOString(),
            user: order.user ? {
                ...order.user
            } : null
        }))
        
        return NextResponse.json({
            userCount,
            orderCount: orderStats._count.id,
            totalRevenue: Number(orderStats._sum.totalAmount || 0),
            productCount,
            recentOrders: serializedOrders
        })
    } catch (error) {
        console.error('Error fetching admin stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}