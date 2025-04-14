'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

const WelcomeBoard = () => {
    const [currentSlide, setCurrentSlide] = useState(0)

    const slides = [
        '/images/slider/slide1.jpg',
        '/images/slider/slide2.jpg',
        '/images/slider/slide3.jpg',
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 7000) 

        return () => clearInterval(timer)
    }, [])

    return (
        <div className="relative w-full h-[500px] overflow-hidden mb-5 rounded-md">
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute w-full h-full transition-opacity duration-500 ${
                        index === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    <Image
                        src={slide}
                        alt={`Slide ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                        priority={index === 0}
                        quality={100}
                    />
                </div>
            ))}
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        className={`w-3 h-3 rounded-full ${
                            index === currentSlide ? 'bg-white' : 'bg-white/50'
                        }`}
                        onClick={() => setCurrentSlide(index)}
                    />
                ))}
            </div>
        </div>
    )
}

export default WelcomeBoard