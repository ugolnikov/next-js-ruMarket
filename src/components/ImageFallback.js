'use client'
import Image from 'next/image'
import { useState } from 'react'

const ImageFallback = ({ src, fallbackSrc = '/images/placeholder.jpg', alt, ...props }) => {
    const [imgSrc, setImgSrc] = useState(src || fallbackSrc)
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
        <div 
            className={`${props.className || ''}`} 
            style={containerStyle}
        >
            <Image
                {...props}
                src={imgSrc}
                alt={alt || 'Product image'}
                onError={handleError}
                className={`${error ? 'opacity-75' : ''}`}
                unoptimized={error}
            />
        </div>
    )
}

export default ImageFallback 