import { useState } from 'react'
import { useAuth } from '@/hooks/auth'
import { useCart } from '@/hooks/cart'
import Button from '@/components/Button'
import { useRouter } from 'next/navigation'

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
            <Button
                onClick={handleClick}
                disabled={loading}
                className={`rounded ${success ? 'bg-green-500 hover:bg-green-500' : ''} transition-colors duration-300`}>
                {loading ? 'Добавление...' : success ? 'Добавлено!' : 'Добавить в корзину'}
            </Button>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    )
}

export default AddToCartBtn
