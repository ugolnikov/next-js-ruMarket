'use client'
import { useAuth } from '@/hooks/auth'
import Navigation from '@/components/Navigation'
import Loader from '@/components/Loader'
import Footer from '@/components/Footer'
import { useEffect, useState } from 'react'
import WelcomeScreen from '@/app/WelcomeScreen'

const AppLayout = ({ children }) => {
    const { user, status } = useAuth({ middleware: 'guest' })
    const [showWelcome, setShowWelcome] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('welcome_shown')) {
            setShowWelcome(true)
        }

        const handler = () => setShowWelcome(true)
        window.addEventListener('show-welcome', handler)

        return () => {
            window.removeEventListener('show-welcome', handler)
        }
    }, [])

    const handleContinue = () => {
        setShowWelcome(false)
        if (typeof window !== 'undefined') {
            localStorage.setItem('welcome_shown', '1')
        }
    }

    if (status === 'loading') {
        return <Loader />
    }

    return (
        <>
            {showWelcome && <WelcomeScreen onContinue={handleContinue} />}
            {!showWelcome && (
                <div className="min-h-screen bg-gray-100 ">
                    <Navigation user={user} />
                    <main>{children}</main>
                    <Footer />
                </div>
            )}
        </>
    )
}

export default AppLayout
