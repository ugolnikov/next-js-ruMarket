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

    const now = new Date()
    const startDate = new Date()
    const previousStartDate = new Date()

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
        break
    }

    const [currentPeriodOrders, previousPeriodOrders] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        include: { items: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: previousStartDate, lt: startDate } },
        include: { items: true },
      }),
    ])

    const totalRevenue = currentPeriodOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
    const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
    const revenueChange = previousRevenue === 0 ? 100 : Math.round((totalRevenue - previousRevenue) / previousRevenue * 100)

    const averageOrderValue = currentPeriodOrders.length ? Math.round(totalRevenue / currentPeriodOrders.length) : 0
    const previousAOV = previousPeriodOrders.length ? Math.round(previousRevenue / previousPeriodOrders.length) : 0
    const aovChange = previousAOV === 0 ? 100 : Math.round((averageOrderValue - previousAOV) / previousAOV * 100)

    const totalOrders = currentPeriodOrders.length
    const ordersChange = previousPeriodOrders.length === 0 ? 100 : Math.round((totalOrders - previousPeriodOrders.length) / previousPeriodOrders.length * 100)

    const [newUsers, previousNewUsers] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.user.count({ where: { createdAt: { gte: previousStartDate, lt: startDate } } }),
    ])

    const usersChange = previousNewUsers === 0 ? 100 : Math.round((newUsers - previousNewUsers) / previousNewUsers * 100)

    const [salesByDate, ordersByDate, productsByCategory, topProducts, recentOrders, recentUsers] = await Promise.all([
      getSalesByDate(period, startDate),
      getOrdersByDate(period, startDate),
      getProductsByCategory(),
      getTopProducts(startDate),
      getRecentOrders(),
      getRecentUsers(),
    ])

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
      recentUsers,
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

async function getSalesByDate(period, startDate) {
  const format = period === 'year' ? 'YYYY-MM' : 'YYYY-MM-DD'

  const sales = await prisma.$queryRaw`
    SELECT TO_CHAR("created_at", ${format}) as date, SUM("total_amount") as amount
    FROM "orders"
    WHERE "created_at" >= ${startDate}
    GROUP BY date
    ORDER BY date ASC
  `

  return sales.map(sale => ({
    date: sale.date,
    amount: Number(sale.amount),
  }))
}

async function getOrdersByDate(period, startDate) {
  const format = period === 'year' ? 'YYYY-MM' : 'YYYY-MM-DD'

  const orders = await prisma.$queryRaw`
    SELECT TO_CHAR("created_at", ${format}) as date, COUNT(*) as count
    FROM "orders"
    WHERE "created_at" >= ${startDate}
    GROUP BY date
    ORDER BY date ASC
  `

  return orders.map(order => ({
    date: order.date,
    count: Number(order.count),
  }))
}

async function getTopProducts(startDate) {
  const products = await prisma.$queryRaw`
    SELECT p.id, p.name, p.image_preview, p.unit,
           SUM(oi.quantity) as quantity,
           SUM(oi.price * oi.quantity) as revenue
    FROM "order_items" oi
    JOIN "products" p ON oi."product_id" = p.id
    JOIN "orders" o ON oi."order_id" = o.id
    WHERE o."created_at" >= ${startDate}
    GROUP BY p.id, p.name, p.image_preview, p.unit
    ORDER BY revenue DESC
    LIMIT 10
  `

  return products.map(item => ({
    id: Number(item.id),
    name: item.name,
    image: item.image_preview,
    unit: item.unit,
    quantity: Number(item.quantity),
    revenue: Number(item.revenue),
  }))
}

async function getProductsByCategory() {
  const sellerGroups = await prisma.$queryRaw`
    SELECT u.name as seller_name, COUNT(p.id) as count
    FROM "products" p
    LEFT JOIN "users" u ON p."seller_id" = u.id
    GROUP BY u.name
    ORDER BY count DESC
    LIMIT 10
  `

  return sellerGroups.map(item => ({
    category: item.seller_name || 'Без продавца',
    count: Number(item.count),
  }))
}

async function getRecentOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: { select: { name: true } },
    },
  })

  return orders.map(order => ({
    id: Number(order.id),
    order_number: order.orderNumber,
    customer_name: order.fullName || order.user?.name || 'Неизвестно',
    total_amount: Number(order.totalAmount),
    status: order.status,
    created_at: order.createdAt.toISOString(),
  }))
}

async function getRecentUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  })

  return users.map(user => ({
    id: Number(user.id),
    name: user.name,
    email: user.email,
    created_at: user.createdAt.toISOString(),
  }))
}
