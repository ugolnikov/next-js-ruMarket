'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { XMarkIcon } from '@heroicons/react/24/outline'

const AuthCard = ({ logo, children }) => {
    const pathname = usePathname()
    const router = useRouter()
    
    const isLoginPage = pathname === '/login'
    const isRegisterPage = pathname === '/register'
    
    const handleClose = () => {
        router.push('/')
    }
    
    return (
        <div className="min-h-[100vh] flex flex-col justify-center items-center pt-6 sm:pt-0 bg-gray-100">
            <div>{logo}</div>

            <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-white shadow-md overflow-hidden sm:rounded-lg relative">
                {/* Close button */}
                <button 
                    onClick={handleClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    aria-label="Close"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
                
                {children}
                
                {/* Toggle between login and register */}
                <div className="mt-6 text-center">
                    {isLoginPage && (
                        <Link 
                            href="/register" 
                            className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                            Нет аккаунта? Зарегистрироваться
                        </Link>
                    )}
                    
                    {isRegisterPage && (
                        <Link 
                            href="/login" 
                            className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                            Уже есть аккаунт? Войти
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AuthCard
