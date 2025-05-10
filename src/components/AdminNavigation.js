'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    HomeIcon,
    UsersIcon,
    ShoppingBagIcon,
    ShoppingCartIcon,
    ChartBarIcon,
    Bars3Icon,
    XMarkIcon,
    ArrowLeftStartOnRectangleIcon,
    UserPlusIcon
} from '@heroicons/react/24/outline'
import ApplicationLogo from '@/components/ApplicationLogo'

const AdminNavigation = () => {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const navigation = [
        { name: 'Панель управления', href: '/admin', icon: HomeIcon },
        { name: 'Статистика', href: '/admin/statistics', icon: ChartBarIcon },
        { name: 'Пользователи', href: '/admin/users', icon: UsersIcon },
        { name: 'Верификация продавцов', href: '/admin/verifications', icon: UserPlusIcon },
        { name: 'Товары', href: '/admin/products', icon: ShoppingBagIcon },
        { name: 'Заказы', href: '/admin/orders', icon: ShoppingCartIcon },
        { name: 'Выйти', href: '/dashboard', icon: ArrowLeftStartOnRectangleIcon },
    ]

    const isActive = (path) => {
        if (path === '/admin') {
            return pathname === '/admin'
        }
        return pathname.startsWith(path)
    }

    return (
        <>
            {/* Мобильная навигация */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b">

                <Link href="/" className='flex flex-row items-center gap-2'>
                    <ApplicationLogo className="block h-10 w-auto fill-current text-[#4438ca]" />
                </Link><h1 className="text-xl font-bold">Админ-панель</h1>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                    {isMobileMenuOpen ? (
                        <XMarkIcon className="h-6 w-6" />
                    ) : (
                        <Bars3Icon className="h-6 w-6" />
                    )}
                </button>
            </div>

            {isMobileMenuOpen && (
                <div className="lg:hidden">
                    <nav className="px-2 py-4 space-y-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`${isActive(item.href)
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <item.icon
                                    className={`${isActive(item.href) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                                        } mr-3 flex-shrink-0 h-6 w-6`}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}

            {/* Десктопная навигация */}
            <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:pt-5">
                <div className="flex items-center flex-shrink-0 px-6 flex-col">
                    <Link href="/" className='flex flex-row items-center gap-2'>
                        <ApplicationLogo className="block h-20 w-auto fill-current text-[#4438ca]" />
                    </Link>
                    <h1 className="text-2xl font-bold">Админ-панель</h1>
                </div>
                <div className="mt-6 flex flex-grow flex-col">
                    <nav className='d-flex flex-column flex-between'>
                        <ul className="flex-1 px-3 space-y-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`${isActive(item.href)
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                                >
                                    <item.icon
                                        className={`${isActive(item.href) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                                            } mr-3 flex-shrink-0 h-6 w-6`}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            ))}
                        </ul>
                    </nav>
                </div>
            </div>
        </>
    )
}

export default AdminNavigation