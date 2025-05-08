import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    HomeIcon,
    UsersIcon,
    ShoppingBagIcon,
    CubeIcon,
    ChartBarIcon,
    CogIcon,
} from '@heroicons/react/24/outline'

const AdminSidebar = () => {
    const pathname = usePathname()

    const isActive = (path) => {
        return pathname === path || pathname.startsWith(`${path}/`)
    }

    const menuItems = [
        {
            name: 'Панель управления',
            href: '/admin',
            icon: HomeIcon,
        },
        {
            name: 'Пользователи',
            href: '/admin/users',
            icon: UsersIcon,
        },
        {
            name: 'Заказы',
            href: '/admin/orders',
            icon: ShoppingBagIcon,
        },
        {
            name: 'Товары',
            href: '/admin/products',
            icon: CubeIcon,
        },
        {
            name: 'Статистика',
            href: '/admin/statistics',
            icon: ChartBarIcon,
        },
        {
            name: 'Настройки',
            href: '/admin/settings',
            icon: CogIcon,
        },
    ]

    return (
        <div className="bg-indigo-800 text-white w-64 min-h-screen flex-shrink-0">
            <div className="p-4">
                <h2 className="text-2xl font-bold mb-6">Админ панель</h2>
                <nav>
                    <ul>
                        {menuItems.map((item) => (
                            <li key={item.href} className="mb-2">
                                <Link
                                    href={item.href}
                                    className={`flex items-center p-2 rounded-lg ${
                                        isActive(item.href)
                                            ? 'bg-indigo-700'
                                            : 'hover:bg-indigo-700'
                                    }`}>
                                    <item.icon className="h-5 w-5 mr-3" />
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </div>
    )
}

export default AdminSidebar