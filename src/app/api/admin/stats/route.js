import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request) {
    try {
        const session = await auth()
        console.log(session)
        if (!session?.user?.id || session?.user?.is_admin !== true) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user count
        const userCount = await prisma.user.count()
        
        // Get order count
        const orderCount = await prisma.order.count()
        
        // Get product count
        const productCount = await prisma.product.count()
        
        // Get total revenue
        const revenueResult = await prisma.order.aggregate({
            _sum: {
                totalAmount: true
            }
        })
        const totalRevenue = revenueResult._sum.totalAmount || 0
        
        // Get recent orders
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
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
            id: Number(order.id),
            orderNumber: order.orderNumber,
            fullName: order.fullName,
            totalAmount: Number(order.totalAmount),
            status: order.status,
            createdAt: order.createdAt?.toISOString(),
            user: order.user
        }))
        
        const serializedUsers = recentUsers.map(user => ({
            id: Number(user.id),
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt?.toISOString()
        }))
        
        return NextResponse.json({
            userCount,
            orderCount,
            productCount,
            totalRevenue: Number(totalRevenue),
            recentOrders: serializedOrders,
            recentUsers: serializedUsers
        })
    } catch (error) {
        console.error('Error fetching admin stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}