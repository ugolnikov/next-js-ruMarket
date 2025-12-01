'use client'
import ApplicationLogo from '@/components/ApplicationLogo'
import Dropdown from '@/components/Dropdown'
import Link from 'next/link'
import NavLink from '@/components/NavLink'
import ResponsiveNavLink, {
    ResponsiveNavButton,
} from '@/components/ResponsiveNavLink'
import { DropdownButton } from '@/components/DropdownLink'
import { useAuth } from '@/hooks/auth'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import LoginLinks from '@/components/LoginLinks'
import CartIcon from '@/components/CartIcon'
import Loader from '@/components/Loader'
import { useCart } from '@/hooks/cart'
import FavoritesIcon from '@/components/FavoritesIcon'

const Navigation = ({ user }) => {
    const { logout } = useAuth()
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    const { cart, isLoading } = useCart()
    const [cartCount, setCartCount] = useState(0)
    
    useEffect(() => {
        if (cart?.items && Array.isArray(cart.items)) {
            setCartCount(cart.items.length)
        } else {
            setCartCount(0)
        }
    }, [cart])

    // if (isLoading) return <Loader />

    return (
        <nav className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="flex flex-row items-center gap-2">
                                <ApplicationLogo className="block h-10 w-auto fill-current text-[#4438ca]" />
                                <h1>ruMarket</h1>
                            </Link>
                        </div>

                        <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                            <NavLink href="/" active={pathname === '/'}>
                                Товары
                            </NavLink>
                            {user && (
                                <NavLink href="/dashboard" active={pathname === '/dashboard'}>
                                    Личный кабинет
                                </NavLink>
                            )}
                            {user?.role === 'seller' && user?.is_verify && (
                                <>
                                    <NavLink href="/dashboard/goods" active={pathname === '/dashboard/goods'}>
                                        Редактирование товаров
                                    </NavLink>
                                    <NavLink href="/dashboard/sales" active={pathname === '/dashboard/sales'}>
                                        Продажи
                                    </NavLink>
                                    <NavLink href="/dashboard/requests" active={pathname === '/dashboard/requests'}>
                                        Заявки
                                    </NavLink>
                                </>
                            )}
                            {user?.is_admin === true && (
                                <NavLink href="/admin" active={pathname === '/admin'}>
                                    Панель администратора
                                </NavLink>
                            )}
                        </div>
                    </div>

                    <div className="hidden sm:flex sm:items-center sm:ml-6 sm:gap-10">
                        {!user ? (
                            <LoginLinks />
                        ) : (
                            <>
                                {user?.role === 'customer' && (
                                    <>
                                        <FavoritesIcon data-testid="favorites-icon" />
                                        <CartIcon cartCount={cartCount} />
                                    </>
                                )}
                                <Dropdown
                                    align="right"
                                    width="48"
                                    trigger={
                                        <button className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none transition duration-150 ease-in-out">
                                            <div>{user?.name}</div>
                                            <div className="ml-1">
                                                <svg
                                                    className="fill-current h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                        </button>
                                    }
                                >
                                    <DropdownButton onClick={logout}>
                                        Выход
                                    </DropdownButton>
                                </Dropdown>
                            </>
                        )}
                    </div>

                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setOpen(prev => !prev)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
                        >
                            <svg
                                className="h-6 w-6"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                {open ? (
                                    <path
                                        className="inline-flex"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        className="inline-flex"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {open && (
                <div className="block sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        <ResponsiveNavLink href="/" active={pathname === '/'}>
                            Товары
                        </ResponsiveNavLink>

                        {!user ? (
                            <>
                                <ResponsiveNavLink href="/login" active={pathname === '/login'}>
                                    Вход
                                </ResponsiveNavLink>
                                <ResponsiveNavLink href="/register" active={pathname === '/register'}>
                                    Регистрация
                                </ResponsiveNavLink>
                            </>
                        ) : (
                            <>
                                {user?.role === 'customer' && (
                                    <>
                                        <ResponsiveNavLink href="/cart" active={pathname === '/cart'}>
                                            Корзина{' '}
                                            {cartCount ? (
                                                <span className="text-white px-2 py-1 bg-red-900 rounded">
                                                    {cartCount}
                                                </span>
                                            ) : null}
                                        </ResponsiveNavLink>
                                        <ResponsiveNavLink
                                            href="/dashboard/favorites"
                                            active={pathname === '/dashboard/favorites'}
                                            data-testid="favorites-icon"
                                        >
                                            Избранные{' '}
                                        </ResponsiveNavLink>
                                    </>
                                )}
                                <ResponsiveNavLink href="/dashboard" active={pathname === '/dashboard'}>
                                    Личный кабинет
                                </ResponsiveNavLink>
                                {user?.role === 'seller' && user?.is_verify && (
                                    <>
                                        <ResponsiveNavLink
                                            href="/dashboard/goods"
                                            active={pathname === '/dashboard/goods'}
                                        >
                                            Редактирование товаров
                                        </ResponsiveNavLink>
                                        <ResponsiveNavLink
                                            href="/dashboard/sales"
                                            active={pathname === '/dashboard/sales'}
                                        >
                                            Продажи
                                        </ResponsiveNavLink>
                                        <ResponsiveNavLink
                                            href="/dashboard/requests"
                                            active={pathname === '/dashboard/requests'}
                                        >
                                            Заявки
                                        </ResponsiveNavLink>
                                    </>
                                )}
                                {user?.is_admin === true && (
                                    <ResponsiveNavLink href="/admin" active={pathname === '/admin'}>
                                        Панель администратора
                                    </ResponsiveNavLink>
                                )}
                            </>
                        )}
                    </div>

                    {user && (
                        <div className="pt-4 pb-1 border-t border-gray-200">
                            <div className="flex items-center px-4">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="h-10 w-10 fill-current text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                </div>

                                <div className="ml-3">
                                    <div className="font-medium text-base text-gray-800">
                                        {user?.name}
                                    </div>
                                    <div className="font-medium text-sm text-gray-500">
                                        {user?.email}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 space-y-1">
                                <ResponsiveNavButton onClick={logout}>
                                    Выход
                                </ResponsiveNavButton>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </nav>
    )
}

export default Navigation
