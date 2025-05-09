'use client'
import { useAuth } from '@/hooks/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Button from '@/components/Button'
import axios from '@/lib/axios'
import Loader from '@/components/Loader'
import { useCart } from '@/hooks/cart'

const Checkout = () => {
    const router = useRouter()
    const { user } = useAuth()
    const { cart, clearCart, isLoading: cartLoading } = useCart()
    const [totalPrice, setTotalPrice] = useState(0)

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
    })

    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState('')

    // Подставляем данные пользователя при загрузке
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
            }))
        }
    }, [user])

    useEffect(() => {
        if (cart?.items && Array.isArray(cart.items)) {
            const total = cart.items.reduce(
                (sum, item) => sum + item.product.price, // Remove quantity multiplication
                0,
            )
            setTotalPrice(total)
        }
    }, [cart])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        setErrors(prev => ({
            ...prev,
            [name]: ''
        }))
    }

    const validateForm = () => {
        const newErrors = {}

        // Проверка ФИО
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'ФИО обязательно для заполнения'
        }

        // Проверка email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!formData.email.trim()) {
            newErrors.email = 'Email обязателен для заполнения'
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Введите корректный email'
        }

        // Проверка телефона
        const phoneRegex = /^\+7\d{10}$/
        if (!formData.phone.trim()) {
            newErrors.phone = 'Номер телефона обязателен для заполнения'
        } else if (!phoneRegex.test(formData.phone)) {
            newErrors.phone = 'Введите корректный номер телефона в формате +7XXXXXXXXXX'
        }

        // Проверка адреса
        if (!formData.address.trim()) {
            newErrors.address = 'Адрес обязателен для заполнения'
        }

        return newErrors
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrors({})
        setSuccess('')

        const validationErrors = validateForm()
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            setIsSubmitting(false)
            return
        }

        try {
            if (!cart?.items || !Array.isArray(cart.items) || cart.items.length === 0) {
                throw new Error('Cart is empty')
            }

            const orderData = {
                shipping_address: {
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address
                },
                items: cart.items.map(item => ({
                    product_id: Number(item.product.id),
                    quantity: Number(item.quantity),
                    price: Number(item.product.price)
                }))
            }

            const response = await axios.post('/api/orders', orderData)
            
            if (response.data.order) {
                setSuccess('Заказ успешно оформлен!')
                
                try {
                    await clearCart()
                } catch (clearError) {
                    console.error('Error clearing cart:', clearError)
                }
                
                // Redirect to the order details page
                router.push(`/dashboard/orders/order/${response.data.order.orderNumber}?success=true`)
            } else {
                throw new Error('Неверный формат ответа от сервера')
            }
        } catch (error) {
            console.error('Error creating order:', error)
            setErrors(prev => ({
                ...prev,
                submit: error.response?.data?.error || 'Произошла ошибка при оформлении заказа'
            }))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (cartLoading) return <Loader />

    if (!cart?.items || !Array.isArray(cart.items) || cart.items.length === 0) {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-6">
                <p className="text-center text-gray-600">
                    Ваша корзина пуста. Добавьте товары для оформления заказа.
                </p>
            </div>
        )
    }

    return (
        <div className="py-12">
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 bg-white border-b border-gray-200">
                        <h2 className="text-2xl font-bold mb-4">Оформление заказа</h2>
                        {success && (
                            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
                                {success}
                            </div>
                        )}
                        {errors.submit && (
                            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                                {errors.submit}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    ФИО
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                                        errors.fullName ? 'border-red-500' : ''
                                    }`}
                                />
                                {errors.fullName && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.fullName}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                                        errors.email ? 'border-red-500' : ''
                                    }`}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Телефон
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+7XXXXXXXXXX"
                                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                                        errors.phone ? 'border-red-500' : ''
                                    }`}
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Адрес доставки
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="3"
                                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                                        errors.address ? 'border-red-500' : ''
                                    }`}
                                />
                                {errors.address && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.address}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-between items-center mt-6">
                                <div>
                                    <p className="text-lg font-semibold">
                                        Итого к оплате: {totalPrice}₽
                                    </p>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={isSubmitting ? 'opacity-50' : ''}>
                                    {isSubmitting
                                        ? 'Оформление...'
                                        : 'Оформить заказ'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout
