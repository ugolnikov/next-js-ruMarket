'use client'
import Link from 'next/link'
import AuthCard from '@/app/(auth)/AuthCard'
import ApplicationLogo from '@/components/ApplicationLogo'
import Navigation from '@/components/Navigation'
import ClientLayout from './ClientLayout'

const AuthLayoutClient = ({ children }) => {
    return (
        <main>
            <div className="text-gray-900 antialiased">
                <AuthCard
                    logo={
                        <Link href="/">
                            <ApplicationLogo className="w-20 h-20 fill-current text-gray-500" />
                        </Link>
                    }>
                    <ClientLayout>{children}</ClientLayout>
                </AuthCard>
            </div>
        </main>
    )
}

export default AuthLayoutClient