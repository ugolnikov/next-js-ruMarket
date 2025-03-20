'use client'
import { useAuth } from '@/hooks/auth'
import { useState, useEffect } from 'react'
import { use } from 'react'
import Loader from '@/components/Loader'
import axios from '@/lib/axios'
import ImageFallback from '@/components/ImageFallback'
import { useCart } from '@/hooks/cart'
import Button from '@/components/Button'
import Link from 'next/link'
import FavoriteButton from '@/components/FavoriteButton'

const loadProduct = async (id) => {
    try {
        const response = await axios.get(`/api/products/${id}`)
        return response.data
    } catch (error) {
        if (error.response?.status === 404) {
            return null
        }
        throw error
    }
}


export default function Page({ params }) {
    const { user } = useAuth()
    const { addToCart } = useCart()
    const [product, setProduct] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isError, setIsError] = useState(false)
    const [notFound, setNotFound] = useState(false)
    const [addingToCart, setAddingToCart] = useState(false)
    const [addToCartError, setAddToCartError] = useState(null)
    const [addToCartSuccess, setAddToCartSuccess] = useState(false)
    
    const resolvedParams = use(params)
    const id = resolvedParams.id

    const handleAddToCart = async () => {
        setAddingToCart(true)
        setAddToCartError(null)
        try {
            await addToCart(product.id, 1)
            setAddToCartSuccess(true)
            setTimeout(() => setAddToCartSuccess(false), 2000)
        } catch (error) {
            setAddToCartError('Ошибка при добавлении в корзину')
        } finally {
            setAddingToCart(false)
        }
    }

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return
            try {
                setIsLoading(true)
                setIsError(false)
                setNotFound(false)
                const response = await loadProduct(id)
                if (!response) {
                    setNotFound(true)
                } else {
                    setProduct(response)
                }
            } catch (error) {
                setIsError(true)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProduct()
    }, [id])

   

    if (isLoading) return <Loader />
    if (notFound)
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h1 className="text-3xl font-bold mb-4">Товар не найден</h1>
                <p className="text-gray-600">
                    К сожалению, запрашиваемый товар не существует.
                </p>
            </div>
        )
    if (isError) return <p>Ошибка загрузки товара</p>
    if (!product) return <p>Товар не найден</p>
    const parsed_description = product.description?.split("\n") || []
    return (
        <div className="container mx-auto px-4 py-8 my-2">
            <div 
                data-testid="product-detail"
                className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                    <div className="relative w-full" style={{ height: '500px' }}>
                        <ImageFallback
                            src={product.image_preview}
                            alt={product.name}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="rounded"
                        />
                    </div>
                    <div className="flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-3xl font-bold">{product.name}</h1>
                                <FavoriteButton productId={product.id} />
                            </div>
                            <div className="text-gray-600 mb-6 text-lg">
                                {parsed_description.map((element, index) => (
                                    <p key={index} className="mb-2">{element}</p>
                                ))}
                            </div>
                            <div className="flex items-center mb-6">
                                <span className="text-3xl font-bold text-indigo-600">
                                    {product.price} ₽
                                </span>
                            </div>
                            {user?.role === 'customer' && (
                            <div className="mt-6">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={addingToCart}
                                    className={`w-full py-3 rounded ${
                                        addToCartSuccess
                                            ? 'bg-green-500 hover:bg-green-600'
                                            : 'bg-indigo-600 hover:bg-indigo-700'
                                    } transition-colors duration-300`}>
                                    {addingToCart
                                        ? 'Добавление...'
                                        : addToCartSuccess
                                        ? 'Добавлено в корзину!'
                                        : 'Добавить в корзину'}
                                </Button>
                                {addToCartError && (
                                    <p className="text-red-500 text-sm mt-2">{addToCartError}</p>
                                )}
                            </div>
                        )}
                            {/* Updated Seller Information Section */}
                            <div className="border-t border-gray-200 pt-6 mb-6">
                                <h2 className="text-xl font-semibold mb-4">Информация о продавце</h2>
                                {product.seller ? (
                                    <div className="flex items-center space-x-4">
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                                            <ImageFallback
                                                src={product.seller.logo || '/images/default-avatar.png'}
                                                alt={product.seller.company_name || product.seller.name}
                                                fill
                                                style={{ objectFit: 'cover' }}
                                                className="rounded-full"
                                            />
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h3 className="font-medium text-lg">
                                                {product.seller.company_name || product.seller.name}
                                            </h3>
                                            <div className="text-gray-600 space-y-1 mt-2">
                                                {product.seller.address && (
                                                    <p className="flex items-center">
                                                        <span className="w-20 font-medium">Адрес:</span>
                                                        <span>{product.seller.address}</span>
                                                    </p>
                                                )}
                                                {product.seller.phone && (
                                                    <p className="flex items-center">
                                                        <span className="w-20 font-medium">Телефон:</span>
                                                        <span>{product.seller.phone}</span>
                                                    </p>
                                                )}
                                                {product.seller.email && (
                                                    <p className="flex items-center">
                                                        <span className="w-20 font-medium">Email:</span>
                                                        <span>{product.seller.email}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Информация о продавце недоступна</p>
                                )}
                            </div>
                        </div>
                        
                        
                    </div>
                </div>
            </div>
        </div>
    )
}
