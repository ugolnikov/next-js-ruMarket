'use client'
import { useAuth } from '@/hooks/auth'
import Loader from '@/components/Loader'

const ClientLayout = ({ children }) => {
    const { user, isLoading } = useAuth({ middleware: 'guest' })
    
    if (isLoading) {
        return <Loader />
    }
    
    return children
}

export default ClientLayout