'use client'
import { useAuth } from '@/hooks/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Button from '@/components/Button'
import axios from '@/lib/axios'
import Loader from '@/components/Loader'
import { useCart } from '@/hooks/cart'
import CardPaymentForm from '@/components/CardPaymentForm'
import { motion } from 'framer-motion'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

const Checkout = () => {
    const router = useRouter()
    const { user } = useAuth()
    const { cart, clearCart, isLoading: cartLoading } = useCart()
    const [totalPrice, setTotalPrice] = useState(0)
    const [showPaymentForm, setShowPaymentForm] = useState(false)
    const [paymentId, setPaymentId] = useState(null)
    const [paymentStatus, setPaymentStatus] = useState('pending') // 'pending', 'processing', 'success', 'failed'
    const [commissionPercent, setCommissionPercent] = useState(0)
    const [commissionAmount, setCommissionAmount] = useState(0)

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

    // Получаем комиссию маркетплейса
    useEffect(() => {
        async function fetchCommission() {
            try {
                const res = await axios.get('/api/admin/settings')
                setCommissionPercent(Number(res.data.commission) || 0)
            } catch {
                setCommissionPercent(0)
            }
        }
        fetchCommission()
    }, [])

    // Пересчитываем комиссию и итоговую сумму
    useEffect(() => {
        if (cart?.items && Array.isArray(cart.items)) {
            const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
            const commission = subtotal * (commissionPercent / 100)
            setCommissionAmount(commission)
            setTotalPrice(subtotal + commission)
        }
    }, [cart, commissionPercent])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.fullName) newErrors.fullName = 'Имя обязательно'
        if (!formData.email) newErrors.email = 'Email обязателен'
        if (!formData.phone) newErrors.phone = 'Телефон обязателен'
        if (!formData.address) newErrors.address = 'Адрес обязателен'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        // Show payment form instead of submitting order
        setShowPaymentForm(true)
    }

    const handlePaymentSuccess = async (newPaymentId) => {
        setPaymentId(newPaymentId)
        setPaymentStatus('processing')
        setIsSubmitting(true)

        try {
            // Now submit the order with payment information
            const response = await axios.post('/api/orders', {
                items: cart.items.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price
                })),
                shipping_address: formData,
                payment_id: newPaymentId,
                paid: true
            })

            // Clear cart and set success status
            await clearCart()
            setPaymentStatus('success')
            setSuccess('Заказ успешно оформлен!')
            router.push(`/dashboard/orders/order/${response.data.order.orderNumber}?success=true`)
        } catch (error) {
            console.error('Error creating order:', error)
            setPaymentStatus('failed')
            setErrors({ form: error.response?.data?.error || 'Ошибка при оформлении заказа' })
            setShowPaymentForm(false)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handlePaymentCancel = () => {
        setShowPaymentForm(false)
        setPaymentStatus('pending')
    }

    if (cartLoading) {
        return <Loader />
    }

    if (!cart?.items || cart.items.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            >
                <div className="text-center">
                    <motion.h2
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="text-2xl font-bold mb-4"
                    >
                        Ваша корзина пуста
                    </motion.h2>
                    <motion.p
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-4"
                    >
                        Добавьте товары в корзину, чтобы оформить заказ
                    </motion.p>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button onClick={() => router.push('/')}>
                            Вернуться к покупкам
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
        )
    }

    // Payment status indicator component
    const PaymentStatusIndicator = () => {
        if (paymentStatus === 'pending') return null;

        const statusConfig = {
            processing: {
                text: 'Обработка платежа...',
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-700',
                icon: (
                    <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )
            },
            success: {
                text: 'Платеж успешно обработан!',
                bgColor: 'bg-green-50',
                textColor: 'text-green-700',
                icon: <CheckCircleIcon className="h-5 w-5 mr-3 text-green-600" />
            },
            failed: {
                text: 'Ошибка при обработке платежа',
                bgColor: 'bg-red-50',
                textColor: 'text-red-700',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            }
        };

        const config = statusConfig[paymentStatus];

        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 ${config.bgColor} rounded-md flex items-center`}
            >
                {config.icon}
                <p className={config.textColor}>{config.text}</p>
                {paymentStatus === 'success' && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="ml-auto"
                    >
                        <CheckCircleIcon className="h-8 w-8 text-green-500" />
                    </motion.div>
                )}
            </motion.div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
            <motion.h1
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="text-2xl font-bold mb-6"
            >
                Оформление заказа
            </motion.h1>

            <PaymentStatusIndicator />

            {success && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-50 rounded-md flex items-center"
                >
                    <CheckCircleIcon className="h-5 w-5 mr-3 text-green-600" />
                    <p className="text-green-700">{success}</p>
                </motion.div>
            )}

            {errors.form && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 rounded-md"
                >
                    <p className="text-red-700">{errors.form}</p>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Shipping Information Form */}
                {!showPaymentForm ? (
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-6 rounded-lg shadow-md"
                    >
                        <h2 className="text-xl font-semibold mb-4">Информация о доставке</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">
                                    ФИО
                                </label>
                                <motion.input
                                    whileFocus={{ boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)" }}
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                                    Email
                                </label>
                                <motion.input
                                    whileFocus={{ boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)" }}
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                                    Телефон
                                </label>
                                <motion.input
                                    whileFocus={{ boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)" }}
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                                    Адрес доставки
                                </label>
                                <motion.textarea
                                    whileFocus={{ boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)" }}
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="3"
                                    className={`w-full px-3 py-2 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                                ></motion.textarea>
                                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                            </div>

                            <div className="mt-6">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        type="submit"
                                        className="bg-[#4438ca] hover:bg-[#19144d] rounded w-full text-center"
                                        disabled={isSubmitting}
                                    >
                                        Перейти к оплате
                                    </Button>
                                </motion.div>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <CardPaymentForm
                            amount={totalPrice}
                            onPaymentSuccess={handlePaymentSuccess}
                            onCancel={handlePaymentCancel}
                        />
                    </motion.div>
                )}

                {/* Order Summary */}
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-lg shadow-md"
                >
                    <h2 className="text-xl font-semibold mb-4">Ваш заказ</h2>

                    <div className="divide-y divide-gray-200">
                        {cart.items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="py-4 flex justify-between"
                            >
                                <div>
                                    <h3 className="text-sm font-medium">{item.product.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {item.product.description.length > 50
                                            ? item.product.description.slice(0, 50) + '...'
                                            : item.product.description}
                                    </p>
                                </div>
                                <p className="text-sm font-medium">
                                    {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6 border-t border-gray-200 pt-4"
                    >
                        <div className="flex justify-between">
                            <p className="text-sm">Промежуточный итог</p>
                            <p className="text-sm">{(totalPrice - commissionAmount).toLocaleString('ru-RU')} ₽</p>
                        </div>
                        <div className="flex justify-between mt-1">
                            <p className="text-sm">Комиссия маркетплейса ({commissionPercent}%)</p>
                            <p className="text-sm">{commissionAmount.toLocaleString('ru-RU')} ₽</p>
                        </div>
                        <div className="flex justify-between mt-2 font-bold">
                            <p className="text-lg">Итого к оплате</p>
                            <motion.p
                                className="text-lg font-bold"
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                            >
                                {totalPrice.toLocaleString('ru-RU')} ₽
                            </motion.p>
                        </div>
                    </motion.div>

                    {/* Payment Status Display */}
                    {paymentId && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ delay: 0.3 }}
                            className="mt-6 pt-4 border-t border-gray-200"
                        >
                            <h3 className="text-md font-semibold mb-2">Информация об оплате</h3>
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-gray-600">ID платежа:</span>
                                    <span className="text-sm font-medium">{paymentId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Статус:</span>
                                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${paymentStatus === 'success' ? 'bg-green-100 text-green-800' :
                                            paymentStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {paymentStatus === 'success' ? 'Оплачен' :
                                            paymentStatus === 'processing' ? 'Обработка' :
                                                paymentStatus === 'failed' ? 'Ошибка' :
                                                    'Ожидание'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    )
}

export default Checkout
