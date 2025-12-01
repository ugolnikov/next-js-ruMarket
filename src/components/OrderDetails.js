'use client'

import axios from '@/lib/axios'
import { useState, useEffect } from 'react'
import Loader from '@/components/Loader'
import Button from '@/components/Button'
import { useRouter } from 'next/navigation'
import Modal from '@/components/Modal'
import ImageFallback from './ImageFallback'
import dynamic from 'next/dynamic'
import 'yet-another-react-lightbox/styles.css'

// Легковесный динамический импорт лайтбокса только на клиенте
const Lightbox = dynamic(() => import('yet-another-react-lightbox'), {
    ssr: false,
})
// Плагин zoom можно оставить обычным импортом, он относительно небольшой
import Zoom from 'yet-another-react-lightbox/plugins/zoom'

const loadOrder = async orderNumber => {
    const url = `/api/orders/${orderNumber}`
    try {
        const response = await axios.get(url)
        return response.data
    } catch (error) {
        if (error.response?.status === 404) {
            return null
        }
        throw error
    }
}

export default function OrderDetails({ orderNumber }) {
    const router = useRouter()
    const [order, setOrder] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isError, setIsError] = useState(false)
    const [notFound, setNotFound] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [modalMessage, setModalMessage] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [currentImage, setCurrentImage] = useState(null)

    useEffect(() => {
        if (typeof window === 'undefined') return

        // Check for success parameter in URL
        const urlParams = new URLSearchParams(window.location.search)
        setShowSuccess(urlParams.get('success') === 'true')

        // Remove success parameter from URL without page reload
        if (urlParams.has('success')) {
            urlParams.delete('success')
            const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`
            window.history.replaceState({}, '', newUrl)
        }
    }, [])

    const fetchOrder = async () => {
        if (!orderNumber) return
        try {
            setIsLoading(true)
            setIsError(false)
            setNotFound(false)
            const data = await loadOrder(orderNumber)
            if (data === null) {
                setNotFound(true)
            } else {
                setOrder(data)
            }
        } catch (error) {
            setIsError(true)
            console.error('Error fetching order:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchOrder()
    }, [orderNumber])

    if (isLoading) return <Loader />

    if (notFound) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 p-4 rounded">
                    <p className="text-red-700">Заказ не найден</p>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 p-4 rounded">
                    <p className="text-red-700">Ошибка при загрузке заказа</p>
                </div>
            </div>
        )
    }

    if (!order) return null

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (error) {
            console.error('Error formatting date:', error)
            return 'Дата не указана'
        }
    }

    const formatPrice = (price) => {
        try {
            return Number(price).toLocaleString('ru-RU', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
        } catch (error) {
            console.error('Error formatting price:', error)
            return '0.00'
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'processing':
                return 'bg-blue-100 text-blue-800'
            case 'shipped':
                return 'bg-indigo-100 text-indigo-800'
            case 'delivered':
                return 'bg-purple-100 text-purple-800'
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'cancelled':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }
    
    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Ожидает обработки'
            case 'processing':
                return 'В обработке'
            case 'shipped':
                return 'Отправлен'
            case 'delivered':
                return 'Доставлен'
            case 'completed':
                return 'Выполнен'
            case 'cancelled':
                return 'Отменён'
            default:
                return status
        }
    }
    
    // Add helper functions for payment status
    const getPaymentStatusColor = (paid) => {
        if (paid === true) return 'bg-green-100 text-green-800'
        if (paid === false) return 'bg-red-100 text-red-800'
        return 'bg-gray-100 text-gray-800'
    }
    
    const getPaymentStatusText = (paid) => {
        if (paid === true) return 'Оплачен'
        if (paid === false) return 'Не оплачен'
        return 'Статус не определен'
    }

    const openImageLightbox = (imageUrl, productName) => {
        setCurrentImage({ src: imageUrl, alt: productName })
        setLightboxOpen(true)
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {showSuccess && (
                <div className="mb-6 bg-green-50 p-4 rounded">
                    <p className="text-green-700">
                        Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.
                    </p>
                </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6 gap-8">
                        <Button onClick={() => router.back()} className="text-gray-600 hover:text-white rounded">
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Заказ #{order.orderNumber}
                        </h1>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Информация о заказе</h2>
                                <div className="space-y-2">
                                    <p>
                                        <span className="font-medium">Статус: </span>
                                        <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="font-medium">Статус оплаты: </span>
                                        <span className={`px-2 py-1 rounded-full text-sm ${getPaymentStatusColor(order.paid)}`}>
                                            {getPaymentStatusText(order.paid)}
                                        </span>
                                    </p>
                                    {order.payment_id && (
                                        <p>
                                            <span className="font-medium">Номер оплаты: </span>
                                            {order.payment_id}
                                        </p>
                                    )}
                                    <p>
                                        <span className="font-medium">Дата заказа: </span>
                                        {formatDate(order.createdAt)}
                                    </p>
                                    <p>
                                        <span className="font-medium">Сумма заказа: </span>
                                        {formatPrice(order.totalAmount)} ₽
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold mb-2">Контактная информация</h2>
                                <div className="space-y-2">
                                    <p>
                                        <span className="font-medium">Имя: </span>
                                        {order.fullName}
                                    </p>
                                    <p>
                                        <span className="font-medium">Телефон: </span>
                                        {order.phone}
                                    </p>
                                    <p>
                                        <span className="font-medium">Email: </span>
                                        {order.email}
                                    </p>
                                    <p>
                                        <span className="font-medium">Адрес доставки: </span>
                                        {order.address}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-lg font-semibold mb-4">Товары в заказе</h2>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center space-x-4 border-b border-gray-200 pb-4"
                                >
                                    <div className="flex align-center justify-center items-center flex-shrink-0 w-24 h-24 relative">
                                        <div
                                            className="w-full h-full cursor-zoom-in group flex align-center justify-center items-center"
                                            onClick={() => item.product && openImageLightbox(
                                                item.product.image_preview || '/placeholder-image.jpg',
                                                item.product.name || 'Товар удален'
                                            )}
                                            style={{ position: 'relative' }}
                                        >
                                            <ImageFallback
                                                src={item.product?.image_preview || '/placeholder-image.jpg'}
                                                alt={item.product?.name || 'Товар удален'}
                                                width={96}
                                                height={96}
                                                style={{ width: '100%', height: '100%' }}
                                                className="object-cover rounded transition-transform duration-200 group-hover:scale-105"
                                            />
                                            {item.product && (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    <span className="bg-black/50 text-white px-2 py-1 rounded text-xs font-medium">Увеличить</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium">
                                            {item.product?.name || 'Товар удален'}
                                        </h3>
                                        {item.product ? (
                                            <>
                                                <p className="text-gray-600 hidden sm:block">
                                                    <b>Описание:</b> {item.product.description}
                                                </p>
                                                <p className="text-gray-600 hidden sm:block">
                                                    <b>Единица измерения:</b> {item.product.unit}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-gray-500 italic">
                                                Товар был удален из каталога
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">
                                            {formatPrice(Number(item.price) * item.quantity)} ₽
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Ошибка"
            >
                <p className="text-red-600">{modalMessage}</p>
            </Modal>

            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={currentImage ? [currentImage] : []}
                plugins={[Zoom]}
                animation={{ swipe: 400, fade: 200, zoom: 400, slide: 400 }}
                zoom={{ maxZoomPixelRatio: 4 }}
                render={{
                    buttonPrev: () => null,
                    buttonNext: () => null,
                }}
            />
        </div>
    )
}
