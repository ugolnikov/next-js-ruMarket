import { useState } from 'react'
import { useAuth } from '@/hooks/auth'
import { useCart } from '@/hooks/cart'
import Button from '@/components/Button'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const AddToCartBtn = ({ productId }) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const { user } = useAuth({ middleware: 'guest' })
    const { addToCart } = useCart()
    const router = useRouter()

    const handleClick = async () => {
        setLoading(true)
        setError(null)

        if (!user) {
            router.push('/login')
            return
        }

        try {
            await addToCart(productId, 1)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 1500)
        } catch (error) {
            console.error('Error adding to cart:', error)
            setError(error.response?.data?.error || 'Ошибка при добавлении в корзину')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <motion.div
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
            >
                <Button
                    onClick={handleClick}
                    disabled={loading}
                    className={`rounded ${success ? 'bg-green-500 hover:bg-green-600' : ''} transition-all duration-300`}
                >
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.span
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                Добавление...
                            </motion.span>
                        ) : success ? (
                            <motion.span
                                key="success"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                ✓ Добавлено!
                            </motion.span>
                        ) : (
                            <motion.span
                                key="default"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                В корзину
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Button>
            </motion.div>
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                >
                    {error}
                </motion.p>
            )}
        </div>
    )
}

export default AddToCartBtn
