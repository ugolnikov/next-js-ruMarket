import AdminNavigation from '@/components/AdminNavigation'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function AdminLayout({ children }) {
    const session = await auth()
    
    // Проверяем, авторизован ли пользователь и является ли он администратором
    if (!session?.user || !session.user.is_admin) {
        redirect('/login?callbackUrl=/admin')
    }
    
    return (
        <div className="min-h-screen bg-gray-100">
            <AdminNavigation />
            
            <div className="lg:pl-64">
                <main className="py-6 px-4 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    )
}