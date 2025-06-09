"use client"
import { useEffect, useState } from 'react'
import WelcomeScreen from './WelcomeScreen'

export default function ClientLayout({ children }) {
    const [showWelcome, setShowWelcome] = useState(false)

    useEffect(() => {
        if (!localStorage.getItem('welcome_shown')) {
            setShowWelcome(true)
        }
        const handler = () => setShowWelcome(true)
        window.addEventListener('show-welcome', handler)
        return () => window.removeEventListener('show-welcome', handler)
    }, [])

    const handleContinue = () => {
        setShowWelcome(false)
        localStorage.setItem('welcome_shown', '1')
    }

    return (
        <>
            {showWelcome && <WelcomeScreen onContinue={handleContinue} />}
            {!showWelcome && children}
        </>
    )
}