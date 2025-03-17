'use client'
import Link from 'next/link'
import AddToCartButton from './AddToCartButton'
import { useAuth } from '@/hooks/auth'
import ImageFallback from './ImageFallback'
import FavoriteButton from './FavoriteButton'

const ProductCard = ({ product }) => {
    const { user } = useAuth()

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="relative">
                <Link href={`/product/${product.id}`} className="block">
                    <div className="relative w-full" style={{ height: '300px' }}>
                        <ImageFallback
                            src={product.image_preview}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{ objectFit: 'cover' }}
                            className="hover:opacity-75 transition-opacity duration-300"
                        />
                    </div>
                </Link>
                <div className="absolute top-2 right-2">
                    <FavoriteButton productId={product.id} />
                </div>
            </div>
            <div className="p-4">
                <div className="mb-4">
                    <Link href={`/product/${product.id}`} className="block">
                        <h3 className="text-lg font-semibold text-gray-800 hover:text-[#4438ca] mb-2">
                            {product.name}
                        </h3>
                    </Link>
                    <p className="text-gray-600 text-sm line-clamp-2">
                        {product.description}
                    </p>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#4438ca]">
                        {product.price}₽
                        <span className="text-sm text-gray-500 ml-1">
                            / {product.unit}
                        </span>
                    </span>
                    {user?.role === 'customer' && (
                        <div onClick={e => e.stopPropagation()}>
                            <AddToCartButton productId={product.id} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProductCard