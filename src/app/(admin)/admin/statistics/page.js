'use client'
import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import Loader from '@/components/Loader'
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    BarElement,
    Title, 
    Tooltip, 
    Legend, 
    ArcElement 
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    BarElement,
    Title, 
    Tooltip, 
    Legend,
    ArcElement
)

const StatisticsPage = () => {
    const [stats, setStats] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [period, setPeriod] = useState('month') // 'week', 'month', 'year'

    useEffect(() => {
        fetchStats()
    }, [period])

    const fetchStats = async () => {
        try {
            setIsLoading(true)
            const response = await axios.get(`/api/admin/statistics?period=${period}`)
            setStats(response.data)
        } catch (err) {
            console.error('Error fetching statistics:', err)
            setError('Не удалось загрузить статистику')
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) return <Loader />

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="text-center py-10">
                <p>Нет данных для отображения</p>
            </div>
        )
    }

    // Prepare data for sales chart
    const salesData = {
        labels: stats.salesByDate.map(item => item.date),
        datasets: [
            {
                label: 'Продажи (₽)',
                data: stats.salesByDate.map(item => item.amount),
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.5)',
                tension: 0.3
            }
        ]
    }

    // Prepare data for orders chart
    const ordersData = {
        labels: stats.ordersByDate.map(item => item.date),
        datasets: [
            {
                label: 'Количество заказов',
                data: stats.ordersByDate.map(item => item.count),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }
        ]
    }

    // Prepare data for product categories pie chart
    const categoriesData = {
        labels: stats.productsByCategory.map(item => item.category),
        datasets: [
            {
                label: 'Товары по продавцам',
                data: stats.productsByCategory.map(item => item.count),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)',
                    'rgba(199, 199, 199, 0.5)',
                    'rgba(83, 102, 255, 0.5)',
                    'rgba(40, 159, 64, 0.5)',
                    'rgba(210, 199, 199, 0.5)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(159, 159, 159, 1)',
                    'rgba(83, 102, 255, 1)',
                    'rgba(40, 159, 64, 1)',
                    'rgba(210, 199, 199, 1)',
                ],
                borderWidth: 1,
            }
        ]
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Статистика</h1>
            
            <div className="mb-6">
                <div className="flex space-x-4 mb-4">
                    <button 
                        onClick={() => setPeriod('week')} 
                        className={`px-4 py-2 rounded ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Неделя
                    </button>
                    <button 
                        onClick={() => setPeriod('month')} 
                        className={`px-4 py-2 rounded ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Месяц
                    </button>
                    <button 
                        onClick={() => setPeriod('year')} 
                        className={`px-4 py-2 rounded ${period === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Год
                    </button>
                </div>
            </div>
            
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader />
                </div>
            ) : error ? (
                <div className="text-red-500 text-center p-4">
                    Ошибка при загрузке данных: {error}
                </div>
            ) : stats ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard 
                            title="Выручка" 
                            value={`₽${stats.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'}`} 
                            change={stats.revenueChange || 0} 
                            isPositive={(stats.revenueChange || 0) >= 0} 
                        />
                        <StatCard 
                            title="Заказы" 
                            value={stats.totalOrders || 0} 
                            change={stats.ordersChange || 0} 
                            isPositive={(stats.ordersChange || 0) >= 0} 
                        />
                        <StatCard 
                            title="Средний чек" 
                            value={`₽${stats.averageOrderValue ? stats.averageOrderValue.toLocaleString() : '0'}`} 
                            change={stats.aovChange || 0} 
                            isPositive={(stats.aovChange || 0) >= 0} 
                        />
                        <StatCard 
                            title="Новые пользователи" 
                            value={stats.newUsers || 0} 
                            change={stats.usersChange || 0} 
                            isPositive={(stats.usersChange || 0) >= 0} 
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Продажи</h2>
                            <div className="h-80">
                                <Line 
                                    data={salesData} 
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: {
                                                beginAtZero: true
                                            }
                                        }
                                    }} 
                                />
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Заказы</h2>
                            <div className="h-80">
                                <Bar 
                                    data={ordersData} 
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    stepSize: 1
                                                }
                                            }
                                        }
                                    }} 
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-6 lg:col-span-1">
                            <h2 className="text-xl font-semibold mb-4">Товары по категориям</h2>
                            <div className="h-80 flex items-center justify-center">
                                <Pie 
                                    data={categoriesData} 
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'bottom'
                                            }
                                        }
                                    }} 
                                />
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                            <h2 className="text-xl font-semibold mb-4">Топ товаров</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Товар</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Продажи</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Выручка</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {stats.topProducts.map((product, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {product.image && (
                                                            <img 
                                                                src={product.image} 
                                                                alt={product.name}
                                                                className="h-10 w-10 object-cover rounded mr-3"
                                                            />
                                                        )}
                                                        <div>
                                                            <p className="font-medium">{product.name}</p>
                                                            <p className="text-sm text-gray-500">{product.sku || '-'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{product.quantity}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">₽{product.revenue.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Последние заказы</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№ заказа</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {stats.recentOrders.map((order, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <a 
                                                        href={`/admin/orders/${order.id}`}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        {order.order_number}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{order.customer_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">₽{order.total_amount.toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                                                        {getStatusText(order.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Новые пользователи</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата регистрации</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {stats.recentUsers.map((user, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p 
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        {user.name}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            ) : null
        } 
        </div>
    )
}

// Компонент карточки статистики
const StatCard = ({ title, value, change, isPositive }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-3xl font-bold mt-2">{value}</p>
            <div className="flex items-center mt-2">
                <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '↑' : '↓'} {Math.abs(change)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">по сравнению с предыдущим периодом</span>
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

export default StatisticsPage