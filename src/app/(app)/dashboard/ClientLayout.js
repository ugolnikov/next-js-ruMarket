'use client'
import { useAuth } from '@/hooks/auth'
import Loader from '@/components/Loader'

const ClientLayout = ({ children }) => {
    const { user, isLoading } = useAuth({ middleware: 'auth' })

    if (isLoading) {
        return <Loader />
    }

    if (!user) {
        return null
    }

    return children
}

export default ClientLayout