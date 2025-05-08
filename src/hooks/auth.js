'use client'

import useSWR from 'swr'
import axios from '@/lib/axios'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'

export const useAuth = ({ middleware, redirectIfAuthenticated } = {}) => {
    const router = useRouter()
    const { data: session, status, update: sessionUpdate } = useSession()

    const {
        data: cart,
        error: cartError,
        mutate: mutateCart,
    } = useSWR(
        session ? '/api/cart' : null,
        () =>
            axios
                .get('/api/cart')
                .then(res => res.data)
                .catch(error => {
                    if (error.response?.status === 401) {
                        return null
                    }
                    throw error
                }),
    )

    const login = async ({ email, password, setError, setStatus }) => {
        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            })

            if (result?.error) {
                if (setError) {
                    setError('email', { message: 'Неверные учетные данные' })
                }
                if (setStatus) {
                    setStatus('Неверные учетные данные')
                }
                return
            }
            router.push('/dashboard')
        } catch (error) {
            if (setError) {
                setError('email', { message: 'Произошла ошибка при входе' })
            }
            if (setStatus) {
                setStatus('Произошла ошибка при входе')
            }
            console.error('Login error:', error)
        }
    }

    const logout = async () => {
        await signOut({ redirect: false })
        router.push('/login')
    }

    const register = async ({ name, email, password, password_confirmation, setError, setStatus }) => {
        try {
            const response = await axios.post('/api/register', {
                name,
                email,
                password,
                password_confirmation,
            })

            if (response.data.error) {
                if (setError) {
                    setError('email', { message: response.data.error })
                }
                if (setStatus) {
                    setStatus(response.data.error)
                }
                return
            }

            // После успешной регистрации выполняем вход
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            })

            if (result?.error) {
                if (setError) {
                    setError('email', { message: 'Ошибка входа после регистрации' })
                }
                if (setStatus) {
                    setStatus('Ошибка входа после регистрации')
                }
                return
            }

            router.push('/dashboard')
        } catch (error) {
            if (error.response?.data?.errors) {
                Object.keys(error.response.data.errors).forEach(key => {
                    if (setError) {
                        setError(key, {
                            message: error.response.data.errors[key][0]
                        })
                    }
                })
            } else {
                if (setError) {
                    setError('email', { message: 'Произошла ошибка при регистрации' })
                }
                if (setStatus) {
                    setStatus('Произошла ошибка при регистрации')
                }
            }
            console.error('Registration error:', error)
        }
    }
    const updatePhone = async (phone) => {
        try {
            const response = await axios.put('/api/user/profile', { phone })
            
            if (response.data.success) {
                // Force refresh the session to get updated user data
                const event = new Event('visibilitychange')
                document.dispatchEvent(event)
                return { success: true }
            }
            
            return {
                success: false,
                errors: response.data.errors
            }
        } catch (error) {
            return {
                success: false,
                errors: {
                    phone: [error.response?.data?.errors?.phone?.[0] || 'Failed to update phone number']
                }
            }
        }
    }

    useEffect(() => {
        if (status === 'loading') return

        if (middleware === 'guest' && redirectIfAuthenticated && session) {
            router.push(redirectIfAuthenticated)
        }

        if (middleware === 'auth' && !session) {
            router.push('/login')
        }
    }, [session, status, middleware, redirectIfAuthenticated])


    return {
        user: session?.user,
        cart,
        login,
        logout,
        register,
        status,
        updatePhone,
        mutateCart,
        mutate: sessionUpdate
    }
}
