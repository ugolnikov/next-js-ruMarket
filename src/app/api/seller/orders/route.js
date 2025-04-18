import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// Сериализация заказа
const serializeOrder = (order) => {
    if (!order) return null
    return {
        ...order,
        id: Number(order.id),
        userId: order.userId ? Number(order.userId) : null,
        totalAmount: Number(order.totalAmount),
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

export async function GET(request) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Проверяем, что пользователь является продавцом
        if (session.user.role !== 'seller' && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Only sellers can access this endpoint' }, { status: 403 })
        }

        // Получаем заказы, содержащие товары продавца
        const orders = await prisma.order.findMany({
            where: {
                items: {
                    some: {
                        product: {
                            seller_id: session.user.id
                        }
                    }
                }
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Фильтруем элементы заказа, чтобы включать только товары этого продавца
        const filteredOrders = orders.map(order => ({
            ...order,
            items: order.items.filter(item => 
                item.product && BigInt(item.product.seller_id) === BigInt(session.user.id)
            )
        }))

        return NextResponse.json(filteredOrders.map(serializeOrder))
    } catch (error) {
        console.error('Error fetching seller orders:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}