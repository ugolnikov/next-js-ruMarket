'use client'
import { useState } from 'react'
import Image from 'next/image'
import Loader from '@/components/Loader'

const ImageWithLoader = ({ src, alt, width, height, className }) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    // Используем более простой формат URL
    const placeholderUrl = `https://parpol.ru/wp-content/uploads/2019/09/placeholder.png`

    const handleError = () => {
        setHasError(true)
        setIsLoading(false)
    }

    if (hasError) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-100 ${className}`}
                style={{ width, height }}
            >
                <span className="text-gray-500">Ошибка загрузки изображения</span>
            </div>
        )
    }

    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="scale-50">
                        {/* Компактный лоадер, без min-h-screen */}
                        <Loader fullScreen={false} />
                    </div>
                </div>
            )}
            <Image
                src={placeholderUrl}
                alt={alt}
                width={width}
                height={height}
                className={className}
                onLoad={() => setIsLoading(false)}
                onError={handleError}
                priority={true}
            />
        </div>
    )
}

export default ImageWithLoader 
