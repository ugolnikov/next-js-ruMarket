'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import axios from '@/lib/axios'
import Image from 'next/image'
import Loader from '@/components/Loader'

const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

const OrderDetails = () => {
    const params = useParams()
    const searchParams = useSearchParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await axios.get(`/api/orders/${params.id}`)
                setOrder(response.data)
            } catch (err) {
                setError(err.response?.data?.error || 'Ошибка при загрузке заказа')
            } finally {
                setLoading(false)
            }
        }

        fetchOrder()
    }, [params.id])

    if (loading) return <Loader />

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <p className="text-gray-500">Заказ не найден</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {searchParams.get('success') && (
                <div className="mb-6 p-4 bg-green-50 rounded-md">
                    <p className="text-green-700">
                        Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.
                    </p>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Заказ {order.orderNumber}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        от {formatDate(order.createdAt)}
                    </p>
                </div>

                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">
                                Статус
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {order.status === 'pending' && 'В обработке'}
                                {order.status === 'shipped' && 'Отправлен'}
                                {order.status === 'completed' && 'Выполнен'}
                                {order.status === 'cancelled' && 'Отменен'}
                            </dd>
                        </div>

                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">
                                Сумма заказа
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {order.totalAmount.toLocaleString('ru-RU')} ₽
                            </dd>
                        </div>

                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">
                                Информация о доставке
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                <p>ФИО: {order.fullName}</p>
                                <p>Email: {order.email}</p>
                                <p>Телефон: {order.phone}</p>
                                <p>Адрес: {order.address}</p>
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="border-t border-gray-200">
                    <div className="px-4 py-5 sm:px-6">
                        <h4 className="text-lg font-medium text-gray-900">
                            Товары в заказе
                        </h4>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {order.items.map((item) => (
                            <div
                                key={item.id}
                                className="px-4 py-4 sm:px-6 flex items-center">
                                <div className="flex-shrink-0 w-20 h-20 relative">
                                    <Image
                                        src={
                                            item.product?.image_preview ||
                                            'https://via.placeholder.com/200'
                                        }
                                        alt={item.product?.name || 'Product image'}
                                        fill
                                        className="object-cover rounded"
                                    />
                                </div>
                                <div className="ml-6 flex-1">
                                    <h5 className="text-lg font-medium text-gray-900">
                                        {item.product?.name}
                                    </h5>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Количество: {item.quantity}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Цена: {Number(item.price).toLocaleString('ru-RU')} ₽
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderDetails
