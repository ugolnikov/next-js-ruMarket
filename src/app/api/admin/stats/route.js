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
        const orderStats = await prisma.order.aggregate({
            _count: {
                id: true
            },
            _sum: {
                total_amount: true
            }
        })
        
        // Get product count
        const productCount = await prisma.product.count()
        
        // Get recent orders
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                order_number: true,
                full_name: true,
                total_amount: true,
                status: true,
                createdAt: true
            }
        })
        
        // Get recent users
        const recentUsers = await prisma.user.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        })
        
        // Serialize the data
        const serializedOrders = recentOrders.map(order => ({
            ...order,
            id: Number(order.id),
            totalAmount: Number(order.total_amount),
            createdAt: order.createdAt?.toISOString()
        }))
        
        const serializedUsers = recentUsers.map(user => ({
            ...user,
            id: Number(user.id),
            createdAt: user.createdAt?.toISOString()
        }))
        
        return NextResponse.json({
            userCount,
            orderCount: orderStats._count.id,
            totalRevenue: Number(orderStats._sum.total_amount || 0),
            productCount,
            recentOrders: serializedOrders,
            recentUsers: serializedUsers
        })
    } catch (error) {
        console.error('Error fetching admin stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}