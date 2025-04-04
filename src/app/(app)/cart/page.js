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

const CartPage = () => {
    
    const { user } = useAuth()
    const { cart, mutateCart, removeFromCart } = useCart()

    const [loading, setLoading] = useState(false)
    const [totalPrice, setTotalPrice] = useState(0)
    
    const router = useRouter()
    
    useEffect(() => {
        if (!user || user.role !== 'customer') {
            router.push('/login')
        }
    }, [user, router])

    useEffect(() => {
        if (cart?.items && Array.isArray(cart.items)) {
            const total = cart.items.reduce(
                (sum, item) => sum + item.product.price * item.quantity,
                0,
            )
            setTotalPrice(total)
        }
    }, [cart])

    const handleRemoveItem = async cartId => {
        setLoading(true)
        try {
            await removeFromCart(cartId)
        } catch (error) {
            console.error('Ошибка при удалении товара из корзины:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCheckout = () => {
        router.push('/cart/checkout')
    }

    if (loading || !cart) {
        return <Loader />
    }

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
        <>
        <Head>
            <title>Корзина</title>
        </Head>
        <Header title="Корзина"/>
        <div className="min-h-[20%] py-12 flex flex-col">
            <div className="flex-grow bg-white rounded-lg shadow-lg overflow-hidden w-full sm:px-10 mb-6 flex align-center justify-center flex-col">
                {cart.items.map(item => {
                    const firstImage = item.product.image_preview 
                    return (
                        <div
                            key={item.product.id}
                            data-testid="cart-item"
                            className="flex flex-col md:flex-row justify-between items-center border-b p-4 hover:bg-[#dddddd] transition duration-300">
                            <div className="w-full md:w-1/5 flex justify-center md:justify-start mb-4 md:mb-0">
                                <div className="relative w-24 h-24">
                                    <Image
                                        src={firstImage}
                                        alt={item.product.name}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        className="object-cover rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-1/5">
                                <p className="font-semibold">Продукт:</p>
                                <p>{item.product.name}</p>
                            </div>
                            <div className="w-full md:w-1/5">
                                <p className="font-semibold">Цена:</p>
                                <p>{item.product.price}₽</p>
                            </div>
                            <div className="w-full md:w-1/5">
                                <p className="font-semibold">Количество:</p>
                                <p>{item.quantity}</p>
                            </div>
                            <div className="w-full md:w-1/5 flex justify-center">
                                <Button
                                    data-testid="remove-from-cart"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="bg-red-500 hover:bg-red-600 rounded">
                                    Удалить
                                </Button>
                            </div>
                        </div>
                    )
                })}
                <div className="flex justify-between items-center p-4">
                    <div>
                        <p className="font-semibold">Итого:</p>
                        <p>{totalPrice}₽</p>
                    </div>
                    <Button onClick={handleCheckout} className="rounded">
                        Оформить заказ
                    </Button>
                </div>
            </div>
        </div>
        </>
    )
}

export default CartPage
