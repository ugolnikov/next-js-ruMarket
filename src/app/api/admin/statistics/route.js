import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request) {
    try {
        const session = await auth()
        
        if (!session?.user?.id || !session?.user?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const period = url.searchParams.get('period') || 'month'
        
        // Определяем даты для фильтрации
        const now = new Date()
        let startDate = new Date()
        let previousStartDate = new Date()
        
        switch (period) {
            case 'week':
                startDate.setDate(now.getDate() - 7)
                previousStartDate.setDate(startDate.getDate() - 7)
                break
            case 'month':
                startDate.setMonth(now.getMonth() - 1)
                previousStartDate.setMonth(startDate.getMonth() - 1)
                break
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1)
                previousStartDate.setFullYear(startDate.getFullYear() - 1)
                break
            default:
                startDate.setMonth(now.getMonth() - 1)
                previousStartDate.setMonth(startDate.getMonth() - 1)
        }
        
        // Получаем общую статистику по заказам
        const currentPeriodOrders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startDate
                }
            },
            include: {
                items: true
            }
        })
        
        const previousPeriodOrders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: previousStartDate,
                    lt: startDate
                }
            },
            include: {
                items: true
            }
        })
        
        // Рассчитываем общую выручку
        const totalRevenue = currentPeriodOrders.reduce((sum, order) => 
            sum + Number(order.total_amount), 0)
        
        const previousRevenue = previousPeriodOrders.reduce((sum, order) => 
            sum + Number(order.total_amount), 0)
        
        // Рассчитываем изменение выручки в процентах
        const revenueChange = previousRevenue === 0 
            ? 100 
            : Math.round((totalRevenue - previousRevenue) / previousRevenue * 100)
        
        // Рассчитываем средний чек
        const averageOrderValue = currentPeriodOrders.length === 0 
            ? 0 
            : Math.round(totalRevenue / currentPeriodOrders.length)
        
        const previousAOV = previousPeriodOrders.length === 0 
            ? 0 
            : Math.round(previousRevenue / previousPeriodOrders.length)
        
        // Рассчитываем изменение среднего чека в процентах
        const aovChange = previousAOV === 0 
            ? 100 
            : Math.round((averageOrderValue - previousAOV) / previousAOV * 100)
        
        // Получаем количество заказов
        const totalOrders = currentPeriodOrders.length
        
        // Рассчитываем изменение количества заказов в процентах
        const ordersChange = previousPeriodOrders.length === 0 
            ? 100 
            : Math.round((totalOrders - previousPeriodOrders.length) / previousPeriodOrders.length * 100)
        
        // Получаем новых пользователей
        const newUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: startDate
                }
            }
        })
        
        const previousNewUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: previousStartDate,
                    lt: startDate
                }
            }
        })
        
        // Рассчитываем изменение количества новых пользователей в процентах
        const usersChange = previousNewUsers === 0 
            ? 100 
            : Math.round((newUsers - previousNewUsers) / previousNewUsers * 100)
        
        // Получаем данные для графика продаж по дням
        const salesByDate = await getSalesByDate(period, startDate)
        
        // Получаем данные для графика заказов по дням
        const ordersByDate = await getOrdersByDate(period, startDate)
        
        // Получаем данные для графика товаров по категориям
        const productsByCategory = await getProductsByCategory()
        
        // Получаем топ товаров
        const topProducts = await getTopProducts(startDate)
        
        // Получаем последние заказы
        const recentOrders = await getRecentOrders()
        
        // Получаем новых пользователей
        const recentUsers = await getRecentUsers()
        
        return NextResponse.json({
            totalRevenue,
            revenueChange,
            totalOrders,
            ordersChange,
            averageOrderValue,
            aovChange,
            newUsers,
            usersChange,
            salesByDate,
            ordersByDate,
            productsByCategory,
            topProducts,
            recentOrders,
            recentUsers
        })
    } catch (error) {
        console.error('Error fetching statistics:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Функция для получения данных о продажах по дням
async function getSalesByDate(period, startDate) {
    const format = period === 'year' ? '%Y-%m' : '%Y-%m-%d'
    const groupBy = period === 'year' ? 'month' : 'day'
    
    const sales = await prisma.$queryRaw`
        SELECT 
            DATE_FORMAT(createdAt, ${format}) as date,
            SUM(total_amount) as amount
        FROM \`Order\`
        WHERE createdAt >= ${startDate}
        GROUP BY DATE_FORMAT(createdAt, ${format})
        ORDER BY date ASC
    `
    
    return sales.map(item => ({
        date: item.date,
        amount: Number(item.amount)
    }))
}

// Функция для получения данных о заказах по дням
async function getOrdersByDate(period, startDate) {
    const format = period === 'year' ? '%Y-%m' : '%Y-%m-%d'
    const groupBy = period === 'year' ? 'month' : 'day'
    
    const orders = await prisma.$queryRaw`
        SELECT 
            DATE_FORMAT(createdAt, ${format}) as date,
            COUNT(*) as count
        FROM \`Order\`
        WHERE createdAt >= ${startDate}
        GROUP BY DATE_FORMAT(createdAt, ${format})
        ORDER BY date ASC
    `
    
    return orders.map(item => ({
        date: item.date,
        count: Number(item.count)
    }))
}

// Функция для получения данных о товарах по категориям
async function getProductsByCategory() {
    const categories = await prisma.$queryRaw`
        SELECT 
            category,
            COUNT(*) as count
        FROM Product
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
        LIMIT 10
    `
    
    return categories.map(item => ({
        category: item.category || 'Без категории',
        count: Number(item.count)
    }))
}

// Функция для получения топ товаров
async function getTopProducts(startDate) {
    const products = await prisma.$queryRaw`
        SELECT 
            p.id,
            p.name,
            p.image,
            p.sku,
            SUM(oi.quantity) as quantity,
            SUM(oi.price * oi.quantity) as revenue
        FROM OrderItem oi
        JOIN Product p ON oi.product_id = p.id
        JOIN \`Order\` o ON oi.order_id = o.id
        WHERE o.createdAt >= ${startDate}
        GROUP BY p.id, p.name, p.image, p.sku
        ORDER BY revenue DESC
        LIMIT 10
    `
    
    return products.map(item => ({
        id: Number(item.id),
        name: item.name,
        image: item.image,
        sku: item.sku,
        quantity: Number(item.quantity),
        revenue: Number(item.revenue)
    }))
}

// Функция для получения последних заказов
async function getRecentOrders() {
    const orders = await prisma.order.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        take: 10,
        include: {
            User: {
                select: {
                    name: true
                }
            }
        }
    })
    
    return orders.map(order => ({
        id: Number(order.id),
        order_number: order.order_number,
        customer_name: order.full_name || (order.User ? order.User.name : 'Неизвестно'),
        total_amount: Number(order.total_amount),
        status: order.status,
        created_at: order.createdAt
    }))
}

// Функция для получения новых пользователей
async function getRecentUsers() {
    const users = await prisma.user.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        take: 10,
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
        }
    })
    
    return users.map(user => ({
        id: Number(user.id),
        name: user.name,
        email: user.email,
        created_at: user.createdAt
    }))
}