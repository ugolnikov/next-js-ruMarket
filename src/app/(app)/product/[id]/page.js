'use client'
import { useAuth } from '@/hooks/auth'
import { useState, useEffect } from 'react'
import { use } from 'react'
import Loader from '@/components/Loader'
import axios from '@/lib/axios'
import ImageFallback from '@/components/ImageFallback'
import { useCart } from '@/hooks/cart'
import Button from '@/components/Button'

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
            await addToCart(product.data.id, 1)
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

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                    <div className="relative w-full" style={{ height: '500px' }}>
                        <ImageFallback
                            src={product.data.image_preview}
                            alt={product.data.name}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="rounded-lg"
                        />
                    </div>
                    <div className="flex flex-col justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-4">{product.data.name}</h1>
                            <p className="text-gray-600 mb-6 text-lg">{product.data.description}</p>
                            <div className="flex items-center mb-6">
                                <span className="text-3xl font-bold text-indigo-600">
                                    {product.data.price} ₽
                                </span>
                            </div>
                        </div>
                        
                        {user?.role === 'customer' && (
                            <div className="mt-6">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={addingToCart}
                                    className={`w-full py-3 ${
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
                    </div>
                </div>
            </div>
        </div>
    )
}
