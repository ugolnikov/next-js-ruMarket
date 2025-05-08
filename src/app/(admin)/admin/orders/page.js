'use client'
import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import Loader from '@/components/Loader'
import { PencilIcon, EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const OrdersManagement = () => {
    const [orders, setOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [editingOrder, setEditingOrder] = useState(null)
    const [formData, setFormData] = useState({})
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            setIsLoading(true)
            const response = await axios.get('/api/admin/orders')
            console.log(response.data)
            setOrders(response.data)
        } catch (err) {
            console.error('Error fetching orders:', err)
            setError('Не удалось загрузить заказы')
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (order) => {
        setEditingOrder(order.id)
        setFormData({
            status: order.status || 'pending'
        })
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSave = async () => {
        try {
            console.log('Saving order with data:', formData)
            const response = await axios.put(`/api/admin/orders/${editingOrder}`, formData)
            console.log('Update response:', response.data)
            setEditingOrder(null)
            fetchOrders()
        } catch (err) {
            console.error('Error updating order:', err)
            alert(`Не удалось обновить заказ: ${err.response?.data?.error || err.message}`)
        }
    }

    const handleCancel = () => {
        setEditingOrder(null)
    }

    const filteredOrders = orders.filter(order => 
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (isLoading) return <Loader />

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Управление заказами</h1>
            
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Поиск заказов..."
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№ заказа</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Товары</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{order.orderNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{order.fullName}</td>
                                    <td className="px-6 py-4">
                                        <div className="max-h-20 overflow-y-auto">
                                            {order.items && order.items.length > 0 ? (
                                                <ul className="text-sm">
                                                    {order.items.map((item, index) => (
                                                        <li key={index} className="mb-1">
                                                            {item.product?.name || 'Неизвестный товар'} 
                                                            <span className="text-gray-500">
                                                                ({item.quantity} шт. × ₽{item.price.toLocaleString()})
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-gray-500">Нет товаров</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">₽{order.totalAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingOrder === order.id ? (
                                            <select
                                                name="status"
                                                value={formData.status || ''}
                                                onChange={handleChange}
                                                className="w-full px-2 py-1 border rounded"
                                            >
                                                <option value="pending">Ожидает обработки</option>
                                                <option value="processing">В обработке</option>
                                                <option value="shipped">Отправлен</option>
                                                <option value="delivered">Доставлен</option>
                                                <option value="completed">Выполнен</option>
                                                <option value="cancelled">Отменён</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingOrder === order.id ? (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={handleSave}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <CheckIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(order)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </Link>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
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

export default OrdersManagement