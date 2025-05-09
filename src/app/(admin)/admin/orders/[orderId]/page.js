'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Loader from '@/components/Loader'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const OrderDetails = () => {
    const params = useParams()
    const router = useRouter()
    const [order, setOrder] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({})

    // In the OrderDetails component, update the formData state to include payment information
    useEffect(() => {
        if (params.orderId) {
            fetchOrder(params.orderId)
        }
    }, [params.orderId])

    const fetchOrder = async (orderId) => {
        try {
            setIsLoading(true)
            const response = await axios.get(`/api/admin/orders/${orderId}`)
            console.log(response.data)
            setOrder(response.data)
            setFormData({
                status: response.data.status,
                payment_id: response.data.payment_id || '',
                paid: response.data.paid || false
            })
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при загрузке заказа')
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        
        // Convert string boolean values to actual booleans for the paid field
        if (name === 'paid') {
            setFormData(prev => ({
                ...prev,
                [name]: value === 'true' // Convert to actual boolean
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    const handleSave = async () => {
        try {
            // Create a copy of formData with proper type conversion
            const dataToSend = {
                ...formData,
                // Ensure paid is a boolean, not a string
                paid: formData.paid === true || formData.paid === 'true'
            }
            
            const response = await axios.put(`/api/admin/orders/${params.orderId}`, dataToSend)
            setOrder(response.data)
            setIsEditing(false)
        } catch (err) {
            console.error('Error updating order:', err)
            alert('Не удалось обновить заказ')
        }
    }

    if (isLoading) return <Loader />

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
                <button 
                    onClick={() => router.push('/admin/orders')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                    Вернуться к списку заказов
                </button>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="text-center py-10">
                <p>Заказ не найден</p>
                <button 
                    onClick={() => router.push('/admin/orders')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                    Вернуться к списку заказов
                </button>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center mb-8">
                <Link 
                    href="/admin/orders" 
                    className="mr-4 text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <h1 className="text-3xl font-bold">Заказ #{order.orderNumber}</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Информация о заказе</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">Статус</p>
                            {isEditing ? (
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="pending">Ожидает обработки</option>
                                    <option value="processing">В обработке</option>
                                    <option value="shipped">Отправлен</option>
                                    <option value="delivered">Доставлен</option>
                                    <option value="completed">Выполнен</option>
                                    <option value="cancelled">Отменён</option>
                                </select>
                            ) : (
                                <p className="font-medium">
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                                        {getStatusText(order.status)}
                                    </span>
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Дата заказа</p>
                            <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Сумма заказа</p>
                            <p className="font-medium">₽{order.totalAmount}</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        {isEditing ? (
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                                >
                                    Сохранить
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                                >
                                    Отмена
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                            >
                                Редактировать
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Информация о клиенте</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">ФИО</p>
                            <p className="font-medium">{order.fullName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{order.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Телефон</p>
                            <p className="font-medium">{order.phone || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Адрес доставки</p>
                            <p className="font-medium">{order.address || '-'}</p>
                        </div>
                        {order.user && (
                            <div>
                                <p className="text-sm text-gray-500">Зарегистрированный пользователь</p>
                                <Link 
                                    href={`/admin/users#${order.user.id}`}
                                    className="font-medium text-indigo-600 hover:text-indigo-800"
                                >
                                    {order.user.name} ({order.user.email})
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Способ оплаты и доставки</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">Способ оплаты</p>
                                <p className="font-medium">{getPaymentMethodText(order.payment_method || 'Банковская карта')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Статус оплаты</p>
                            {isEditing ? (
                                <select
                                    name="paid"
                                    value={formData.paid}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="true">Оплачен</option>
                                    <option value="false">Не оплачен</option>
                                </select>
                            ) : (
                                <p className="font-medium">
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(order.paid || 'not_specified')}`}>
                                        {getPaymentStatusText(order.paid)}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
                <h2 className="text-xl font-semibold p-6 border-b">Товары в заказе</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Товар</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {order.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {item.product?.image_preview && (
                                                <img 
                                                    src={item.product.image_preview} 
                                                    alt={item.product.name}
                                                    className="h-10 w-10 object-cover rounded mr-3"
                                                />
                                            )}
                                            <div>
                                                <p className="font-medium">{item.product?.name || 'Товар недоступен'}</p>
                                                <p className="text-sm text-gray-500">{item.product?.description || '-'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">₽{item.price}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.is_send ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Отправлен
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Не отправлен
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td colSpan="2" className="px-6 py-4 text-right font-medium">Итого:</td>
                                <td className="px-6 py-4 font-bold">₽{order.totalAmount}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    )
}

const getStatusColor = (status) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800'
        case 'processing':
            return 'bg-blue-100 text-blue-800'
        case 'shipped':
            return 'bg-indigo-100 text-indigo-800'
        case 'delivered':
            return 'bg-purple-100 text-purple-800'
        case 'completed':
            return 'bg-green-100 text-green-800'
        case 'cancelled':
            return 'bg-red-100 text-red-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}

const getStatusText = (status) => {
    switch (status) {
        case 'pending':
            return 'Ожидает обработки'
        case 'processing':
            return 'В обработке'
        case 'shipped':
            return 'Отправлен'
        case 'delivered':
            return 'Доставлен'
        case 'completed':
            return 'Выполнен'
        case 'cancelled':
            return 'Отменён'
        default:
            return status
    }
}

const getPaymentMethodText = (method) => {
    switch (method) {
        case 'card':
            return 'Банковская карта'
        case 'cash':
            return 'Наличные при получении'
        case 'bank_transfer':
            return 'Банковский перевод'
        default:
            return method || 'Не указан'
    }
}

const getPaymentStatusText = (status) => {
    switch (status) {
        case true:
            return 'Оплачен'
        case false:
            return 'Не оплачен'
        default:
            return status || 'Не указан'
    }
}
const getPaymentStatusColor = (status) => {
    switch (status) {
        case false:
            return 'bg-red-100 text-red-800'
        case true:
            return 'bg-green-100 text-green-800'
        default:
            return 'bg-red-100 text-red-800'
    }
}

const getShippingMethodText = (method) => {
    switch (method) {
        case 'courier':
            return 'Курьерская доставка'
        case 'pickup':
            return 'Самовывоз'
        case 'post':
            return 'Почта России'
        case 'express':
            return 'Экспресс-доставка'
        default:
            return method || 'Не указан'
    }
}

export default OrderDetails