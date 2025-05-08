'use client'
import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import Loader from '@/components/Loader'
import { 
    UsersIcon, 
    ShoppingBagIcon, 
    CubeIcon, 
    CurrencyDollarIcon 
} from '@heroicons/react/24/outline'

const AdminDashboard = () => {
    const [stats, setStats] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/admin/stats')
                setStats(response.data)
            } catch (err) {
                console.error('Error fetching admin stats:', err)
                setError('Не удалось загрузить статистику')
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [])

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
            <h1 className="text-3xl font-bold mb-8">Панель управления</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Пользователи" 
                    value={stats?.userCount || 0} 
                    icon={UsersIcon} 
                    color="bg-blue-500" 
                />
                <StatCard 
                    title="Заказы" 
                    value={stats?.orderCount || 0} 
                    icon={ShoppingBagIcon} 
                    color="bg-green-500" 
                />
                <StatCard 
                    title="Товары" 
                    value={stats?.productCount || 0} 
                    icon={CubeIcon} 
                    color="bg-purple-500" 
                />
                <StatCard 
                    title="Общая сумма покупок" 
                    value={`₽${stats?.totalRevenue?.toLocaleString() || 0}`} 
                    icon={CurrencyDollarIcon} 
                    color="bg-yellow-500" 
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Последние заказы</h2>
                    {stats?.recentOrders?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {stats.recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-4 py-2 whitespace-nowrap">{order.orderNumber}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">{order.fullName}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">₽{order.totalAmount}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                                                    {getStatusText(order.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">Нет данных о заказах</p>
                    )}
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Новые пользователи</h2>
                    {stats?.recentUsers?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {stats.recentUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-4 py-2 whitespace-nowrap">{user.name}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">{user.email}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">{getRoleText(user.role)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">Нет данных о пользователях</p>
                    )}
                </div>
            </div>
        </div>
    )
}

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6 flex items-center">
        <div className={`${color} text-white p-3 rounded-full mr-4`}>
            <Icon className="h-6 w-6" />
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
)

const getStatusColor = (status) => {
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

const getStatusText = (status) => {
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

const getRoleText = (role) => {
    switch (role) {
        case 'customer':
            return 'Покупатель'
        case 'seller':
            return 'Продавец'
        case 'admin':
            return 'Администратор'
        default:
            return role
    }
}

export default AdminDashboard