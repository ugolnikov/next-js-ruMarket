import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/auth'
import { useCart } from '@/hooks/cart'
import Button from '@/components/Button'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const AddToCartBtn = ({ productId }) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [isInCart, setIsInCart] = useState(false)
    const [cartItemId, setCartItemId] = useState(null)
    const { user } = useAuth({ middleware: 'guest' })
    const { cart, addToCart, removeFromCart } = useCart()
    const router = useRouter()

    // Check if product is already in cart
    useEffect(() => {
        if (cart?.items && Array.isArray(cart.items)) {
            const cartItem = cart.items.find(item => Number(item.product.id) === Number(productId))
            if (cartItem) {
                setIsInCart(true)
                setCartItemId(cartItem.id)
            } else {
                setIsInCart(false)
                setCartItemId(null)
            }
        }
    }, [cart, productId])

    const handleClick = async () => {
        setLoading(true)
        setError(null)

        if (!user) {
            router.push('/login')
            return
        }

        try {
            if (isInCart && cartItemId) {
                // Remove from cart if already in cart
                await removeFromCart(cartItemId)
                setIsInCart(false)
                setCartItemId(null)
                setSuccess(true)
                setTimeout(() => setSuccess(false), 1500)
            } else {
                // Add to cart
                await addToCart(productId)
                setIsInCart(true)
                setSuccess(true)
                setTimeout(() => setSuccess(false), 1500)
            }
        } catch (error) {
            console.error('Error managing cart:', error)
            if (error.response?.status === 409) {
                setError('Этот товар уже добавлен в корзину')
            } else {
                setError(error.response?.data?.error || 'Ошибка при управлении корзиной')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <motion.div
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                style={{
                    transformOrigin: 'center', 
                    width: 'fit-content', 
                }}
                // className="mx-auto"
            >
                <Button
                    onClick={handleClick}
                    disabled={loading}
                    className={`rounded ${success ? 'bg-green-500 hover:bg-green-600' : isInCart ? 'bg-gray-500 hover:bg-gray-600' : ''} transition-all duration-300 px-6 py-3 addToCartBTN`}
                >
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.span
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {isInCart ? 'Удаление...' : 'Добавление...'}
                            </motion.span>
                        ) : success ? (
                            <motion.span
                                key="success"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                ✓ {isInCart ? 'Добавлено!' : 'Удалено!'}
                            </motion.span>
                        ) : isInCart ? (
                            <motion.span
                                key="remove"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                Удалить из корзины
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
