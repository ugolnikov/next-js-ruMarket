'use client'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import { useOrders } from '@/hooks/orders'
import Button from '@/components/Button'
import axios from '@/lib/axios'
import { useRouter } from 'next/navigation'
import Loader from '@/components/Loader'
import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import debounce from 'lodash/debounce'
import { signOut } from 'next-auth/react';

const Dashboard = () => {
    const { user, mutate, isLoading, updatePhone } = useAuth()
    const { orders, isLoading: ordersLoading } = useOrders()
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredOrders, setFilteredOrders] = useState([])
    const [isEditingPhone, setIsEditingPhone] = useState(false)
    const [newPhone, setNewPhone] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [phoneSuccess, setPhoneSuccess] = useState(false)

    // Создаем функцию debounce для поиска
    const debouncedSearch = useCallback(
        debounce((term, ordersData, callback) => {
            if (!ordersData) return;

            if (!term.trim()) {
                callback(ordersData);
                return;
            }

            const filtered = ordersData.filter(order => 
                order.orderNumber.toLowerCase().includes(term.toLowerCase()) ||
                order.totalAmount.toString().includes(term)
            );
            callback(filtered);
        }, 300),
        []
    );

    useEffect(() => {
        if (orders) {
            debouncedSearch(searchTerm, orders, setFilteredOrders);
        }
    }, [searchTerm, orders, debouncedSearch]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
    };

    const getStatusColor = status => {
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

    const getStatusText = status => {
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

    const handlePhoneSubmit = async e => {
        e.preventDefault()
        setPhoneError('')
        setPhoneSuccess(false)

        const phoneRegex = /^\+7\d{10}$/
        if (!phoneRegex.test(newPhone)) {
            setPhoneError(
                'Введите корректный номер телефона в формате +7XXXXXXXXXX',
            )
            return
        }

        try {
            const result = await updatePhone(newPhone)
            if (result.success) {
                setPhoneSuccess(true)
                setIsEditingPhone(false)
                setTimeout(() => setPhoneSuccess(false), 3000)
            } else {
                setPhoneError(result.errors?.phone?.[0] || 'Произошла ошибка')
            }
        } catch (error) {
            console.error(error)
            setPhoneError('Произошла ошибка при обновлении номера')
        }
    }

    const changeRole = async () => {
        try {
            // Determine the new role based on current role
            const newRole = user.role === 'customer' ? 'seller' : 'customer';
            
            const response = await axios.put(`api/dashboard/${user.id}`, {
                role: newRole
            });
      
            if (response.data.signOut) {
                signOut({ callbackUrl: '/login' }); 
            }
      
            mutate();  
        } catch (error) {
            console.error('Error changing role:', error);
        }
    };
    
    if (!user || ordersLoading) return <Loader />
    return (
        <>
            <Header title="Личный кабинет" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h2 className="text-3xl font-bold text-[#4438ca]">
                                Добро пожаловать, {user?.name}!
                            </h2>
                            <p className="mt-4 text-lg text-gray-700">
                                Ваш email: {user?.email}
                            </p>

                            {/* Блок с телефоном */}
                            <div className="mt-4 text-lg text-gray-700">
                                <div className="flex items-center gap-4">
                                    <span>
                                        Телефон: {user?.phone || 'Не указан'}
                                    </span>
                                    <Button
                                        onClick={() => {
                                            setIsEditingPhone(!isEditingPhone)
                                            setNewPhone(user?.phone || '')
                                            setPhoneError('')
                                        }}
                                        className="text-sm rounded !p-1">
                                        {isEditingPhone ? 'Отмена' : 'Изменить'}
                                    </Button>
                                </div>

                                {isEditingPhone && (
                                    <form
                                        onSubmit={handlePhoneSubmit}
                                        className="mt-4">
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="tel"
                                                value={newPhone}
                                                onChange={e =>
                                                    setNewPhone(e.target.value)
                                                }
                                                placeholder="+7XXXXXXXXXX"
                                                className="border-gray-300 focus:border-[#4438ca] focus:ring-[#4438ca] rounded-md shadow-sm"
                                            />
                                            <Button
                                                type="submit"
                                                className="rounded">
                                                Сохранить
                                            </Button>
                                        </div>
                                        {phoneError && (
                                            <p className="mt-2 text-sm text-red-600">
                                                {phoneError}
                                            </p>
                                        )}
                                    </form>
                                )}

                                {phoneSuccess && (
                                    <p className="mt-2 text-sm text-green-600">
                                        Номер телефона успешно обновлён
                                    </p>
                                )}
                            </div>

                            <p className="mt-4 text-lg text-gray-700">
                                Роль: 
                                {user?.role === 'seller' ? (
                                    <>
                                        <span className="text-[#4438ca]">
                                            {'  '}Продавец -{'  '}
                                        </span>
                                        <Button
                                            className="text-sm rounded !p-1"
                                            onClick={() =>
                                                changeRole()
                                            }>
                                            Стать покупателем
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-[#4438ca]">
                                            {'  '}Покупатель -{'  '}
                                        </span>
                                        <Button
                                            className="text-sm rounded !p-1"
                                            onClick={() =>
                                                changeRole({
                                                    url: '/api/change_role/seller',
                                                })
                                            }>
                                            Стать продавцом
                                        </Button>
                                    </>
                                )}
                            </p>

                            {user?.role === 'seller' && (
                                <div className="mt-8">
                                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                        {/* Шапка с логотипом и названием компании */}
                                        <div className="relative h-48 bg-gradient-to-r from-[#4438ca] to-[#6d64ff]">
                                            <div className="absolute -bottom-12 left-8">
                                                {user?.logo ? (
                                                    <Image
                                                        src={user.logo}
                                                        alt="Логотип компании"
                                                        width="200"
                                                        height="200"
                                                        className="w-24 h-24 rounded-lg border-4 border-white shadow-lg object-cover bg-white"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 rounded-lg border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                                                        <svg
                                                            className="w-12 h-12 text-gray-400"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute bottom-4 left-40">
                                                <h3 className="text-xl sm:text-2xl font-bold text-white">
                                                    {user?.company_name ||
                                                        'Название компании не указано'}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Основная информация */}
                                        <div className="pt-16 pb-8 px-4 sm:px-8">
                                            <div className="flex-col flex sm:grid sm:grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Статус верификации */}
                                                <div className="col-span-2 flex flex-col align-items-center justify-center sm:flex-row mb-4 sm:mb-0 w-full items-center sm:justify-evenly">
                                                    <div
                                                        className={`inline-flex items-center px-4 py-2 rounded-full mb-2 sm:mb-0 ${
                                                            user?.is_verify
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        <svg
                                                            className={`w-5 h-5 mr-2 ${
                                                                user?.is_verify
                                                                    ? 'text-green-500'
                                                                    : 'text-yellow-500'
                                                            }`}
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20">
                                                            {user?.is_verify ? (
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                    clipRule="evenodd"
                                                                />
                                                            ) : (
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                                    clipRule="evenodd"
                                                                />
                                                            )}
                                                        </svg>
                                                        <span className="font-medium">
                                                            {user?.is_verify
                                                                ? 'Верифицированный продавец'
                                                                : 'Ожидает верификации'}
                                                        </span>
                                                    </div>
                                                    {!user?.is_verify && (
                                                        <Button
                                                            className="ml-0 sm:ml-4 text-sm rounded"
                                                            onClick={() =>
                                                                router.push(
                                                                    '/dashboard/confirmation',
                                                                )
                                                            }>
                                                            Пройти верификацию
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Контактная информация */}
                                                <div className="space-y-1 sm:space-y-4 flex-col">
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-500">
                                                            ИНН
                                                        </h4>
                                                        <p className="mt-1 text-lg font-medium">
                                                            {user?.inn ||
                                                                'Не указан'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-500">
                                                            Телефон
                                                        </h4>
                                                        <p className="mt-1 text-lg font-medium">
                                                            {user?.phone ||
                                                                'Не указан'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Адрес */}
                                                <div className="space-y-1 sm:space-y-4">
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-500">
                                                            Адрес
                                                        </h4>
                                                        <p className="mt-1 text-lg font-medium">
                                                            {user?.address ||
                                                                'Не указан'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-500">
                                                            Email
                                                        </h4>
                                                        <p className="mt-1 text-lg font-medium">
                                                            {user?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {user?.role === 'customer' ? (
                <div className="pb-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-3xl font-bold text-[#4438ca]">
                                        Ваши заказы:
                                    </h2>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            placeholder="Поиск заказов..."
                                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4438ca] focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                
                                <div className="mt-4 overflow-x-auto">
                                    {filteredOrders && filteredOrders.length > 0 ? (
                                        <div className="space-y-4">
                                            {filteredOrders.map(order => (
                                                <div
                                                    key={order.id}
                                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-medium">
                                                            Заказ #{order.orderNumber}
                                                        </span>
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                                                                order.status,
                                                            )}`}>
                                                            {getStatusText(order.status)}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <p>Сумма: {order.totalAmount} ₽</p>
                                                        <p>
                                                            Дата:{' '}
                                                            {new Date(
                                                                order.createdAt,
                                                            ).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href={`/dashboard/orders/order/${order.orderNumber}`}
                                                        className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block">
                                                        Подробнее
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-700 text-center mt-6">
                                            {searchTerm 
                                                ? "Заказы не найдены" 
                                                : "Заказы отсутствуют."}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    )
}

export default Dashboard
