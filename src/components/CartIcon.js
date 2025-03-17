'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/hooks/cart'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

const CartIcon = () => {
    const [isHovered, setIsHovered] = useState(false)
    const { cart } = useCart()
    const cartCount = cart?.items?.length || 0

    return (
        <div className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>
            <Link href="/cart" className="relative flex items-center">
                <svg
                    className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
                {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartCount}
                    </span>
                )}
            </Link>

            <AnimatePresence>
                {isHovered && cart?.items?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-50"
                    >
                        <div className="py-2 max-h-96 overflow-auto">
                            {cart.items.map(item => (
                                <Link
                                    key={item.id}
                                    href={`/product/${item.product.id}`}
                                    className="flex items-center px-4 py-2 hover:bg-gray-100">
                                    <Image
                                        src={item.product?.image_preview || '/images/no-image.png'}
                                        alt={item.product?.name}
                                        width="200"
                                        height="200"
                                        className="w-10 h-10 object-cover rounded"
                                    />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {item.product?.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {item.quantity} × ₽{item.product?.price}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="border-t border-gray-100 p-4">
                            <Link
                                href="/cart"
                                className="block w-full text-center bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700">
                                Перейти в корзину
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default CartIcon
