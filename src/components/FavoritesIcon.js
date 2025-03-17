'use client'
import { useState } from 'react'
import { useFavorites } from '@/hooks/favorites'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const FavoritesIcon = () => {
    const [isHovered, setIsHovered] = useState(false)
    const { favorites } = useFavorites()
    const favoritesCount = favorites?.items?.length || 0

    return (
        <div className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>
            <Link href="/dashboard/favorites" className="relative flex items-center">
                <svg
                    className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                </svg>
                {favoritesCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {favoritesCount}
                    </span>
                )}
            </Link>

            <AnimatePresence>
                {isHovered && favorites?.items?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-50"
                    >
                        <div className="py-2 max-h-96 overflow-auto">
                            {favorites.items.map(item => (
                                <Link
                                    key={item.id}
                                    href={`/product/${item.product_id}`}
                                    className="flex items-center px-4 py-2 hover:bg-gray-100">
                                    <img
                                        src={item.products.image_preview || '/images/no-image.png'}
                                        alt={item.products.name}
                                        className="w-10 h-10 object-cover rounded"
                                    />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900 truncate whitespace-normal">
                                            {item.products.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            ₽{item.products.price}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default FavoritesIcon