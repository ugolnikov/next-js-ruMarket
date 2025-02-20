import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const CartIcon = ({ cartCount }) => {
    const router = useRouter()

    const handleCartClick = () => {
        router.push('/cart')
    }

    return (
        <motion.div
            className="relative cursor-pointer"
            onClick={handleCartClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-[#4438ca] hover:text-[#19144d] transition-colors duration-300"
            >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            
            {cartCount > 0 && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                >
                    {cartCount}
                </motion.span>
            )}
        </motion.div>
    )
}

export default CartIcon
