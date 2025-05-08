'use client'
import { useAuth } from '@/hooks/auth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Loader from '@/components/Loader'
import AdminSidebar from '@/components/AdminSidebar'
import Footer from '@/components/Footer'

// This is a wrapper layout that will only handle client-side redirects
// The actual admin UI is handled by the admin/layout.js file
const AdminLayoutWrapper = ({ children }) => {
    const { user, isLoading } = useAuth({ middleware: 'auth' })
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Only redirect if we're on an admin page and the user is not an admin
        if (!isLoading && user && !user.is_admin && pathname.startsWith('/admin')) {
            router.push('/dashboard')
        }
    }, [user, isLoading, router, pathname])

    if (isLoading) {
        return <Loader />
    }

    // Let the server component handle the actual layout and server-side redirects
    return children
}

export default AdminLayoutWrapper