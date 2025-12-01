'use client'
import React from 'react'

const Loader = () => {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#4438ca] rounded-full animate-spin" />
        </div>
    )
}

export default Loader
