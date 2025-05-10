'use client'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/auth'
import { useOrders } from '@/hooks/orders'
import Button from '@/components/Button'
import axios from '@/lib/axios'
import { useRouter } from 'next/navigation'
import Loader from '@/components/Loader'
import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import debounce from 'lodash/debounce'
import { signOut } from 'next-auth/react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid' // Add heroicons if not present

const Dashboard = () => {
    const { user, mutate, isLoading, updatePhone } = useAuth()
    console.log(user)
    const { orders, isLoading: ordersLoading } = useOrders()
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredOrders, setFilteredOrders] = useState([])
    const [isEditingPhone, setIsEditingPhone] = useState(false)
    const [newPhone, setNewPhone] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [phoneSuccess, setPhoneSuccess] = useState(false)
    const [logoHover, setLogoHover] = useState(false)
    const [logoUploading, setLogoUploading] = useState(false)
    const fileInputRef = useRef(null)

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

            if (newRole === 'seller') {
                // Check if user was previously approved as a seller
                if (user.verification_status === 'approved') {
                    // If already approved before, directly change role without verification
                    const response = await axios.put(`/api/dashboard/${user.id}`, {
                        role: newRole
                    });
                    
                    mutate();
                } else {
                    // Redirect to verification page if not previously approved
                    router.push('/dashboard/verification');
                }
                return;
            } else {
                // If changing back to customer, make the API call
                const response = await axios.put(`/api/dashboard/${user.id}`, {
                    role: newRole
                });

                if (response.data.signOut) {
                    signOut({ callbackUrl: '/login' });
                }

                mutate();
            }
        } catch (error) {
            console.error('Error changing role:', error);
        }
    };

    // Upload logo handler using supabaseStorage via /api/upload
    const handleLogoChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setLogoUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            // First upload the file to get the URL
            const uploadRes = await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (uploadRes.data?.url) {
                // Then update the user profile with the logo URL
                await axios.put('/api/user/profile', {
                    logo: uploadRes.data.url
                })

                // Refresh user data
                mutate()
            }
        } catch (error) {
            console.error('Error uploading logo:', error.response?.data || error.message)
        } finally {
            setLogoUploading(false)
        }
    }

    // Remove logo handler
    const handleRemoveLogo = async () => {
        setLogoUploading(true)
        try {
            await axios.put('/api/user/profile', { logo: null })
            mutate()
        } catch (error) {
            console.error('Error removing logo:', error)
        } finally {
            setLogoUploading(false)
        }
    }

    const date = new Date(user?.verification_approved_at)
    const verif_date = date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

    if (!user || ordersLoading) return <Loader />
    return (
        <>
            <Header title="Личный кабинет" />
            <div className="py-5 sm:py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h2 className="text-3xl font-bold text-[#4438ca]">
                                Добро пожаловать, {user?.name}!
                            </h2>
                            <p className="mt-4 text-lg text-gray-700 text-center sm:text-left">
                                Ваш email: {user?.email}
                            </p>

                            {/* Блок с телефоном */}
                            <div className="mt-4 text-lg text-gray-700">
                                <div className="flex items-center gap-4 flex-col sm:flex-row">
                                    <span>
                                        Телефон: {user?.phone || 'Не указан'}
                                    </span>
                                    <Button
                                        onClick={() => {
                                            setIsEditingPhone(!isEditingPhone)
                                            setNewPhone(user?.phone || '')
                                            setPhoneError('')
                                        }}
                                        className="text-sm rounded sm:!p-1">
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

                            <p className="flex mt-4 text-lg text-gray-700 items-center flex-col sm:flex-row">
                                Роль:
                                {user?.role === 'seller' ? (
                                    <>
                                        <span className="text-[#4438ca] ms-2 me-2">
                                            {'  '}Продавец -{'  '}
                                        </span>
                                        <Button
                                            className="text-sm rounded sm:!p-1"
                                            onClick={() =>
                                                changeRole()
                                            }>
                                            Стать покупателем
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-[#4438ca] ms-2 me-2">
                                            {'  '}Покупатель -{'  '}
                                        </span>
                                        {user?.verification_status == "pending" ? (
                                            <span>Вы подали заявку на верификацию как продавца</span>
                                        ) : (
                                            <Button
                                                className="text-sm rounded sm:!p-1"
                                                onClick={() =>
                                                    changeRole({
                                                        url: '/api/change_role/seller',
                                                    })
                                                }>
                                                Стать продавцом
                                            </Button>)}

                                    </>
                                )}
                            </p>

                            {user?.role === 'seller' && (
                                <div className="mt-8">
                                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                        {/* Header with logo and company name */}
                                        <div className="relative h-48 bg-gradient-to-r from-[#4438ca] to-[#6d64ff]">
                                            <div
                                                className="absolute -bottom-12 left-8"
                                                onMouseEnter={() => setLogoHover(true)}
                                                onMouseLeave={() => setLogoHover(false)}
                                            >
                                                <div className="relative w-24 h-24">
                                                    {user?.logo ? (
                                                        <Image
                                                            src={user.logo}
                                                            alt="Логотип компании"
                                                            width={200}
                                                            height={200}
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

                                                    {/* Only show overlay when hovering OR when there's no logo */}
                                                    {(logoHover || !user?.logo) && (
                                                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
                                                            <button
                                                                type="button"
                                                                className="text-white bg-indigo-600 hover:bg-indigo-700 rounded-full p-2"
                                                                onClick={() => fileInputRef.current.click()}
                                                                disabled={logoUploading}
                                                                title="Загрузить логотип"
                                                            >
                                                                <PlusIcon className="w-5 h-5" />
                                                            </button>

                                                            {user?.logo && (
                                                                <button
                                                                    type="button"
                                                                    className="text-white bg-red-600 hover:bg-red-700 rounded-full p-2 absolute top-2 right-2"
                                                                    onClick={handleRemoveLogo}
                                                                    disabled={logoUploading}
                                                                    title="Удалить логотип"
                                                                >
                                                                    <XMarkIcon className="w-2 h-2" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        ref={fileInputRef}
                                                        className="hidden"
                                                        onChange={handleLogoChange}
                                                        disabled={logoUploading}
                                                    />

                                                    {logoUploading && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 rounded-lg">
                                                            <Loader />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 left-40">
                                                <h3 className="text-xl sm:text-2xl font-bold text-white">
                                                    {user?.seller_type == 'individual' ? 
                                                    (user?.name) : 
                                                    (
                                                        user?.company_name ||
                                                        'Название компании не указано'
                                                        )
                                                        }
                                                        
                                                </h3>
                                            </div>
                                        </div>
                                        {/* Основная информация */}
                                        <div className="pt-16 pb-8 px-4 sm:px-8">
                                            <div className="m-4 flex justify-center space-x-2 mb-4 sm:hidden">
                                                <button
                                                    type="button"
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
                                                    onClick={() => fileInputRef.current.click()}
                                                    disabled={logoUploading}
                                                >
                                                    <PlusIcon className="w-4 h-4 mr-1" />
                                                    Загрузить логотип
                                                </button>

                                                {user?.logo && (
                                                    <button
                                                        type="button"
                                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
                                                        onClick={handleRemoveLogo}
                                                        disabled={logoUploading}
                                                    >
                                                        <XMarkIcon className="w-4 h-4 mr-1" />
                                                        Удалить логотип
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex-col flex sm:grid sm:grid-cols-1 md:grid-cols-2  sm:gap-0 md:gap-8">

                                                {/* Статус верификации */}
                                                <div className="col-span-2 flex flex-col align-items-center justify-center sm:flex-row mb-4 sm:mb-0 w-full items-center sm:justify-evenly">
                                                    <div
                                                        className={`inline-flex items-center px-4 py-2 rounded-full mb-2 sm:mb-0 ${user?.is_verify
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                        <svg
                                                            className={`w-5 h-5 mr-2 ${user?.is_verify
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
                                                            {user?.seller_type == 'individual' ? ('Паспорт') : ('ИНН')}
                                                            
                                                        </h4>
                                                        <p className="mt-1 text-lg font-medium">
                                                            {user?.seller_type == 'individual'? (user?.passport_number || 'Не указан') : (user?.inn || 'Не указан')}
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
                                                        {user?.seller_type == 'individual' ? ('Дата становления продавцом') : ('Адрес')}
                                                        </h4>
                                                        <p className="mt-1 text-lg font-medium">
                                                            {user?.seller_type == 'individual'? (verif_date) : (user?.address || 'Не указан')}
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

            {user?.verification_status == "pending" ? (
                <>
                    <div className="pb-6 sm:pb-12">
                        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 bg-white border-b border-gray-200">
                                    <h2 className="text-3xl font-bold text-[#4438ca]">
                                        Ваша заявка на расмотрении
                                    </h2>
                                    <p className="text-gray-600">
                                        Мы рассмотрим вашу заявку и свяжемся с вами в ближайшее время.</p>
                                </div>
                                </div>
                                </div></div>

                    </>
                    ) : (null)
                    }


                    {user?.role === 'customer' ? (
                        <div className="pb-6 sm:pb-12">
                            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6 bg-white border-b border-gray-200">
                                        <div className="flex justify-between items-center mb-6 flex-col gap-4 sm:flex-row">
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

