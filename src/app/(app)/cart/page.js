'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/auth'
import { useCart } from '@/hooks/cart'
import Loader from '@/components/Loader'
import Button from '@/components/Button'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Header from '@/components/Header'
import Image from 'next/image'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'

const CartPage = () => {
    
    const { user } = useAuth()
    const { cart, mutateCart, removeFromCart } = useCart()

    const [loading, setLoading] = useState(false)
    const [totalPrice, setTotalPrice] = useState(0)
    const [removingItems, setRemovingItems] = useState([])
    const [commissionPercent, setCommissionPercent] = useState(0)
    const [commissionAmount, setCommissionAmount] = useState(0)
    
    const router = useRouter()
    
    useEffect(() => {
        if (!user || user.role !== 'customer') {
            router.push('/login')
        }
    }, [user, router])

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

    useEffect(() => {
        if (cart?.items && Array.isArray(cart.items)) {
            const subtotal = cart.items.reduce(
                (sum, item) => sum + item.product.price,
                0,
            )
            const commission = subtotal * (commissionPercent / 100)
            setCommissionAmount(commission)
            setTotalPrice(subtotal + commission)
        }
    }, [cart, commissionPercent])

    const handleRemoveItem = async cartId => {
        setRemovingItems(prev => [...prev, cartId])
        setLoading(true)
        try {
            await removeFromCart(cartId)
        } catch (error) {
            console.error('Ошибка при удалении товара из корзины:', error)
        } finally {
            setLoading(false)
            setRemovingItems(prev => prev.filter(id => id !== cartId))
        }
    }

    const handleCheckout = () => {
        router.push('/cart/checkout')
    }

    if (loading && !cart) {
        return <Loader />
    }

    if (!cart?.items || !Array.isArray(cart.items) || cart.items.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl mx-auto mt-10 p-6"
            >
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="flex justify-center mb-6"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </motion.div>
                <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-gray-600 text-lg"
                >
                    Ваша корзина пуста. Добавьте товары для оформления заказа.
                </motion.p>
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-center mt-6"
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button onClick={() => router.push('/')} className="flex items-center bg-[#4438ca] hover:bg-[#19144d] rounded">
                            Вернуться к покупкам
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Button>
                    </motion.div>
                </motion.div>
            </motion.div>
        )
    }
    
    return (
        <>
        <Head>
            <title>Корзина</title>
        </Head>
        <Header title="Корзина"/>
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-[20%] py-12 flex flex-col w-[80%] mx-auto sm:px-10"
        >
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex-grow bg-white rounded-lg shadow-lg overflow-hidden w-full sm:px-10 flex align-center justify-center flex-col"
            >
                <motion.div 
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-4 border-b border-gray-200 bg-gray-50"
                >
                    <h2 className="text-xl font-semibold flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Ваша корзина ({cart.items.length})
                    </h2>
                </motion.div>
                
                <AnimatePresence>
                    {cart.items.map((item, index) => {
                        const firstImage = item.product.image_preview 
                        const isRemoving = removingItems.includes(item.id)
                        
                        return (
                            <motion.div
                                key={item.product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: index * 0.1 }}
                                data-testid="cart-item"
                                className={`flex flex-col md:flex-row justify-between items-center border-b p-4 hover:bg-gray-50 transition duration-300 ${isRemoving ? 'opacity-50' : ''}`}
                            >
                                <div className="w-full md:w-1/4 flex justify-center md:justify-start mb-4 md:mb-0">
                                    <motion.div 
                                        whileHover={{ scale: 1.05 }}
                                        className="relative w-24 h-24"
                                    >
                                        <Image
                                            src={firstImage}
                                            alt={item.product.name}
                                            fill
                                            sizes="(max-width: 768px) 96px, 96px"
                                            loading="lazy"
                                            placeholder="blur"
                                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkMjU1LS0yMi4qLjgyPj4+ODhAQEA4QEBAPj4+ODg4ODg4ODg4ODj/2wBDAR4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                                            className="object-cover rounded-lg shadow"
                                        />
                                    </motion.div>
                                </div>
                                <div className="w-full md:w-1/4">
                                    <p className="font-semibold text-gray-700">Продукт:</p>
                                    <p className="text-gray-900 font-medium">{item.product.name}</p>
                                </div>
                                <div className="w-full md:w-1/4">
                                    <p className="font-semibold text-gray-700">Цена:</p>
                                    <motion.p 
                                        initial={{ scale: 1 }}
                                        whileHover={{ scale: 1.05 }}
                                        className="text-gray-900 font-medium"
                                    >
                                        {item.product.price.toLocaleString('ru-RU')}₽
                                    </motion.p>
                                </div>
                                <div className="w-full md:w-1/4 flex justify-center">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Button
                                            data-testid="remove-from-cart"
                                            onClick={() => handleRemoveItem(item.id)}
                                            disabled={isRemoving}
                                            className="bg-red-500 hover:bg-red-600 rounded flex items-center"
                                        >
                                            {isRemoving ? (
                                                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            )}
                                            Удалить
                                        </Button>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
                <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="my-5 p-5"
            >
                <h3 className="text-lg font-semibold mb-4">Способы оплаты</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div 
                        whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                        className="border rounded-lg p-4 flex items-center"
                    >
                        <div className="bg-blue-100 p-3 rounded-full mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-medium">Банковская карта</h4>
                            <p className="text-sm text-gray-600">Visa, MasterCard, Мир</p>
                        </div>
                    </motion.div>
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="border rounded-lg p-4 flex items-center opacity-50"
                    >
                        <div className="bg-gray-100 p-3 rounded-full mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-medium">Электронные кошельки</h4>
                            <p className="text-sm text-gray-600">Недоступно</p>
                        </div>
                    </motion.div>
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="border rounded-lg p-4 flex items-center opacity-50"
                    >
                        <div className="bg-gray-100 p-3 rounded-full mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-medium">Наличными при получении</h4>
                            <p className="text-sm text-gray-600">Недоступно</p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-center p-6 bg-gray-50 bg-white rounded-lg shadow-lg p-6 my-6"
                >
                    
                    <div className="mb-4 md:mb-0">
                        <p className="font-semibold text-gray-700">Промежуточный итог:</p>
                        <p className="text-gray-900">
                            {(totalPrice - commissionAmount).toLocaleString('ru-RU')}₽
                        </p>
                        <p className="font-semibold text-gray-700 mt-2">Комиссия маркетплейса ({commissionPercent}%):</p>
                        <p className="text-gray-900">
                            {commissionAmount.toLocaleString('ru-RU')}₽
                        </p>
                        <p className="font-semibold text-gray-700 mt-2">Итого:</p>
                        <motion.p 
                            initial={{ scale: 1 }}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="text-2xl font-bold text-gray-900"
                        >
                            {totalPrice.toLocaleString('ru-RU')}₽
                        </motion.p>
                    </div>
                    <div className="flex gap-5 sm:gap-0 items-center justify-center sm:space-x-4 flex-col-reverse sm:flex-row">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button 
                                onClick={() => router.push('/')} 
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded"
                            >
                                Продолжить покупки
                            </Button>
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Button 
                                onClick={handleCheckout} 
                                className="bg-[#4438ca] hover:bg-[#19144d] rounded flex items-center"
                            >
                                Оформить заказ
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
            
            {/* Payment Methods Information */}
            
            
            
            
            
            
        </motion.div>
        </>
    )
}

export default CartPage
