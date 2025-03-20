'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/auth'
import { useFavorites } from '@/hooks/favorites'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const FavoriteButton = ({ productId }) => {
    const [isInFavorites, setIsInFavorites] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { user } = useAuth({ middleware: 'guest' })
    const { favorites, addToFavorites, removeFromFavorites } = useFavorites()
    const router = useRouter()

    useEffect(() => {
        if (favorites?.items) {
            setIsInFavorites(favorites.items.some(item => item.product_id === productId))
        }
    }, [favorites, productId])

    const handleClick = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (!user) {
            router.push('/login')
            return
        }

        setIsLoading(true)
        try {
            if (isInFavorites) {
                await removeFromFavorites(productId)
            } else {
                await addToFavorites(productId)
            }
        } catch (error) {
            console.error('Error toggling favorite:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.button
            onClick={handleClick}
            disabled={isLoading}
            data-testid="add-to-favorites"
            whileTap={{ scale: 0.9 }}
            className={`p-1.5 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 ${
                isLoading ? 'opacity-50' : ''
            }`}
            title={isInFavorites ? 'Remove from favorites' : 'Add to favorites'}
        >
            <AnimatePresence mode="wait">
                <motion.svg
                    key={isInFavorites ? 'filled' : 'empty'}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={`w-6 h-6 ${
                        isInFavorites ? 'text-red-500' : 'text-gray-400'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={isInFavorites ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={isInFavorites ? "0" : "2"}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                    />
                </motion.svg>
            </AnimatePresence>
        </motion.button>
    )
}

export default FavoriteButton