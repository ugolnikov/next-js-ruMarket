'use client'
import * as React from "react";
import { useAuth } from '@/hooks/auth'
import { useState, useEffect } from 'react'
import { use } from 'react'
import Loader from '@/components/Loader'
import axios from '@/lib/axios'
import ImageFallback from '@/components/ImageFallback'
import { useCart } from '@/hooks/cart'
import FavoriteButton from '@/components/FavoriteButton'
import AddToCartButton from '@/components/AddToCartButton'
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

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
    const [lightboxOpen, setLightboxOpen] = useState(false);
    
    const resolvedParams = use(params)
    const id = resolvedParams.id

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return
            try {
                setIsLoading(true)
                setIsError(false)
                setNotFound(false)
                const response = await loadProduct(id)
                console.log(response)
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
    
    // Fix image URL formatting
    const imageUrl = product.image_preview 
        ? (product.image_preview.startsWith('http') 
            ? product.image_preview 
            : product.image_preview.startsWith('/') 
                ? product.image_preview 
                : `/${product.image_preview}`)
        : '/images/placeholder.jpg'
    
    // Fix seller logo URL formatting
    const sellerLogo = product.seller?.logo 
        ? (product.seller.logo.startsWith('http') 
            ? product.seller.logo 
            : product.seller.logo.startsWith('/') 
                ? product.seller.logo 
                : `/${product.seller.logo}`)
        : '/images/default-avatar.png'
    
    const parsed_description = product.full_description?.split("\n") || []
    return (
        <div className="container m-0 p-0 sm:mx-auto sm:px-4 sm:py-8 sm:my-2">
            <div 
                data-testid="product-detail"
                className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-2 sm:p-8">
                    <div className="relative w-full" style={{ height: '500px' }}>
                        <div
                            className="w-full h-full cursor-zoom-in group"
                            onClick={() => setLightboxOpen(true)}
                            style={{ position: 'relative' }}
                        >
                            <ImageFallback
                                src={imageUrl}
                                alt={product.name}
                                fill
                                sizes='(100w) 100vw'
                                priority={true}
                                className="rounded object-cover transition-transform duration-200 sm:group-hover:scale-105"
                            />
                            <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="bg-[#4438ca]/80 text-white px-4 py-2 rounded-lg text-lg font-semibold shadow-lg">Увеличить</span>
                            </div>
                        </div>
                        <Lightbox
                            open={lightboxOpen}
                            close={() => setLightboxOpen(false)}
                            slides={[{ src: imageUrl, alt: product.name }]}
                            plugins={[Zoom]}
                            animation={{ swipe: 400, fade: 200, zoom: 400, slide: 400 }}
                            zoom={{ maxZoomPixelRatio: 4 }}
                            render={{
                                buttonPrev: () => null,
                                buttonNext: () => null,
                            }}
                        />
                    </div>
                    <div className="flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-3xl font-bold">{product.name}</h1>
                                {user?.role === 'customer' && (
                                    <FavoriteButton productId={product.id} />
                                )}
                                
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
                            <div className="my-6">
                                <AddToCartButton productId={product.id} />
                            </div>
                        )}
                            {/* Updated Seller Information Section */}
                            <div className="border-t border-gray-200 pt-6 mb-6">
                                <h2 className="text-xl font-semibold mb-4">Информация о продавце</h2>
                                {product.seller ? (
                                    <div className="flex items-center space-x-4 flex-col gap-5 sm:flex-row">
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                                            <ImageFallback
                                                src={sellerLogo}
                                                alt={product.seller.company_name || product.seller.name}
                                                fill
                                                sizes='(100w) 100vw'
                                                priority={true}
                                                style={{ objectFit: 'cover' }}
                                                className="rounded-full"
                                            />
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h3 className="font-medium text-lg">
                                                {product.seller.company_name || product.seller.name}
                                            </h3>
                                            <div className="text-gray-600 space-y-3 mt-2">
                                                {product.seller.address && (
                                                    <p className="flex items-center flex-wrap">
                                                        <span className="w-20 font-medium">Адрес:</span>
                                                        <span>{product.seller.address}</span>
                                                    </p>
                                                )}
                                                {product.seller.phone && (
                                                    <p className="flex items-center flex-wrap">
                                                        <span className="w-20 font-medium">Телефон:</span>
                                                        <span>{product.seller.phone}</span>
                                                    </p>
                                                )}
                                                {product.seller.email && (
                                                    <p className="flex items-center flex-wrap">
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
