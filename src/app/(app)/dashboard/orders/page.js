'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function OrdersPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const router = useRouter()
    const { data: session } = useSession()

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                if (!session?.user?.id) {
                    setLoading(false)
                    return
                }

                const response = await fetch(`/api/orders?userId=${session.user.id}`)
                if (!response.ok) {
                    throw new Error('Failed to fetch orders')
                }

                const data = await response.json()
                setOrders(data)
                setLoading(false)
            } catch (err) {
                setError(err.message)
                setLoading(false)
            }
        }

        fetchOrders()
    }, [session])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </div>
        )
    }

    if (!session) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                    Пожалуйста, войдите в систему для просмотра заказов.
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Мои заказы</h1>
            
            {orders.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-6">
                    <p className="text-gray-600">У вас пока нет заказов.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Link
                            key={order.id}
                            href={order.orderNumber ? `/dashboard/orders/order/${order.orderNumber}` : '#'}
                            className={`block bg-white shadow rounded-lg p-6 ${order.orderNumber ? 'hover:shadow-md transition-shadow' : 'cursor-not-allowed opacity-70'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-semibold mb-2">
                                        {order.orderNumber ? `Заказ #${order.orderNumber}` : 'Номер заказа отсутствует'}
                                    </h2>
                                    <p className="text-gray-600 mb-1">
                                        Дата: {new Date(order.createdAt).toLocaleString('ru-RU')}
                                    </p>
                                    <p className="text-gray-600">
                                        Сумма: {Number(order.totalAmount).toLocaleString('ru-RU')} ₽
                                    </p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

function getStatusColor(status) {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800'
        case 'shipped':
            return 'bg-blue-100 text-blue-800'
        case 'completed':
            return 'bg-green-100 text-green-800'
        case 'cancelled':
            return 'bg-red-100 text-red-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}

function getStatusText(status) {
    switch (status) {
        case 'pending':
            return 'Ожидает обработки'
        case 'shipped':
            return 'Отправлен'
        case 'completed':
            return 'Выполнен'
        case 'cancelled':
            return 'Отменён'
        default:
            return status
    }
}
