'use client'
import { useAuth } from '@/hooks/auth'
import Loader from '@/components/Loader'

const DashboardLayout = ({ children }) => {
    const { user, status } = useAuth({ middleware: 'auth' })

    if (status === 'loading') {
        return <Loader />
    }

    if (!user) {
        return null
    }

    return <div className="min-h-screen bg-gray-100">{children}</div>
}

export default DashboardLayout
