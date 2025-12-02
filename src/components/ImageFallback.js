'use client'
import Image from 'next/image'
import { useState } from 'react'
import Loader from '@/components/Loader'

const ImageFallback = ({ src, fallbackSrc = '/images/placeholder.jpg', alt, className, ...props }) => {
    const [imgSrc, setImgSrc] = useState(src || fallbackSrc)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)

    const handleError = () => {
        if (!error) {
            setError(true)
            setImgSrc('/images/placeholder.jpg')
        }
    }

    // Если используется fill, убедимся что родительский элемент имеет position: relative
    const containerStyle = props.fill
        ? { position: 'relative', width: '100%', height: '100%' }
        : {}

    return (
        <div className={`${props.className || ''}`} style={containerStyle}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="scale-50">
                        {/* Компактный лоадер для изображений */}
                        <Loader fullScreen={false} />
                    </div>
                </div>
            )}
            <Image
                {...props}
                src={imgSrc}
                alt={alt || 'Product image'}
                onError={handleError}
                className={`${error ? 'opacity-75' : className}`}
                unoptimized={error}
                onLoad={() => setIsLoading(false)}
            />
        </div>
    )
}

export default ImageFallback 