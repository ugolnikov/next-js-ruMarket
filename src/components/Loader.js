'use client'
import React from 'react'

// Универсальный лоадер: по умолчанию полноэкранный, но может быть и компактным
const Loader = ({ fullScreen = true, className = '' }) => {
    return (
        <div
            className={`flex justify-center items-center ${
                fullScreen ? 'min-h-screen' : ''
            } ${className}`.trim()}
        >
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#4438ca] rounded-full animate-spin" />
        </div>
    )
}

export default Loader
