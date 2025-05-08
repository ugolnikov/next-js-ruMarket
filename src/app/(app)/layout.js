'use client'
import { useAuth } from '@/hooks/auth'
import Navigation from '@/components/Navigation'
import Loader from '@/components/Loader'
import Footer from '@/components/Footer'


const AppLayout = ({ children }) => {
    const { user, status } = useAuth({ middleware: 'guest' })
    if (status === 'loading') {
        return <Loader />
      }
    return (
            <div className="min-h-screen bg-gray-100">
                <Navigation user={user}/>
                <main>{children}</main>
                <Footer/>
            </div>
    )
}

export default AppLayout
